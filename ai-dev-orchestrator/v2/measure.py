#!/usr/bin/env python3
"""AI Company OS v3 - MEASURE.

Weekly usage report from the usage_events table (migration 024).
- Reads Supabase URL + service role key from lunaria-app/.env.local (read-only).
- Prints: daily distinct users (14 days), event totals (7 days), and the
  OS success criterion: longest streak of consecutive days with >=1 user.
- Appends a dated snapshot to MEASURE_LOG.md.
Fails gracefully before the Supabase project exists.
"""
import json
import sys
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
LOG = ROOT / "MEASURE_LOG.md"
ENV = Path(r"C:\Users\yuuve\CascadeProjects\lunaria-app\.env.local")


def load_env():
    vals = {}
    for line in ENV.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            vals[k.strip()] = v.strip()
    url = vals.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = vals.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not key:
        sys.exit("Supabase URL / service role key not found in .env.local")
    return url, key


def fetch_events(url, key, days=14):
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    q = f"{url}/rest/v1/usage_events?select=user_id,event,created_at&created_at=gte.{since}&limit=10000"
    req = urllib.request.Request(q, headers={
        "apikey": key, "Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.exit(f"Supabase responded {e.code}: table missing? Apply migration 024 first.")
    except Exception as e:
        sys.exit(f"DB not reachable ({type(e).__name__}). Run after Supabase setup.")


def main():
    url, key = load_env()
    rows = fetch_events(url, key)
    by_day = defaultdict(set)
    by_event = defaultdict(int)
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    for r in rows:
        d = r["created_at"][:10]
        by_day[d].add(r["user_id"])
        if datetime.fromisoformat(r["created_at"].replace("Z", "+00:00")) >= week_ago:
            by_event[r["event"]] += 1

    today = date.today()
    lines = [f"# MEASURE {today.isoformat()}", "", "## 日別ユニークユーザー(14日)"]
    streak = best = 0
    for i in range(13, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        n = len(by_day.get(d, ()))
        lines.append(f"- {d}: {n}")
        streak = streak + 1 if n >= 1 else 0
        best = max(best, streak)
    lines += ["", "## イベント別(7日)"]
    for ev, n in sorted(by_event.items(), key=lambda x: -x[1]):
        lines.append(f"- {ev}: {n}")
    lines += ["", f"## 判定: 連続利用 {best} 日 (成功条件: 7日 / 現在streak: {streak})", ""]
    report = "\n".join(lines)
    print(report)
    old = LOG.read_text(encoding="utf-8") if LOG.exists() else "# MEASURE LOG\n\n"
    LOG.write_text(old + report + "\n---\n", encoding="utf-8")
    print("appended to MEASURE_LOG.md")


if __name__ == "__main__":
    main()
