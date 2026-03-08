"""
orchestrator/test_agent.py
TestAgent — テスト生成・実行・バグ報告
役割: コードを受け取りテストを書いて実行し、失敗をBUGS.mdに記録する
"""
from __future__ import annotations
import re
import subprocess
from pathlib import Path
from datetime import datetime

from .agents import BaseAgent
from . import memory


SYSTEM_PROMPT = """あなたはQAエンジニアです。
与えられたコードに対して、実行可能なテストを生成してください。

出力ルール:
- <FILE path="tests/test_xxx.py">テストコード</FILE> 形式で出力
- pytestを使用する
- テストは独立して実行可能にする
- 正常系・異常系・エッジケースをカバーする
- テスト関数名は日本語コメントで説明を付ける
- モックが必要な外部依存はpytest-mockを使う
"""


class TestAgent(BaseAgent):
    name = "TestAgent"
    role = "テスト生成・実行"

    def run(self, task: dict) -> dict:
        tid = task.get("id", "")
        self.log("start", f"テスト開始: {task.get('title', '')}", tid)

        # テスト対象ファイルを収集
        target_files = task.get("files", [])
        if not target_files:
            target_files = self._find_source_files()

        file_contents = self._read_files(target_files)
        context = memory.read("spec") + "\n" + memory.read("architecture")

        user_prompt = f"""
仕様:
{context[:1500]}

テスト対象コード:
{file_contents[:2500]}

上記コードの包括的なテストを生成してください。
"""
        response = self._call_anthropic(SYSTEM_PROMPT, user_prompt)
        test_files = self._write_test_files(response)

        self.log("test_gen", f"{len(test_files)}件のテストファイル生成", tid)

        # テスト実行
        results = self._run_tests()
        bugs_found = self._report_failures(results)

        self.log(
            "test_run",
            f"テスト完了: {results['passed']}passed / {results['failed']}failed",
            tid,
            status="ok" if results["failed"] == 0 else "warn"
        )
        memory.update_task_status(tid, "DONE", self.name)

        return {
            "status": "done",
            "passed": results["passed"],
            "failed": results["failed"],
            "bugs_found": bugs_found,
        }

    def _find_source_files(self) -> list[str]:
        """srcディレクトリのPython/TSファイルを収集"""
        files = []
        for ext in ("*.py", "*.ts", "*.tsx"):
            for p in self.project_dir.glob(f"src/**/{ext}"):
                files.append(str(p.relative_to(self.project_dir)))
        return files[:5]  # 最大5ファイル

    def _read_files(self, file_paths: list[str]) -> str:
        parts = []
        for p in file_paths:
            full = self.project_dir / p
            if full.exists():
                content = full.read_text(encoding="utf-8", errors="replace")
                parts.append(f"--- {p} ---\n{content[:800]}")
        return "\n\n".join(parts)

    def _write_test_files(self, response: str) -> list[str]:
        written = []
        for m in re.finditer(r'<FILE path="([^"]+)">(.*?)</FILE>', response, re.DOTALL):
            rel_path = m.group(1).strip()
            content = m.group(2).strip()
            full_path = self.project_dir / rel_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            written.append(rel_path)
        return written

    def _run_tests(self) -> dict:
        """pytestを実行して結果を返す"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "tests/", "-v", "--tb=short", "--no-header"],
                cwd=self.project_dir,
                capture_output=True, text=True,
                timeout=120, encoding="utf-8", errors="replace"
            )
            output = result.stdout + result.stderr
            passed = len(re.findall(r"PASSED", output))
            failed = len(re.findall(r"FAILED", output))
            errors = re.findall(r"FAILED (.+?) -", output)
            return {"passed": passed, "failed": failed, "errors": errors, "output": output[:3000]}
        except Exception as e:
            return {"passed": 0, "failed": 0, "errors": [str(e)], "output": str(e)}

    def _report_failures(self, results: dict) -> int:
        """テスト失敗をBUGS.mdに記録する"""
        errors = results.get("errors", [])
        for i, err in enumerate(errors):
            bug_id = f"B{datetime.now().strftime('%m%d')}{i+1:02d}"
            memory.add_bug(
                bug_id=bug_id,
                severity="HIGH",
                title=f"テスト失敗: {err[:60]}",
                steps="pytest実行",
                expected="テストがPASSED",
                actual=f"FAILED: {err}"
            )
        return len(errors)
