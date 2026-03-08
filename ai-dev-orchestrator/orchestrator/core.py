"""
orchestrator/core.py
AI Dev Orchestrator — メインエンジン
AIが要件分析→設計→実装→テスト→修正→commitを自動で回す
"""

import os
import json
import subprocess
import time
from datetime import datetime
from pathlib import Path
from typing import Optional
import anthropic

# ── 定数 ────────────────────────────────────────────────────────────
MEMORY_DIR = Path("ai-memory")
LOGS_DIR   = Path("logs")
AGENTS = {
    "CLAUDE":  "設計・要件分析・ドキュメント生成",
    "CURSOR":  "コード実装（Cursor AIへのタスク生成）",
    "CODEX":   "バグ修正・リファクタリング",
    "TEST_AI": "テスト生成・実行・検証",
}

# ── ロガー ───────────────────────────────────────────────────────────
class OrchestratorLogger:
    def __init__(self, project_name: str):
        LOGS_DIR.mkdir(exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.log_file = LOGS_DIR / f"{project_name}_{ts}.log"
        self.project  = project_name

    def log(self, agent: str, action: str, result: str = "OK", detail: str = ""):
        ts  = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        line = f"[{ts}] {agent:<10} {action:<30} {result}"
        if detail:
            line += f"\n          └─ {detail}"
        print(line)
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(line + "\n")

# ── メモリ管理 ───────────────────────────────────────────────────────
class MemoryManager:
    """ai-memory/ 配下のMarkdownファイルを読み書き"""

    FILES = ["SPEC.md", "ARCHITECTURE.md", "TASKS.md", "PROGRESS.md", "BUGS.md"]

    def read_all(self) -> dict[str, str]:
        result = {}
        for fname in self.FILES:
            path = MEMORY_DIR / fname
            result[fname] = path.read_text(encoding="utf-8") if path.exists() else ""
        return result

    def read(self, fname: str) -> str:
        path = MEMORY_DIR / fname
        return path.read_text(encoding="utf-8") if path.exists() else ""

    def write(self, fname: str, content: str, agent: str = "ORCHESTRATOR"):
        path = MEMORY_DIR / fname
        path.parent.mkdir(parents=True, exist_ok=True)
        # 末尾のLast updated行を更新
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        lines = content.rstrip().split("\n")
        if lines and lines[-1].startswith("_Last updated"):
            lines[-1] = f"_Last updated by: {agent} at {ts}_"
        else:
            lines.append(f"\n---\n_Last updated by: {agent} at {ts}_")
        path.write_text("\n".join(lines), encoding="utf-8")

    def append_progress_log(self, agent: str, action: str, result: str):
        """PROGRESS.md の実行ログに1行追加"""
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        line = f"[{ts}] {agent:<8} {action:<20} {result}"
        content = self.read("PROGRESS.md")
        marker = "```\n[YYYY-MM-DD HH:MM] AGENT    ACTION              RESULT\n─────────────────────────────────────────────────────\n```"
        new_marker = f"```\n[YYYY-MM-DD HH:MM] AGENT    ACTION              RESULT\n─────────────────────────────────────────────────────\n{line}\n```"
        if marker in content:
            content = content.replace(marker, new_marker, 1)
        else:
            # すでに1件以上ある場合は先頭に追記
            content = content.replace(
                "─────────────────────────────────────────────────────\n",
                f"─────────────────────────────────────────────────────\n{line}\n",
                1
            )
        self.write("PROGRESS.md", content)
