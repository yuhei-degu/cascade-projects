# One-shot: wait until 11:30 JST, then rerun task 4 with codex
$target = Get-Date -Hour 11 -Minute 30 -Second 0
if ($target -lt (Get-Date)) { $target = $target.AddDays(1) }
$wait = [int]($target - (Get-Date)).TotalSeconds
Start-Sleep -Seconds $wait

Set-Location 'C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\v2'

$py = @'
import json
from pathlib import Path
t = Path("TASKS.md")
s = t.read_text(encoding="utf-8")
t.write_text(s.replace("- [!] ", "- [ ] ", 1), encoding="utf-8")
p = Path("config.json")
c = json.loads(p.read_text(encoding="utf-8"))
c["agent_command"] = ["codex", "exec", "--full-auto", "--cd", "{repo}", "-"]
p.write_text(json.dumps(c, indent=2, ensure_ascii=False), encoding="utf-8")
print("reset + codex config done")
'@
$py | python -
python run.py *> run-retry.log
