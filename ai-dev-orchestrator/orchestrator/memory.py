"""
orchestrator/memory.py
AI共有メモリの読み書きユーティリティ
全AIエージェントはここ経由でai_memoryを操作する
"""
from __future__ import annotations
import re
from datetime import datetime
from pathlib import Path

MEMORY_DIR = Path(__file__).parent.parent / "ai_memory"

FILES = {
    "spec":         MEMORY_DIR / "SPEC.md",
    "architecture": MEMORY_DIR / "ARCHITECTURE.md",
    "tasks":        MEMORY_DIR / "TASKS.md",
    "progress":     MEMORY_DIR / "PROGRESS.md",
    "bugs":         MEMORY_DIR / "BUGS.md",
}


def read(key: str) -> str:
    """メモリファイルを読み込む"""
    path = FILES.get(key)
    if not path or not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def write(key: str, content: str) -> None:
    """メモリファイルを上書き保存する"""
    path = FILES.get(key)
    if not path:
        raise ValueError(f"Unknown memory key: {key}")
    path.write_text(content, encoding="utf-8")


def update_field(key: str, field_id: str, value: str) -> None:
    """<!-- AI_FILL: field_id --> タグの直後の行を置換する"""
    content = read(key)
    pattern = rf"(<!-- AI_FILL: {re.escape(field_id)} -->\n)(.+?)(\n)"
    replacement = rf"\g<1>{value}\g<3>"
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    # タイムスタンプ更新
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_content = re.sub(r"_最終更新: .*_", f"_最終更新: {now}_", new_content)
    write(key, new_content)


def append_progress(cycle: int, completed: list[str], bugs: int, commit: str) -> None:
    """PROGRESS.md のサイクル履歴テーブルに行を追加する"""
    content = read("progress")
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    row = f"| #{cycle:03d} | {now} | {now} | {', '.join(completed) or '-'} | {bugs} | {commit or '-'} |"
    content = content.replace(
        "| #000 | (auto) | - | - | - | - |",
        f"| #000 | (auto) | - | - | - | - |\n{row}",
    )
    write("progress", content)


def add_bug(bug_id: str, severity: str, title: str, steps: str, expected: str, actual: str) -> None:
    """BUGS.md に新しいバグエントリを追加する"""
    content = read("bugs")
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    # テーブル行追加
    row = f"| {bug_id} | {severity} | OPEN | {title} | AI | - | {now} |"
    content = content.replace("| (なし) | | | | | | |", f"{row}\n| (なし) | | | | | | |")
    # 詳細追加
    detail = f"""
### {bug_id}
- **重要度**: {severity}
- **ステータス**: OPEN
- **再現手順**: {steps}
- **期待動作**: {expected}
- **実際の動作**: {actual}
- **原因**: (調査後記入)
- **修正内容**: (修正後記入)
"""
    content += detail
    write("bugs", content)


def get_todo_tasks() -> list[dict]:
    """TASKS.md からTODOのタスク一覧を取得する"""
    content = read("tasks")
    tasks = []
    for line in content.splitlines():
        if "| TODO |" in line or "| BLOCKED |" in line:
            parts = [p.strip() for p in line.strip("|").split("|")]
            if len(parts) >= 6:
                tasks.append({
                    "id": parts[0], "priority": parts[1],
                    "status": parts[2], "title": parts[3],
                    "agent": parts[4], "depends": parts[5],
                })
    return tasks


def update_task_status(task_id: str, status: str, agent: str = "") -> None:
    """タスクのステータスを更新する"""
    content = read("tasks")
    # テーブル行のステータスを置換
    def replacer(m):
        row = m.group(0)
        row = re.sub(r"\|\s*(TODO|DOING|DONE|BLOCKED|FAILED)\s*\|",
                     f"| {status} |", row)
        if agent:
            row = re.sub(r"\|\s*-\s*\|", f"| {agent} |", row, count=1)
        return row
    content = re.sub(rf"\|[^|]*{re.escape(task_id)}[^|]*\|.*", replacer, content)
    write("tasks", content)


def read_all_context() -> str:
    """全メモリを結合してAIコンテキスト用に返す"""
    parts = []
    for key, path in FILES.items():
        if path.exists():
            parts.append(f"=== {key.upper()} ===\n{path.read_text(encoding='utf-8')}")
    return "\n\n".join(parts)
