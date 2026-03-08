# =============================================================
# 03_launch-claude-parallel.ps1
# Windows Terminal で Claude Code 並列ウィンドウを起動
# WSL インストール後に使用
# 使い方: ダブルクリック or PowerShell から実行
# =============================================================

param(
    [int]$Panes = 3,           # 並列数（2〜4）
    [string]$Project = ""      # プロジェクトパス（省略可）
)

# Windows Terminalの確認
if (-not (Get-Command wt -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Windows Terminal が見つかりません" -ForegroundColor Red
    Write-Host "Microsoft Store から Windows Terminal をインストールしてください"
    pause; exit 1
}

# WSLの確認
$wslOk = wsl --list --quiet 2>$null
if (-not $wslOk) {
    Write-Host "[ERROR] WSL/Ubuntu がインストールされていません" -ForegroundColor Red
    Write-Host "先に 01_install-wsl2.ps1 を管理者として実行してください"
    pause; exit 1
}

# Windowsパス → WSLパスに変換
$wslProject = ""
if ($Project -ne "") {
    $wslProject = $Project -replace "\\", "/" -replace "^C:", "/mnt/c"
} else {
    $wslProject = "/mnt/c/Users/yuuve/CascadeProjects"
}

Write-Host "🚀 Claude Code $Panes 並列起動" -ForegroundColor Cyan
Write-Host "   プロジェクト: $wslProject" -ForegroundColor Gray

# Claude Code 起動コマンド（各ペイン用）
$claudeCmd = "cd '$wslProject' && echo '=== Claude Code ===' && claude"

# wt コマンドで分割レイアウトを構築
switch ($Panes) {
    2 {
        # 左右2分割
        wt `
            --title "Claude Code [1]" `
            wsl.exe -e bash -c $claudeCmd `
            ; split-pane -H `
            --title "Claude Code [2]" `
            wsl.exe -e bash -c $claudeCmd
    }
    3 {
        # 左1 + 右2（上下）
        wt `
            --title "Claude Code [1]" `
            wsl.exe -e bash -c $claudeCmd `
            ; split-pane -H `
            --title "Claude Code [2]" `
            wsl.exe -e bash -c $claudeCmd `
            ; split-pane -V `
            --title "Claude Code [3]" `
            wsl.exe -e bash -c $claudeCmd
    }
    4 {
        # 2×2グリッド
        wt `
            --title "Claude Code [1]" `
            wsl.exe -e bash -c $claudeCmd `
            ; split-pane -H `
            --title "Claude Code [2]" `
            wsl.exe -e bash -c $claudeCmd `
            ; split-pane -V `
            --title "Claude Code [4]" `
            wsl.exe -e bash -c $claudeCmd `
            ; move-focus left `
            ; split-pane -V `
            --title "Claude Code [3]" `
            wsl.exe -e bash -c $claudeCmd
    }
    default {
        Write-Host "[ERROR] 並列数は 2〜4 で指定してください" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 起動完了！" -ForegroundColor Green
