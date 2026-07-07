# Wait for codex quota + Lunaria batch to finish, then run RamenFlow batch
$target = Get-Date -Hour 11 -Minute 35 -Second 0
if ($target -lt (Get-Date)) { $target = $target.AddDays(0) }
$wait = [int]($target - (Get-Date)).TotalSeconds
if ($wait -gt 0) { Start-Sleep -Seconds $wait }

# wait until no other run.py is running (Lunaria batch done), max 4h
$deadline = (Get-Date).AddHours(4)
while ((Get-Date) -lt $deadline) {
  $running = Get-CimInstance Win32_Process -Filter "Name='python.exe'" |
    Where-Object { $_.CommandLine -match 'run\.py' }
  if (-not $running) { break }
  Start-Sleep -Seconds 120
}
Start-Sleep -Seconds 60
taskkill /f /im node.exe 2>&1 | Out-Null
Set-Location 'C:\Users\yuuve\CascadeProjects\ai-dev-orchestrator\v2'
python run.py --all --tasks TASKS-ramenflow.md --config config-ramenflow.json *> run-ramenflow.log
