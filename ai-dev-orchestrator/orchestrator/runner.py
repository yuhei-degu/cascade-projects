"""
orchestrator/runner.py
AI Dev Orchestratorのメインループエンジン
フロー: 要件分析 → タスク分割 → コード生成 → テスト → バグ修正 → commit → 進捗更新
"""
from __future__ import annotations
import time
from pathlib import Path
from datetime import datetime
from typing import Optional

from . import memory, logger
from .git_ops import auto_commit, get_recent_log, init_repo
from .design_agent import DesignAgent
from .code_agent import CodeAgent
from .fix_agent import FixAgent
from .test_agent import TestAgent


MAX_CYCLES       = 50   # 最大ループ回数（無限ループ防止）
MAX_BUG_RETRIES  = 3    # バグ1件につき最大修正試行回数
CYCLE_INTERVAL_S = 2    # サイクル間のスリープ秒数


class Orchestrator:
    """AIエージェントを束ねるオーケストレーター"""

    def __init__(self, project: str, project_dir: Path, dry_run: bool = False):
        self.project     = project
        self.project_dir = project_dir
        self.dry_run     = dry_run   # Trueならファイル書き込み・commitをスキップ
        self.cycle       = 0
        self.bug_retries: dict[str, int] = {}

        # エージェント初期化
        self.design = DesignAgent(project, project_dir)
        self.code   = CodeAgent(project, project_dir)
        self.fix    = FixAgent(project, project_dir)
        self.test   = TestAgent(project, project_dir)

    # ──────────────────────────────────────────────
    # パブリックAPI
    # ──────────────────────────────────────────────

    def start(self, idea: str) -> None:
        """アイデアを受け取りフルサイクルを開始する"""
        self._print_banner()
        self._log("orchestrator", "start", f"プロジェクト開始: {self.project}")

        # Step 0: Gitリポジトリ初期化
        if not (self.project_dir / ".git").exists():
            init_repo(self.project_dir)
            self._log("orchestrator", "git_init", "Gitリポジトリを初期化しました")

        # Step 1: 設計・タスク分割
        print("\n🎯 [STEP 1] 要件分析・タスク分割...")
        result = self.design.run({"idea": idea, "title": idea[:50], "id": "INIT"})
        print(f"   → {result.get('tasks_created', 0)}件のタスクを生成しました")

        # Step 2: メインループ
        self._run_loop()

    def run_single_task(self, task_id: str) -> None:
        """指定タスクIDのみを実行する"""
        tasks = memory.get_todo_tasks()
        task = next((t for t in tasks if t["id"] == task_id), None)
        if not task:
            print(f"❌ タスク {task_id} が見つかりません")
            return
        self._execute_task(task)

    def fix_bugs(self) -> None:
        """BUGS.mdのOPENバグを全て修正する"""
        bugs = self._get_open_bugs()
        if not bugs:
            print("✅ 修正が必要なバグはありません")
            return
        for bug in bugs:
            self._fix_single_bug(bug)

    # ──────────────────────────────────────────────
    # メインループ
    # ──────────────────────────────────────────────

    def _run_loop(self) -> None:
        while self.cycle < MAX_CYCLES:
            self.cycle += 1
            print(f"\n🔄 [CYCLE {self.cycle:03d}] ─────────────────────")

            # 未完了タスクを取得
            todos = memory.get_todo_tasks()
            if not todos:
                print("✅ 全タスク完了！")
                break

            # 優先度順に実行
            high = [t for t in todos if t["priority"] == "HIGH"]
            queue = high if high else todos
            task = queue[0]

            print(f"   📋 実行: [{task['id']}] {task['title']}")
            completed_ids = self._execute_task(task)

            # テスト実行
            print("   🧪 テスト実行中...")
            test_result = self.test.run({"id": f"TEST-{self.cycle}", "title": "自動テスト"})
            bugs_found = test_result.get("bugs_found", 0)

            # バグ修正
            if bugs_found > 0:
                print(f"   🐛 {bugs_found}件のバグを検出 → 修正中...")
                self.fix_bugs()

            # コミット
            commit_hash = ""
            if not self.dry_run:
                commit_hash = auto_commit(
                    self.project_dir,
                    f"♻️ cycle {self.cycle:03d}: {task.get('title','')[:40]}",
                    task.get("id", "")
                )
                if commit_hash:
                    print(f"   💾 commit: {commit_hash}")

            # 進捗更新
            memory.append_progress(
                self.cycle,
                completed_ids,
                bugs_found,
                commit_hash
            )

            # 全タスク確認
            remaining = len(memory.get_todo_tasks())
            print(f"   📊 残タスク: {remaining}件")
            if remaining == 0:
                print("\n🎉 全タスク完了！プロジェクトが完成しました！")
                break

            time.sleep(CYCLE_INTERVAL_S)

        self._print_summary()

    # ──────────────────────────────────────────────
    # タスク実行
    # ──────────────────────────────────────────────

    def _execute_task(self, task: dict) -> list[str]:
        memory.update_task_status(task["id"], "DOING", "CodeAgent")
        try:
            result = self.code.run(task)
            return [task["id"]] if result.get("status") == "done" else []
        except Exception as e:
            self._log("orchestrator", "task_error", str(e), task["id"], "error")
            memory.update_task_status(task["id"], "FAILED")
            return []

    def _fix_single_bug(self, bug: dict) -> None:
        bug_id = bug["id"]
        retries = self.bug_retries.get(bug_id, 0)
        if retries >= MAX_BUG_RETRIES:
            self._log("orchestrator", "bug_skip", f"最大リトライ超過: {bug_id}", status="warn")
            return
        self.bug_retries[bug_id] = retries + 1
        self.fix.run({
            "id": f"FIX-{bug_id}",
            "bug_id": bug_id,
            "title": bug.get("title", ""),
            "error": bug.get("actual", ""),
            "steps": bug.get("steps", ""),
        })

    def _get_open_bugs(self) -> list[dict]:
        content = memory.read("bugs")
        bugs = []
        for line in content.splitlines():
            if "| OPEN |" in line:
                parts = [p.strip() for p in line.strip("|").split("|")]
                if len(parts) >= 5:
                    bugs.append({"id": parts[0], "title": parts[3]})
        return bugs

    # ──────────────────────────────────────────────
    # ユーティリティ
    # ──────────────────────────────────────────────

    def _log(self, agent: str, action: str, detail: str,
             task_id: str = "", status: str = "ok") -> None:
        logger.log(self.project, agent, action, task_id, detail, status)

    def _print_banner(self) -> None:
        print("""
╔══════════════════════════════════════════════════════╗
║       🤖  AI Dev Orchestrator  — 自動開発システム      ║
║   Claude(設計) → Code(実装) → Test → Fix → commit    ║
╚══════════════════════════════════════════════════════╝""")

    def _print_summary(self) -> None:
        log_str = logger.format_logs_for_display(self.project, n=15)
        git_log = get_recent_log(self.project_dir, n=5)
        print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 実行ログ（直近15件）:
{log_str}

📝 Gitログ:
{git_log}
━━━━━━━━━━━━━━━━━━━━━━━━━━""")
