#!/usr/bin/env python3
"""AI Dev Orchestrator v2 core loop.

Rules (see SPEC.md):
- Humans write tasks. This script NEVER creates, rescopes, or generates tasks.
- One task per run. Stop after every task so a human reviews the diff.
- One fix retry max. Second failure -> mark [!] and stop.
- The only state is TASKS.md marks: [ ] pending, [~] running, [x] done, [!] needs human.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CFG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
TASKS_FILE = ROOT / "TASKS.md"
TASK_RE = re.compile(r"^- \[( |~|x|!)\] (.+)$")


def load():
    lines = TASKS_FILE.read_text(encoding="utf-8").splitlines()
    tasks = []
    for i, line in enumerate(lines):
        m = TASK_RE.match(line)
        if m:
            tasks.append({"line": i, "mark": m.group(1), "text": m.group(2)})
    return lines, tasks


def set_mark(task, mark):
    lines, _ = load()
    lines[task["line"]] = f"- [{mark}] {task['text']}"
    TASKS_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")


def run_agent(prompt):
    repo = CFG["target_repo"]
    cmd = [a.format(repo=repo) for a in CFG["agent_command"]]
    cmd[0] = shutil.which(cmd[0]) or cmd[0]
    print(f"[agent] {' '.join(c[:80] for c in cmd)}")
    return subprocess.run(cmd, cwd=repo, input=prompt.encode("utf-8")).returncode


def has_changes():
    r = subprocess.run(["git", "status", "--porcelain"], cwd=CFG["target_repo"], capture_output=True)
    return bool(r.stdout.strip())


def verify():
    print(f"[verify] {CFG['verify_command']}")
    return subprocess.run(CFG["verify_command"], cwd=CFG["target_repo"], shell=True).returncode


def git_commit(task_text):
    repo = CFG["target_repo"]
    subprocess.run(["git", "add", "-A"], cwd=repo)
    msg = f"v2: {task_text[:120]}"
    return subprocess.run(["git", "commit", "-m", msg], cwd=repo).returncode


def run_one():
    _, tasks = load()
    stuck = [t for t in tasks if t["mark"] in ("~", "!")]
    if stuck:
        print("STOP: unresolved task needs a human first:")
        for t in stuck:
            print(f"  [{t['mark']}] {t['text']}")
        sys.exit(1)
    nxt = next((t for t in tasks if t["mark"] == " "), None)
    if nxt is None:
        print("No pending tasks. A human may add tasks to TASKS.md.")
        return "empty"
    print(f"TASK: {nxt['text']}")
    set_mark(nxt, "~")

    prompt = CFG["prompt_template"].format(repo=CFG["target_repo"], task=nxt["text"])
    rc = run_agent(prompt)
    ok = rc == 0 and has_changes() and verify() == 0

    if not ok and CFG.get("max_fix_retries", 1) >= 1:
        print("[retry] one fix attempt")
        fix_prompt = (
            prompt
            + "\n\nThe previous attempt failed verification. Fix the build/tests. "
            + "Do not expand scope."
        )
        rc = run_agent(fix_prompt)
        ok = rc == 0 and has_changes() and verify() == 0

    if ok:
        set_mark(nxt, "x")
        if CFG.get("auto_commit", False):
            git_commit(nxt["text"])
            print("DONE + committed. Diff is reviewable in git log.")
        else:
            print("DONE. Review the diff in the target repo, commit it, then run again.")
        return "done"
    else:
        set_mark(nxt, "!")
        print("FAILED twice. Marked [!]. A human decides what happens next.")
        sys.exit(1)


def main():
    if "--all" in sys.argv:
        while run_one() == "done":
            pass
    else:
        run_one()


if __name__ == "__main__":
    main()
