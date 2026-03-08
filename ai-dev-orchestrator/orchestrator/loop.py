"""
orchestrator/loop.py
メインオーケストレーションループ
要件分析 → タスク分割 → 実装 → テスト → バグ修正 → commit を自動で回す
"""

import time
import json
from pathlib import Path
from datetime import datetime

from .core import MemoryManager, OrchestratorLogger
from .git_manager import GitManager


class OrchestratorLoop:
    MAX_FIX_RETRIES = 3  # バグ修正の最大リトライ数

    def __init__(self, project_dir: Path, project_name: str, idea: str):
        self.project_dir  = Path(project_dir)
        self.project_name = project_name
        self.idea         = idea
        self.memory       = MemoryManager()
        self.logger       = OrchestratorLogger(project_name)
        self.git          = GitManager(self.project_dir)

        # 遅延import（APIキーが後から設定される場合に対応）
        from .agents import ClaudeAgent
        from .agents_impl import CursorAgent, CodexAgent, TestAgent
        self.claude = ClaudeAgent("CLAUDE",   self.memory, self.logger)
        self.cursor = CursorAgent("CURSOR",   self.memory, self.logger)
        self.codex  = CodexAgent("CODEX",    self.memory, self.logger)
        self.tester = TestAgent("TEST_AI",  self.memory, self.logger)

    # ────────────────────────────────────────────────────────────────
    def run(self):
        """フルオーケストレーションを実行"""
        self.logger.log("ORCHESTRATOR", "=== START ===", "INIT", self.project_name)
        self.git.init()

        try:
            # PHASE 1: 要件分析
            self._phase_analysis()

            # PHASE 2: アーキテクチャ設計
            self._phase_design()

            # PHASE 3: タスク分割
            tasks = self._phase_task_split()

            # PHASE 4: 実装ループ
            self._phase_implementation(tasks)

            # PHASE 5: テスト
            self._phase_test()

            # 完了コミット
            commit_hash = self.git.commit(
                f"✅ {self.project_name}: All phases complete", "ORCHESTRATOR"
            )
            self.logger.log("ORCHESTRATOR", "=== COMPLETE ===", "DONE", commit_hash)

        except KeyboardInterrupt:
            self.logger.log("ORCHESTRATOR", "INTERRUPTED", "WARN")
            self.git.commit(f"⏸️ {self.project_name}: Interrupted", "ORCHESTRATOR")
        except Exception as e:
            self.logger.log("ORCHESTRATOR", "FATAL_ERROR", "ERROR", str(e))
            raise

    # ── フェーズ実装 ─────────────────────────────────────────────────

    def _phase_analysis(self):
        self.logger.log("ORCHESTRATOR", "PHASE: ANALYSIS", "START")
        self.claude.analyze_requirements(self.idea)
        self.git.commit("📋 SPEC.md: Requirements analyzed", "CLAUDE")

    def _phase_design(self):
        self.logger.log("ORCHESTRATOR", "PHASE: DESIGN", "START")
        self.claude.design_architecture()
        self.git.commit("🏗️ ARCHITECTURE.md: Architecture designed", "CLAUDE")

    def _phase_task_split(self) -> list[dict]:
        self.logger.log("ORCHESTRATOR", "PHASE: TASK_SPLIT", "START")
        tasks = self.claude.split_tasks()
        self.git.commit(f"📝 TASKS.md: {len(tasks)} tasks created", "CLAUDE")
        return tasks

    def _phase_implementation(self, tasks: list[dict]):
        self.logger.log("ORCHESTRATOR", "PHASE: IMPLEMENTATION", "START",
                        f"{len(tasks)} tasks")
        for i, task in enumerate(tasks, 1):
            task_id = task.get("id", f"TASK-{i:03d}")
            self.logger.log("CURSOR", f"[{i}/{len(tasks)}] {task_id}", "START")

            # コード生成
            result = self.cursor.execute_code_generation(task, self.project_dir)

            # 進捗を更新
            self._mark_task_done(task_id)
            self.git.commit(
                f"⚡ {task_id}: {task.get('title', task.get('description', ''))[:60]}",
                "CURSOR"
            )
            self.logger.log("CURSOR", f"{task_id}", "DONE",
                            f"{len(result.get('files', []))} files")
            time.sleep(1)  # APIレート制限への配慮

    def _phase_test(self):
        self.logger.log("ORCHESTRATOR", "PHASE: TEST", "START")

        # コードファイルを収集
        code_files = self._collect_source_files()
        if not code_files:
            self.logger.log("TEST_AI", "generate_tests", "SKIP", "no source files")
            return

        # テスト生成
        self.tester.generate_tests(code_files, self.project_dir)
        self.git.commit("🧪 tests/: Test files generated", "TEST_AI")

        # テスト実行 & バグ修正ループ
        for attempt in range(self.MAX_FIX_RETRIES):
            result = self.tester.run_tests(self.project_dir)
            if result["status"] in ("pass", "skip"):
                self.logger.log("TEST_AI", "all_tests", "PASS")
                break

            self.logger.log("TEST_AI", f"fix_attempt:{attempt+1}", "FAIL")
            # バグ修正
            bug_id = f"BUG-{datetime.now().strftime('%H%M%S')}"
            self.codex.fix_bug(
                bug_id,
                result.get("stdout", "") + result.get("stderr", ""),
                code_files,
                self.project_dir
            )
            self.git.commit(f"🐛 {bug_id}: Auto-fixed", "CODEX")
            time.sleep(2)
        else:
            self.logger.log("TEST_AI", "max_retries_reached", "WARN")

    # ── ユーティリティ ──────────────────────────────────────────────

    def _collect_source_files(self, max_files: int = 10) -> dict[str, str]:
        """srcディレクトリのPython/JSファイルを収集"""
        src_dir = self.project_dir / "src"
        if not src_dir.exists():
            src_dir = self.project_dir
        files = {}
        exts = {".py", ".ts", ".tsx", ".js", ".jsx"}
        for f in sorted(src_dir.rglob("*"))[:max_files * 3]:
            if f.suffix in exts and f.is_file():
                try:
                    files[str(f.relative_to(self.project_dir))] = \
                        f.read_text(encoding="utf-8")[:2000]
                    if len(files) >= max_files:
                        break
                except Exception:
                    pass
        return files

    def _mark_task_done(self, task_id: str):
        """TASKS.mdの該当タスクを [x] にする"""
        content = self.memory.read("TASKS.md")
        content = content.replace(f"- [ ] {task_id}", f"- [x] {task_id}", 1)
        self.memory.write("TASKS.md", content, agent="ORCHESTRATOR")
