@echo off
REM Claude Code 3並列起動（デフォルト推奨）
wt new-tab --title "Claude x3" wsl.exe bash -c "~/cc.sh 3"
