@echo off
REM setup.bat — Windows用セットアップ（ダブルクリックで実行）
echo ========================================
echo  AI Dev Orchestrator セットアップ
echo ========================================

REM Python確認
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Pythonが見つかりません。
    echo   https://python.org から Python 3.10以上をインストールしてください
    pause
    exit /b 1
)

REM 依存関係インストール
echo.
echo [1/3] 依存関係をインストール中...
pip install -r requirements.txt

REM ai-devコマンドをインストール
echo.
echo [2/3] ai-dev コマンドをインストール中...
pip install -e .

REM .env作成
echo.
echo [3/3] .env ファイルを作成中...
if not exist .env (
    copy .env.example .env
    echo.
    echo >> .env ファイルが作成されました
    echo >> メモ帳で開いて ANTHROPIC_API_KEY を設定してください
    notepad .env
)

echo.
echo ========================================
echo  ✅ セットアップ完了！
echo.
echo  使い方:
echo    ai-dev create my-project
echo    cd my-project
echo    ai-dev start "作りたいものを日本語で入力"
echo ========================================
pause
