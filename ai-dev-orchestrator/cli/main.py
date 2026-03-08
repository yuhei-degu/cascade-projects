#!/usr/bin/env python3
"""
cli/main.py
ai-dev コマンドのエントリーポイント
使い方:
  ai-dev start  "アイデアを入力"   ← 自動開発を開始
  ai-dev status                    ← 進捗を表示
  ai-dev task                      ← タスク一覧を表示
  ai-dev fix  "エラーログを貼る"   ← バグを自動修正
  ai-dev create project-name       ← 新プロジェクトを作成
  ai-dev memory                    ← AIメモリを表示
"""

import sys
import os
import argparse
import json
from pathlib import Path
from datetime import datetime

# プロジェクトルートをパスに追加
ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT))

from orchestrator.core import MemoryManager, OrchestratorLogger
from orchestrator.git_manager import GitManager


# ── ヘルパー ────────────────────────────────────────────────────────
def _check_api_key():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("❌ ANTHROPIC_API_KEY が設定されていません")
        print("   export ANTHROPIC_API_KEY='sk-ant-...'")
        sys.exit(1)

def _get_project_dir() -> Path:
    """カレントディレクトリをプロジェクトルートとして返す"""
    return Path.cwd()

def _print_header(title: str):
    width = 56
    print("\n" + "═" * width)
    print(f"  ⚡ AI Dev Orchestrator — {title}")
    print("═" * width)

def _print_file(fname: str, memory: MemoryManager, max_lines: int = 30):
    content = memory.read(fname)
    lines = content.split("\n")
    for line in lines[:max_lines]:
        print(line)
    if len(lines) > max_lines:
        print(f"  ... ({len(lines) - max_lines} 行省略) ...")


# ── コマンド実装 ─────────────────────────────────────────────────────

def cmd_start(args):
    """自動開発を開始"""
    _check_api_key()
    idea = " ".join(args.idea) if args.idea else input("📝 プロダクトのアイデアを入力: ")
    project_name = args.name or Path.cwd().name

    _print_header(f"START — {project_name}")
    print(f"\n💡 アイデア: {idea}")
    print(f"📁 プロジェクト: {_get_project_dir()}\n")

    # ai-memoryディレクトリを確認
    mem_dir = _get_project_dir() / "ai-memory"
    mem_dir.mkdir(exist_ok=True)

    from orchestrator.loop import OrchestratorLoop
    loop = OrchestratorLoop(
        project_dir=_get_project_dir(),
        project_name=project_name,
        idea=idea,
    )
    loop.run()


def cmd_status(args):
    """進捗を表示"""
    _print_header("STATUS")
    project_dir = _get_project_dir()
    mem_dir = project_dir / "ai-memory"

    if not mem_dir.exists():
        print("\n⚠️  ai-memoryが見つかりません。`ai-dev start` を実行してください。")
        return

    memory = MemoryManager()

    # PROGRESS.md を表示
    print("\n📊 PROGRESS.md")
    print("─" * 40)
    _print_file("PROGRESS.md", memory, max_lines=25)

    # Git情報
    git = GitManager(project_dir)
    logs = git.get_log(5)
    if logs:
        print("\n🔀 最近のコミット")
        print("─" * 40)
        for l in logs:
            print(f"  {l['hash']}  {l['message'][:55]}")

    # ログファイル一覧
    logs_dir = project_dir / "logs"
    if logs_dir.exists():
        log_files = sorted(logs_dir.glob("*.log"), reverse=True)[:3]
        if log_files:
            print(f"\n📋 ログファイル: {logs_dir}")
            for lf in log_files:
                print(f"  {lf.name}")


def cmd_task(args):
    """タスク一覧を表示"""
    _print_header("TASKS")
    memory = MemoryManager()
    content = memory.read("TASKS.md")
    if not content:
        print("\n⚠️  TASKS.mdが見つかりません。`ai-dev start` を実行してください。")
        return

    # ステータスごとに分類して表示
    done, running, pending, failed = [], [], [], []
    for line in content.split("\n"):
        stripped = line.strip()
        if stripped.startswith("- [x]"):  done.append(stripped)
        elif stripped.startswith("- [>]"): running.append(stripped)
        elif stripped.startswith("- [ ]"): pending.append(stripped)
        elif stripped.startswith("- [!]"): failed.append(stripped)

    print(f"\n✅ 完了: {len(done)}  ▶ 実行中: {len(running)}  "
          f"⬜ 待機: {len(pending)}  ❌ 失敗: {len(failed)}\n")

    if running:
        print("▶ 実行中")
        for t in running: print(f"  {t}")
    if pending:
        print("\n⬜ 待機中")
        for t in pending[:10]: print(f"  {t}")
        if len(pending) > 10: print(f"  ... (+{len(pending)-10} tasks)")
    if failed:
        print("\n❌ 失敗")
        for t in failed: print(f"  {t}")
    if done:
        print(f"\n✅ 完了済み: {len(done)} tasks")


def cmd_fix(args):
    """バグを自動修正"""
    _check_api_key()
    error_log = " ".join(args.error) if args.error else input("🐛 エラーログを貼り付け: ")
    bug_id = f"BUG-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    _print_header(f"FIX — {bug_id}")
    print(f"\n🔍 エラー分析中...\n")

    project_dir = _get_project_dir()
    memory = MemoryManager()
    logger = OrchestratorLogger(project_dir.name)

    from orchestrator.agents_impl import CodexAgent
    codex = CodexAgent("CODEX", memory, logger)

    # 関連ファイルを収集
    code_files = {}
    for f in sorted(project_dir.glob("src/**/*.py"))[:5]:
        try:
            code_files[str(f.relative_to(project_dir))] = \
                f.read_text(encoding="utf-8")[:2000]
        except Exception:
            pass

    result = codex.fix_bug(bug_id, error_log, code_files, project_dir)
    print(f"\n✅ 修正完了: {len(result.get('files_fixed', []))} ファイル")
    for f in result.get("files_fixed", []):
        print(f"  📄 {f}")

    # 自動コミット
    git = GitManager(project_dir)
    commit_hash = git.commit(f"🐛 {bug_id}: Auto-fixed by CODEX", "CODEX")
    print(f"\n🔀 コミット: {commit_hash}")


def cmd_create(args):
    """新プロジェクトを作成"""
    project_name = args.project_name
    base_dir = Path.cwd() / project_name

    _print_header(f"CREATE — {project_name}")

    if base_dir.exists():
        print(f"\n⚠️  {project_name}/ は既に存在します")
        return

    # テンプレートからコピー
    template_dir = ROOT / "templates" / "project"
    if template_dir.exists():
        import shutil
        shutil.copytree(template_dir, base_dir)
    else:
        base_dir.mkdir()

    # 必須ディレクトリを作成
    for d in ["ai-memory", "src", "tests", "logs", "ai-prompts"]:
        (base_dir / d).mkdir(exist_ok=True)

    # ai-memoryファイルを初期化
    mem_src = ROOT / "ai-memory"
    mem_dst = base_dir / "ai-memory"
    for fname in ["SPEC.md", "ARCHITECTURE.md", "TASKS.md", "PROGRESS.md", "BUGS.md"]:
        src = mem_src / fname
        dst = mem_dst / fname
        if src.exists() and not dst.exists():
            import shutil
            shutil.copy(src, dst)
        elif not dst.exists():
            dst.write_text(f"# {fname}\n\n_未記入_\n", encoding="utf-8")

    # .env.exampleを作成
    env_example = base_dir / ".env.example"
    env_example.write_text(
        "ANTHROPIC_API_KEY=sk-ant-your-key-here\n"
        "OPENAI_API_KEY=sk-your-key-here\n",
        encoding="utf-8"
    )

    # README
    readme = base_dir / "README.md"
    readme.write_text(
        f"# {project_name}\n\n"
        "## セットアップ\n"
        "```bash\ncd {}\n"
        "cp .env.example .env\n"
        "ai-dev start \"アイデアを入力\"\n```\n".format(project_name),
        encoding="utf-8"
    )

    # git初期化
    git = GitManager(base_dir)
    git.init()
    git.commit(f"🎉 {project_name}: Initial project created", "ORCHESTRATOR")

    print(f"\n✅ プロジェクト作成完了!")
    print(f"   📁 {base_dir}")
    print(f"\n次のステップ:")
    print(f"   cd {project_name}")
    print(f"   cp .env.example .env  # APIキーを設定")
    print(f"   ai-dev start \"あなたのアイデア\"")


def cmd_memory(args):
    """AIメモリを表示"""
    _print_header("MEMORY")
    memory = MemoryManager()
    fname = getattr(args, "file", None) or "all"

    files = MemoryManager.FILES if fname == "all" else [fname]
    for f in files:
        print(f"\n{'═'*40}\n📄 {f}\n{'═'*40}")
        _print_file(f, memory, max_lines=20)


# ── メイン ───────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        prog="ai-dev",
        description="⚡ AI Dev Orchestrator — AIが24時間自動開発",
    )
    sub = parser.add_subparsers(dest="command")

    # start
    p_start = sub.add_parser("start", help="自動開発を開始")
    p_start.add_argument("idea", nargs="*", help="プロダクトのアイデア")
    p_start.add_argument("--name", "-n", help="プロジェクト名")

    # status
    sub.add_parser("status", help="進捗を確認")

    # task
    sub.add_parser("task", help="タスク一覧を表示")

    # fix
    p_fix = sub.add_parser("fix", help="バグを自動修正")
    p_fix.add_argument("error", nargs="*", help="エラーログ")

    # create
    p_create = sub.add_parser("create", help="新プロジェクトを作成")
    p_create.add_argument("project_name", help="プロジェクト名")

    # memory
    p_mem = sub.add_parser("memory", help="AIメモリを表示")
    p_mem.add_argument("file", nargs="?", default="all",
                       choices=["all"] + MemoryManager.FILES,
                       help="表示するファイル")

    args = parser.parse_args()

    dispatch = {
        "start":  cmd_start,
        "status": cmd_status,
        "task":   cmd_task,
        "fix":    cmd_fix,
        "create": cmd_create,
        "memory": cmd_memory,
    }

    if args.command in dispatch:
        dispatch[args.command](args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
