# 01_install-wsl2.ps1
# 右クリック → 「管理者として実行」で実行してください

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WSL2 + Ubuntu セットアップ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[ERROR] 管理者として実行してください" -ForegroundColor Red
    pause; exit 1
}

Write-Host "`n[1/3] WSL機能を有効化中..." -ForegroundColor Yellow
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

Write-Host "`n[2/3] WSL2をデフォルトに設定..." -ForegroundColor Yellow
wsl --set-default-version 2

Write-Host "`n[3/3] Ubuntu 24.04 をインストール中..." -ForegroundColor Yellow
wsl --install -d Ubuntu-24.04

Write-Host "`n========================================"  -ForegroundColor Green
Write-Host "  完了！PCを再起動してください"            -ForegroundColor Green
Write-Host "========================================"  -ForegroundColor Green
Write-Host ""
Write-Host "再起動後の手順:"
Write-Host "  1. Ubuntuが自動起動 → ユーザー名/パスワードを設定"
Write-Host "  2. このフォルダの 02_setup-ubuntu.sh をUbuntu内で実行"
pause
