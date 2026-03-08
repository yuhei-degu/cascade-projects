"""
orchestrator/git_ops.py
Git操作ラッパー — AIが commit / log / diff を実行する
"""
from __future__ import annotations
import subprocess
from pathlib import Path
from datetime import datetime


def run_git(args: list[str], cwd: Path) -> tuple[int, str, str]:
    """gitコマンドを実行して (returncode, stdout, stderr) を返す"""
    result = subprocess.run(
        ["git"] + args,
        cwd=cwd,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    return result.returncode, result.stdout.strip(), result.stderr.strip()


def init_repo(project_dir: Path) -> bool:
    code, _, _ = run_git(["init"], project_dir)
    if code == 0:
        run_git(["add", "."], project_dir)
        run_git(["commit", "-m", "🎉 initial commit by AI Dev Orchestrator"], project_dir)
    return code == 0


def auto_commit(project_dir: Path, message: str, task_id: str = "") -> str:
    """変更をステージングしてコミット。コミットハッシュを返す"""
    run_git(["add", "-A"], project_dir)
    prefix = f"[{task_id}] " if task_id else ""
    full_msg = f"{prefix}{message}"
    code, out, err = run_git(["commit", "-m", full_msg], project_dir)
    if code != 0:
        return ""
    # ハッシュ取得
    _, hash_out, _ = run_git(["rev-parse", "--short", "HEAD"], project_dir)
    return hash_out


def get_recent_log(project_dir: Path, n: int = 10) -> str:
    """直近n件のコミットログを返す"""
    _, out, _ = run_git(
        ["log", f"-{n}", "--oneline", "--graph", "--decorate"],
        project_dir,
    )
    return out


def get_diff(project_dir: Path) -> str:
    """直近コミットとのdiffを返す"""
    _, out, _ = run_git(["diff", "HEAD"], project_dir)
    return out[:3000]  # 長すぎる場合は切り詰め


def get_changed_files(project_dir: Path) -> list[str]:
    """変更されたファイルリストを返す"""
    _, out, _ = run_git(["status", "--porcelain"], project_dir)
    files = []
    for line in out.splitlines():
        if line.strip():
            files.append(line[3:].strip())
    return files
