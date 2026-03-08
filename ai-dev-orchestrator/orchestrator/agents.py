"""
orchestrator/agents.py
各AIエージェントの実装
Claude API を使って設計・タスク分割・バグ修正・テスト生成を行う
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
import anthropic

from .core import MemoryManager, OrchestratorLogger

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

# ── ベースエージェント ────────────────────────────────────────────────
class BaseAgent:
    def __init__(self, name: str, memory: MemoryManager, logger: OrchestratorLogger):
        self.name   = name
        self.memory = memory
        self.logger = logger

    def _call_claude(self, system: str, prompt: str, max_tokens: int = 4000) -> str:
        """Claude API を呼び出してテキストを返す"""
        try:
            msg = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=max_tokens,
                system=system,
                messages=[{"role": "user", "content": prompt}],
            )
            return msg.content[0].text
        except Exception as e:
            self.logger.log(self.name, "API_CALL", "ERROR", str(e))
            raise

    def _extract_json(self, text: str) -> dict | list:
        """テキストからJSONブロックを抽出"""
        match = re.search(r"```json\s*([\s\S]*?)\s*```", text)
        if match:
            return json.loads(match.group(1))
        # フォールバック: そのままパース
        return json.loads(text.strip())


# ── Claudeエージェント（設計・要件分析） ─────────────────────────────
class ClaudeAgent(BaseAgent):
    SYSTEM = """あなたはAI開発オーケストレーターの「設計エージェント」です。
ユーザーのアイデアを受け取り、以下を行います:
1. 要件分析 → SPEC.md を更新
2. アーキテクチャ設計 → ARCHITECTURE.md を更新
3. タスク分割 → TASKS.md を更新（大タスク→小タスクへ分割）

必ず以下の形式でタスクを出力してください:
```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "タスクのタイトル",
      "description": "詳細説明",
      "agent": "CURSOR",
      "priority": "HIGH",
      "estimate": "30min",
      "depends_on": [],
      "output": "path/to/output"
    }
  ]
}
```
"""

    def analyze_requirements(self, idea: str) -> dict:
        """アイデアから要件を分析してSPEC.mdを更新"""
        memory = self.memory.read_all()
        prompt = f"""
以下のプロダクトアイデアを分析し、SPEC.md形式で要件定義を作成してください。

## アイデア
{idea}

## 現在のSPEC.md
{memory.get('SPEC.md', '（空）')}

完全なSPEC.mdの内容をMarkdown形式で返してください。
"""
        self.logger.log(self.name, "analyze_requirements", "RUNNING")
        result = self._call_claude(self.SYSTEM, prompt)
        self.memory.write("SPEC.md", result, agent=self.name)
        self.memory.append_progress_log(self.name, "analyze_requirements", "DONE")
        self.logger.log(self.name, "analyze_requirements", "DONE")
        return {"status": "done", "file": "SPEC.md"}

    def design_architecture(self) -> dict:
        """SPEC.mdを元にアーキテクチャを設計"""
        spec = self.memory.read("SPEC.md")
        prompt = f"""
以下のSPEC.mdを元にシステムアーキテクチャを設計し、ARCHITECTURE.md形式で返してください。

## SPEC.md
{spec}

ディレクトリ構造・コンポーネント・APIデザイン・DBスキーマを含めてください。
完全なARCHITECTURE.mdの内容をMarkdown形式で返してください。
"""
        self.logger.log(self.name, "design_architecture", "RUNNING")
        result = self._call_claude(self.SYSTEM, prompt)
        self.memory.write("ARCHITECTURE.md", result, agent=self.name)
        self.memory.append_progress_log(self.name, "design_architecture", "DONE")
        self.logger.log(self.name, "design_architecture", "DONE")
        return {"status": "done", "file": "ARCHITECTURE.md"}

    def split_tasks(self) -> list[dict]:
        """アーキテクチャからタスクを小分割してTASKS.mdに書き込む"""
        arch = self.memory.read("ARCHITECTURE.md")
        spec = self.memory.read("SPEC.md")
        prompt = f"""
以下の仕様書とアーキテクチャを元に、実装タスクを分割してください。

## SPEC.md
{spec}

## ARCHITECTURE.md
{arch}

タスクは「1タスク = 1ファイルまたは1機能」の粒度で分割してください。
JSON形式で返してください。
"""
        self.logger.log(self.name, "split_tasks", "RUNNING")
        result = self._call_claude(self.SYSTEM, prompt)
        try:
            data   = self._extract_json(result)
            tasks  = data.get("tasks", [])
        except Exception:
            tasks  = []
        # TASKS.mdを更新
        self._write_tasks_md(tasks)
        self.logger.log(self.name, "split_tasks", "DONE", f"{len(tasks)} tasks created")
        return tasks

    def _write_tasks_md(self, tasks: list[dict]):
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        lines = [
            "# TASKS.md — タスク管理",
            f"# Generated: {now}",
            "",
            f"## サマリー",
            f"- Total: {len(tasks)}",
            "- Done: 0",
            "- In Progress: 0",
            f"- Pending: {len(tasks)}",
            "- Failed: 0",
            "",
            "## タスクキュー",
            "",
        ]
        for t in tasks:
            depends = ", ".join(t.get("depends_on", [])) or "なし"
            lines += [
                f"- [ ] {t['id']} | priority:{t.get('priority','MEDIUM')} | "
                f"agent:{t.get('agent','CURSOR')} | estimate:{t.get('estimate','?')}",
                f"  説明: {t.get('description', t.get('title',''))}",
                f"  依存: {depends}",
                f"  成果物: {t.get('output', '-')}",
                "",
            ]
        self.memory.write("TASKS.md", "\n".join(lines), agent=self.name)
