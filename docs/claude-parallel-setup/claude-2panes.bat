@echo off
REM Claude Code 2並列起動
REM Ubuntu内の ~/cc.sh 2 を実行
wt new-tab --title "Claude [1]" wsl.exe bash -c "cd /mnt/c/Users/yuuve/CascadeProjects && ~/cc.sh 2" ; ^
   move-focus right
