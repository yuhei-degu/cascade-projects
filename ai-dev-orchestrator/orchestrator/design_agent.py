"""
orchestrator/design_agent.py
DesignAgent — Claude担当
役割: 要件分析・設計・タスク自動分割
"""
from __future__ import annotations
import json
import re
from pathlib import Path
from datetime import datetime

from .agents import BaseAgent
from . import memory


SYSTEM_PROMPT = """あなたはシニアソフトウェアアーキテクトです。
与えられたアイデアを分析し、以下を出力してください:
1. 仕様書(SPEC)の更新内容
2. アーキテクチャ(ARCHITECTURE)の更新内容
3. タスクリスト(TASKS)のJSON配列

タスクJSONフォーマット:
[
  {"id":"T001","priority":"HIGH","title":"...","description":"...","estimated_minutes":30,"depends":[]},
  ...
]

出力形式:
<SPEC>
(SPEC.mdに追加する内容)
</SPEC>
<ARCHITECTURE>
(ARCHITECTURE.mdに追加する内容)
</ARCHITECTURE>
<TASKS>
[タスクJSON配列]
</TASKS>
"""


class DesignAgent(BaseAgent):
    name = "DesignAgent"
    role = "設計・タスク分割（Claude）"

    def run(self, task: dict) -> dict:
        self.log("start", f"タスク分析開始: {task.get('title', '')}", task.get("id", ""))
        context = self.read_memory_context()
        idea = task.get("idea") or task.get("description") or task.get("title", "")

        user_prompt = f"""
現在のメモリコンテキスト:
{context[:3000]}

ユーザーのアイデア・タスク:
{idea}

上記を分析して仕様・設計・タスクリストを作成してください。
"""
        response = self._call_anthropic(SYSTEM_PROMPT, user_prompt)
        self.log("api_call", "Claude API呼び出し完了", task.get("id", ""))

        # レスポンス解析
        result = self._parse_response(response)

        # メモリ更新
        if result.get("spec"):
            current = memory.read("spec")
            memory.write("spec", current + f"\n\n## AI追記 ({datetime.now().strftime('%H:%M')})\n{result['spec']}")
            self.log("memory_write", "SPEC.md 更新", task.get("id", ""))

        if result.get("architecture"):
            current = memory.read("architecture")
            memory.write("architecture", current + f"\n\n## AI追記\n{result['architecture']}")

        if result.get("tasks"):
            self._write_tasks(result["tasks"])
            self.log("task_split", f"{len(result['tasks'])}件のタスクを生成", task.get("id", ""))

        return {"status": "done", "tasks_created": len(result.get("tasks", []))}

    def _parse_response(self, response: str) -> dict:
        result = {}
        for tag in ("SPEC", "ARCHITECTURE"):
            m = re.search(rf"<{tag}>(.*?)</{tag}>", response, re.DOTALL)
            if m:
                result[tag.lower()] = m.group(1).strip()
        m = re.search(r"<TASKS>(.*?)</TASKS>", response, re.DOTALL)
        if m:
            try:
                result["tasks"] = json.loads(m.group(1).strip())
            except json.JSONDecodeError:
                result["tasks"] = []
        return result

    def _write_tasks(self, tasks: list[dict]) -> None:
        content = memory.read("tasks")
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        new_rows = ""
        new_details = ""
        for t in tasks:
            tid = t.get("id", "T???")
            priority = t.get("priority", "MEDIUM")
            title = t.get("title", "")[:40]
            deps = ",".join(t.get("depends", [])) or "-"
            est = str(t.get("estimated_minutes", "-"))
            new_rows += f"\n| {tid} | {priority} | TODO | {title} | - | {deps} | {est} |"
            new_details += f"\n### {tid}\n- **説明**: {t.get('description','')}\n- **作成**: {now}\n"
        content = content.replace(
            "| T001 | HIGH | TODO | (初期タスク) | - | - | - |", new_rows.strip()
        )
        content += new_details
        memory.write("tasks", content)
