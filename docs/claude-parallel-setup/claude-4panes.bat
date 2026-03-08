@echo off
REM Claude Code 4並列起動（2×2グリッド）
wt new-tab --title "Claude x4" wsl.exe bash -c "~/cc.sh 4"
