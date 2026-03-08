"""
orchestrator/agents.py (続き) — CursorAgent / CodexAgent / TestAgent
以下は agents.py に追記する形で別ファイルに分離
"""

# ── Cursorエージェント（実装タスク生成） ──────────────────────────────
class CursorAgent(BaseAgent):
    """
    Cursorへ送るプロンプトを生成する。
    実際のコード生成はCursorが行うため、ここではプロンプトファイルを出力する。
    （Claude Code / Cursor どちらにも対応）
    """

    SYSTEM = """あなたはAI開発オーケストレーターの「実装エージェント」です。
タスクの内容を受け取り、実装用プロンプトを生成します。
プロンプトは以下の構造にしてください:
1. コンテキスト（何を作るか）
2. 実装すべき内容（具体的なファイル・関数名）
3. 使用技術・制約
4. 期待する出力（ファイルパス・インターフェース）
5. テスト要件
"""

    def generate_implementation_prompt(self, task: dict, project_dir: Path) -> Path:
        """タスクからCursor/Claude Code用プロンプトを生成してファイル保存"""
        memory = self.memory.read_all()
        prompt_text = f"""
以下のタスクを実装してください。

## タスク
{json.dumps(task, ensure_ascii=False, indent=2)}

## プロジェクト仕様
{memory.get('SPEC.md', '')}

## アーキテクチャ
{memory.get('ARCHITECTURE.md', '')}

## 実装プロンプトを生成してください
Cursor または Claude Code に貼り付けて使える、具体的で詳細なプロンプトを返してください。
"""
        self.logger.log(self.name, "gen_impl_prompt", "RUNNING", task.get("id", ""))
        result = self._call_claude(self.SYSTEM, prompt_text)

        # プロンプトをファイルに保存
        prompts_dir = project_dir / "ai-prompts"
        prompts_dir.mkdir(exist_ok=True)
        out_file = prompts_dir / f"{task.get('id', 'TASK')}_impl.md"
        out_file.write_text(result, encoding="utf-8")

        self.logger.log(self.name, "gen_impl_prompt", "DONE", str(out_file))
        return out_file

    def execute_code_generation(self, task: dict, project_dir: Path) -> dict:
        """Claude APIで直接コードを生成（Cursorなし環境用）"""
        arch = self.memory.read("ARCHITECTURE.md")
        spec = self.memory.read("SPEC.md")

        system = """あなたはシニアソフトウェアエンジニアです。
タスクに従って、完全に動作するコードを実装してください。
ファイルの内容を以下の形式で返してください:

```filepath:path/to/file.py
# ここにコード
```

複数ファイルがある場合は続けて出力してください。"""

        prompt = f"""
## タスク
{json.dumps(task, ensure_ascii=False, indent=2)}

## 仕様
{spec[:2000]}

## アーキテクチャ
{arch[:2000]}

上記のタスクを実装してください。
"""
        self.logger.log(self.name, "execute_codegen", "RUNNING", task.get("id", ""))
        result = self._call_claude(system, prompt, max_tokens=8000)

        # ファイルを実際に書き出す
        written = self._write_code_files(result, project_dir)
        self.logger.log(self.name, "execute_codegen", "DONE", f"{len(written)} files written")
        return {"status": "done", "files": written}

    def _write_code_files(self, response: str, project_dir: Path) -> list[str]:
        """```filepath: ... ``` ブロックを解析してファイルを書き出す"""
        import re
        pattern = r"```(?:filepath:)?([^\n`]+)\n([\s\S]*?)```"
        matches = re.findall(pattern, response)
        written = []
        for filepath, code in matches:
            filepath = filepath.strip()
            if not filepath or filepath in ("json", "bash", "python", "typescript"):
                continue
            full_path = project_dir / filepath
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(code.strip(), encoding="utf-8")
            written.append(filepath)
        return written


# ── Codexエージェント（バグ修正） ──────────────────────────────────────
class CodexAgent(BaseAgent):
    SYSTEM = """あなたはAI開発オーケストレーターの「バグ修正エージェント」です。
エラーログとコードを受け取り、バグを特定・修正します。
修正後はBUGS.mdを更新してください。
修正したコードは ```filepath:path/to/file.py ... ``` 形式で返してください。"""

    def fix_bug(self, bug_id: str, error_log: str, code_files: dict[str, str],
                project_dir: Path) -> dict:
        bugs = self.memory.read("BUGS.md")
        prompt = f"""
以下のバグを修正してください。

## バグID
{bug_id}

## エラーログ
```
{error_log}
```

## 関連コード
{json.dumps(code_files, ensure_ascii=False, indent=2)[:3000]}

## 現在のBUGS.md
{bugs}

1. バグの原因を特定
2. 修正コードを生成
3. 更新したBUGS.md（バグをFIXEDにして原因・修正方法を記入）

を返してください。
"""
        self.logger.log(self.name, f"fix_bug:{bug_id}", "RUNNING")
        result = self._call_claude(self.SYSTEM, prompt)

        # コードファイルを書き出す
        written = self._write_fixed_files(result, project_dir)

        # BUGS.mdを更新（結果の末尾のMarkdownを抽出）
        bugs_match = re.search(r"(# BUGS\.md[\s\S]+)$", result)
        if bugs_match:
            self.memory.write("BUGS.md", bugs_match.group(1), agent=self.name)

        self.logger.log(self.name, f"fix_bug:{bug_id}", "DONE", f"{len(written)} files fixed")
        return {"status": "done", "bug_id": bug_id, "files_fixed": written}

    def _write_fixed_files(self, response: str, project_dir: Path) -> list[str]:
        import re
        pattern = r"```filepath:([^\n`]+)\n([\s\S]*?)```"
        matches = re.findall(pattern, response)
        written = []
        for filepath, code in matches:
            full_path = project_dir / filepath.strip()
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(code.strip(), encoding="utf-8")
            written.append(filepath.strip())
        return written


# ── TestAIエージェント（テスト生成・実行） ────────────────────────────
class TestAgent(BaseAgent):
    SYSTEM = """あなたはAI開発オーケストレーターの「テストエージェント」です。
コードを受け取り、テストを生成・実行し、結果を報告します。
テストはpytestを使用し、以下をカバーしてください:
- ユニットテスト（各関数）
- 統合テスト（主要フロー）
- エッジケース
テストコードは ```filepath:tests/test_xxx.py ... ``` 形式で返してください。"""

    def generate_tests(self, code_files: dict[str, str], project_dir: Path) -> dict:
        prompt = f"""
以下のコードに対するテストを生成してください。

## コードファイル
{json.dumps(code_files, ensure_ascii=False, indent=2)[:4000]}

pytestを使用した完全なテストコードを生成してください。
"""
        self.logger.log(self.name, "generate_tests", "RUNNING")
        result = self._call_claude(self.SYSTEM, prompt)
        written = self._write_test_files(result, project_dir)
        self.logger.log(self.name, "generate_tests", "DONE", f"{len(written)} test files")
        return {"status": "done", "test_files": written}

    def run_tests(self, project_dir: Path) -> dict:
        """pytestを実行して結果を返す"""
        import subprocess
        self.logger.log(self.name, "run_tests", "RUNNING")
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "tests/", "-v", "--tb=short", "--json-report",
                 "--json-report-file=logs/test_report.json"],
                capture_output=True, text=True, cwd=project_dir, timeout=120
            )
            passed = "passed" in result.stdout
            self.logger.log(self.name, "run_tests", "PASS" if passed else "FAIL")
            return {
                "status": "pass" if passed else "fail",
                "stdout": result.stdout[-2000:],
                "stderr": result.stderr[-1000:],
                "returncode": result.returncode,
            }
        except subprocess.TimeoutExpired:
            self.logger.log(self.name, "run_tests", "TIMEOUT")
            return {"status": "timeout"}
        except FileNotFoundError:
            self.logger.log(self.name, "run_tests", "SKIP", "pytest not found")
            return {"status": "skip", "reason": "pytest not installed"}

    def _write_test_files(self, response: str, project_dir: Path) -> list[str]:
        import re
        pattern = r"```(?:filepath:)?([^\n`]*test[^\n`]*\.py)\n([\s\S]*?)```"
        matches = re.findall(pattern, response)
        written = []
        for filepath, code in matches:
            full_path = project_dir / filepath.strip()
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(code.strip(), encoding="utf-8")
            written.append(filepath.strip())
        return written


import json
import re
