"""
orchestrator/fix_agent.py
FixAgent — Codex / GPT-4o担当
役割: バグ修正・リファクタリング・エラー解析
"""
from __future__ import annotations
import re
from pathlib import Path
from datetime import datetime

from .agents import BaseAgent
from . import memory


SYSTEM_PROMPT = """あなたはバグ修正の専門家です。
与えられたバグ情報・エラーログ・コードを分析し、修正済みコードを出力してください。

出力ルール:
- <FILE path="相対パス">修正済みコード全文</FILE> 形式で出力
- <ANALYSIS>原因分析（日本語）</ANALYSIS> で原因を説明
- <FIX_SUMMARY>修正内容の要約</FIX_SUMMARY> で何を直したか説明
- コードは動作するものだけ出力する
- 修正箇所にコメント # FIXED: 理由 を付ける
"""


class FixAgent(BaseAgent):
    name = "FixAgent"
    role = "バグ修正（Codex/GPT-4o）"

    def run(self, task: dict) -> dict:
        tid = task.get("id", "")
        bug_id = task.get("bug_id", "")
        self.log("start", f"バグ修正開始: {task.get('title', '')}", tid)

        # バグ情報をメモリから取得
        bugs_content = memory.read("bugs")
        context = self.read_memory_context()

        # 対象ファイルの内容を取得
        target_files = task.get("files", [])
        file_contents = self._read_files(target_files)

        user_prompt = f"""
バグトラッカー:
{bugs_content[:1500]}

対象ファイル:
{file_contents[:2000]}

修正するバグ:
ID: {bug_id}
タイトル: {task.get('title', '')}
エラー内容: {task.get('error', '')}
再現手順: {task.get('steps', '')}

このバグを修正してください。
"""
        response = self._call_openai(SYSTEM_PROMPT, user_prompt)

        # 解析・ファイル更新
        analysis = self._extract_tag(response, "ANALYSIS")
        fix_summary = self._extract_tag(response, "FIX_SUMMARY")
        files_fixed = self._write_fixed_files(response)

        # BUGSメモリ更新
        if bug_id:
            content = memory.read("bugs")
            content = content.replace(
                f"- **ステータス**: OPEN\n- **再現手順**: {task.get('steps','')}",
                f"- **ステータス**: FIXED\n- **原因**: {analysis}\n- **修正内容**: {fix_summary}"
            )
            memory.write("bugs", content)

        self.log("fix_done", f"{len(files_fixed)}ファイル修正: {fix_summary[:60]}", tid)
        memory.update_task_status(tid, "DONE", self.name)

        return {"status": "done", "files_fixed": files_fixed, "analysis": analysis}

    def _read_files(self, file_paths: list[str]) -> str:
        parts = []
        for p in file_paths:
            full = self.project_dir / p
            if full.exists():
                content = full.read_text(encoding="utf-8", errors="replace")
                parts.append(f"--- {p} ---\n{content[:1000]}")
        return "\n\n".join(parts)

    def _extract_tag(self, text: str, tag: str) -> str:
        m = re.search(rf"<{tag}>(.*?)</{tag}>", text, re.DOTALL)
        return m.group(1).strip() if m else ""

    def _write_fixed_files(self, response: str) -> list[str]:
        written = []
        for m in re.finditer(r'<FILE path="([^"]+)">(.*?)</FILE>', response, re.DOTALL):
            rel_path = m.group(1).strip()
            content = m.group(2).strip()
            full_path = self.project_dir / rel_path
            full_path.parent.mkdir(parents=True, exist_ok=True)
            full_path.write_text(content, encoding="utf-8")
            written.append(rel_path)
            self.log("file_fixed", f"修正: {rel_path}")
        return written
