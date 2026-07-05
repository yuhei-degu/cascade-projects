#!/usr/bin/env python3
"""AI Company OS v3 - SCOUT.

Generates AT MOST ONE evidence-based product candidate and appends it to
CANDIDATES.md. Refuses to run when:
  - an unreviewed candidate already exists (human gate #1 pending), or
  - any project is in 'building' state in PIPELINE.md (WIP limit = 1).

Evidence rules: the model must cite real URLs showing demand and willingness
to pay. No evidence -> the candidate is rejected before it reaches a human.
"""
import json
import os
import re
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CANDIDATES = ROOT / "CANDIDATES.md"
PIPELINE = ROOT / "PIPELINE.md"

INTEREST = (
    "個人開発者が Next.js + Supabase で4週間以内に MVP を作れて、"
    "日本の小規模事業者または個人が月額500〜3000円を払い得る領域。"
    "AI活用は手段であり必須ではない。"
)

PROMPT = f"""あなたは事業開発のスカウトです。以下の条件で製品候補を「1件だけ」提案してください。

対象領域: {INTEREST}

必須要件:
- demand_evidence: 需要が実在する証拠となる実URLを2つ以上(検索して見つけること。作らないこと)
- pay_evidence: 対象者が類似物に金を払っている証拠(競合の料金ページ等の実URL)
- 4週間でMVPが作れる範囲に絞ったスコープ
- kill_criteria の提案(公開後に撤退を判断する客観条件)

出力は次のJSONのみ(コードフェンス不要):
{{"name": "...", "problem": "...", "target_user": "...", "mvp_scope": "...",
 "monetization": "...", "demand_evidence": ["url1", "url2"],
 "pay_evidence": ["url1"], "effort_weeks": 3, "kill_criteria": "..."}}
"""


def load_env_key():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    env = Path(r"C:\Users\yuuve\CascadeProjects\lunaria-app\.env.local")
    if env.exists():
        for line in env.read_text(encoding="utf-8").splitlines():
            if line.startswith("GEMINI_API_KEY="):
                return line.split("=", 1)[1].strip()
    sys.exit("GEMINI_API_KEY not found")


def guard():
    if PIPELINE.exists() and re.search(r"\|\s*building\s*\|", PIPELINE.read_text(encoding="utf-8")):
        sys.exit("REFUSED: a project is in 'building' (WIP limit = 1). Ship or kill it first.")
    if CANDIDATES.exists() and "status: pending" in CANDIDATES.read_text(encoding="utf-8"):
        sys.exit("REFUSED: an unreviewed candidate exists. Human gate #1 first.")


def call_gemini(key):
    body = {
        "contents": [{"parts": [{"text": PROMPT}]}],
        "tools": [{"google_search": {}}],
    }
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode("utf-8"))
    parts = data["candidates"][0]["content"]["parts"]
    return "".join(p.get("text", "") for p in parts)


def main():
    guard()
    text = call_gemini(load_env_key())
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        sys.exit("REJECTED: model returned no JSON")
    c = json.loads(m.group(0))
    urls = list(c.get("demand_evidence", [])) + list(c.get("pay_evidence", []))
    real = [u for u in urls if isinstance(u, str) and u.startswith("http")]
    if len(c.get("demand_evidence", [])) < 2 or not c.get("pay_evidence"):
        sys.exit("REJECTED: insufficient evidence URLs. Candidate discarded before human review.")
    entry = f"""
## {c['name']} — {date.today().isoformat()} (status: pending)

- 課題: {c['problem']}
- 対象: {c['target_user']}
- MVPスコープ: {c['mvp_scope']}
- 収益化: {c['monetization']}
- 需要の証拠: {' / '.join(c['demand_evidence'])}
- 支払いの証拠: {' / '.join(c['pay_evidence'])}
- 見積り: {c.get('effort_weeks', '?')}週
- キル基準(案): {c['kill_criteria']}
- 人間の判断: (GO / NO を記入。GOならキル基準を確定させる)
"""
    header = "# CANDIDATES — 週1件まで。人間がGO/NOを書くまで次は出ない\n"
    old = CANDIDATES.read_text(encoding="utf-8") if CANDIDATES.exists() else header
    CANDIDATES.write_text(old + entry, encoding="utf-8")
    print(f"1 candidate written to CANDIDATES.md: {c['name']}")
    print(f"evidence URLs (human: verify these actually exist): {len(real)}")


if __name__ == "__main__":
    main()
