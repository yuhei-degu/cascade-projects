"""
orchestrator/code_agent.py
CodeAgent — Cursor / Claude担当
役割: タスクに基づきコードを生成してファイルに書き込む
"""
from __future__ import annotations
import re
from pathlib import Path

from .agents import BaseAgent
from . import memory


SYSTEM_PROMPT = """あなたはシニアソフトウェアエンジニアです。
与えられたタスクに基づき、実装可能なコードを生成してください。

出力ルール:
- 必ずファイルパスと内容をセットで出力する
- <FILE path="相対パス">コード</FILE> 形式で出力する
- 複数ファイルある場合は繰り返す
- コードはTypeScriptまたはPythonで書く
- コメントは日本語でOK
- 動作するコードのみ出力する（説明文はFILEタグ外に書く）

例:
<FILE path="src/app.ts">
// アプリのメインエントリーポイント
import express from 'express'
...
</FILE>
"""


class CodeAgent(BaseAgent):
    name = "CodeAgent"
    role = "コード生成（Cursor/Claude）"

    def run(self, task: dict) -> dict:
        tid = task.get("id", "")
        self.log("start", f"コード生成: {task.get('title','')}", tid)

        context = self.read_memory_context()
        user_prompt = f"""
プロジェクトコンテキスト:
{context[:2000]}

実装するタスク:
ID: {task.get('id', '')}
タイトル: {task.get('title', '')}
説明: {task.get('description', '')}

プロジェクトディレクトリ: {self.project_dir}

このタスクを実装するコードを生成してください。
"""
        response = self._call_anthropic(SYSTEM_PROMPT, user_prompt)
        files_written = self._write_files(response)

        self.log("code_gen", f"{len(files_written)}ファイル生成", tid)
        memory.update_task_status(tid, "DONE", self.name)

        return {"status": "done", "files": files_written}

    def _write_files(self, response: str) -> list[str]:
        """<FILE path="...">...</FILE> を抽出してファイルを書き込む"""
        written = []
        pattern = r'<FILE path="([^"]+)">(.*?)</FILE>'
        for m in re.finditer(pattern, response, re.DOTALL):
            rel_path = m.group(1).strip()
            content = m.group(2).strip()
            full_path = self.project_dir / rel_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            written.append(rel_path)
            self.log("file_write", f"書き込み: {rel_path}")
        return written
