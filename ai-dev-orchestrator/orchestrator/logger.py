"""
orchestrator/logger.py
AIの全行動をlogsディレクトリにJSONL形式で記録する
"""
from __future__ import annotations
import json
from datetime import datetime
from pathlib import Path

LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)


def _log_path(project: str) -> Path:
    date = datetime.now().strftime("%Y-%m-%d")
    return LOGS_DIR / f"{project}_{date}.jsonl"


def log(
    project: str,
    agent: str,
    action: str,
    task_id: str = "",
    detail: str = "",
    status: str = "ok",
    meta: dict | None = None,
) -> None:
    """1行のログエントリを記録する"""
    entry = {
        "ts": datetime.now().isoformat(timespec="seconds"),
        "project": project,
        "agent": agent,
        "action": action,
        "task_id": task_id,
        "status": status,
        "detail": detail[:500],  # 長すぎる場合は切り詰め
        **(meta or {}),
    }
    with _log_path(project).open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def read_logs(project: str, n: int = 50) -> list[dict]:
    """直近n件のログを返す"""
    path = _log_path(project)
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8").strip().splitlines()
    entries = []
    for line in lines[-n:]:
        try:
            entries.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return entries


def format_logs_for_display(project: str, n: int = 20) -> str:
    """ターミナル表示用にフォーマット"""
    entries = read_logs(project, n)
    if not entries:
        return "(ログなし)"
    lines = []
    for e in entries:
        status_icon = {"ok": "✅", "error": "❌", "warn": "⚠️"}.get(e.get("status", ""), "🔹")
        lines.append(
            f"{status_icon} [{e['ts']}] {e['agent']:12s} {e['action']:20s} "
            f"{e.get('task_id', ''):6s} {e.get('detail', '')[:60]}"
        )
    return "\n".join(lines)
