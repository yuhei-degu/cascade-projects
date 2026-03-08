"""
orchestrator/prompt_loader.py
プロンプトテンプレートの読み込みと変数展開
"""
from __future__ import annotations
import re
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


def load_prompt(name: str) -> str:
    """prompts/{name}.md を読み込む"""
    path = PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        return f"# {name}\n(プロンプトファイルが見つかりません: {path})"
    return path.read_text(encoding="utf-8")


def fill_prompt(template: str, variables: dict) -> str:
    """{{variable_name}} を辞書の値で置換する"""
    for key, value in variables.items():
        template = template.replace(f"{{{{{key}}}}}", str(value))
    # 未置換の変数を警告
    unfilled = re.findall(r"\{\{(\w+)\}\}", template)
    if unfilled:
        template += f"\n\n<!-- 未置換変数: {', '.join(unfilled)} -->"
    return template
