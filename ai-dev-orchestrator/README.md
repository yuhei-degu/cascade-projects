# ⚡ AI Dev Orchestrator

> アイデアを入れるだけ。AIが要件分析→設計→実装→テスト→commitを24時間自動で回す。

```
あなた: 「株価分析アプリを作りたい」
  ↓
CLAUDE:  要件分析 → SPEC.md 更新
  ↓
CLAUDE:  アーキテクチャ設計 → ARCHITECTURE.md 更新
  ↓
CLAUDE:  タスク分割 → TASKS.md に10タスク生成
  ↓
CURSOR:  TASK-001 実装 → commit
CURSOR:  TASK-002 実装 → commit
  ↓
TEST_AI: テスト生成・実行
  ↓
CODEX:   バグ修正 → commit
  ↓
✅ 完成！
```

## インストール

```bash
# 1. リポジトリをクローン
git clone https://github.com/yourusername/ai-dev-orchestrator
cd ai-dev-orchestrator

# 2. 依存関係をインストール
pip install -r requirements.txt

# 3. ai-dev コマンドをインストール
pip install -e .

# 4. APIキーを設定
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY を設定

# Windows PowerShellの場合:
$env:ANTHROPIC_API_KEY = "sk-ant-..."

# Mac/Linuxの場合:
export ANTHROPIC_API_KEY="sk-ant-..."
```

## 使い方

### 新プロジェクトを作る
```bash
ai-dev create my-app
cd my-app
```

### 自動開発を開始
```bash
ai-dev start "ユーザーが銘柄コードを入力すると株価チャートを表示するWebアプリ"
```

### 進捗を確認
```bash
ai-dev status
```

### タスク一覧を見る
```bash
ai-dev task
```

### バグを自動修正
```bash
ai-dev fix "ModuleNotFoundError: No module named 'pandas'"
```

### AIメモリを見る
```bash
ai-dev memory           # 全ファイル表示
ai-dev memory SPEC.md   # 特定ファイル
```

## フォルダ構造

```
ai-dev-orchestrator/
│
├── ai-memory/              ← AIが読み書きする「共有メモリ」
│   ├── SPEC.md             ← 仕様書（Claude が記入）
│   ├── ARCHITECTURE.md     ← 設計書（Claude が記入）
│   ├── TASKS.md            ← タスクキュー（Orchestratorが管理）
│   ├── PROGRESS.md         ← 進捗記録（自動更新）
│   └── BUGS.md             ← バグトラッカー（Codexが記入）
│
├── orchestrator/           ← Pythonオーケストレーター
│   ├── core.py             ← ロガー・メモリ管理
│   ├── agents.py           ← ClaudeAgent（設計）
│   ├── agents_impl.py      ← CursorAgent / CodexAgent / TestAgent
│   ├── git_manager.py      ← Git自動操作
│   └── loop.py             ← メインループ
│
├── cli/
│   └── main.py             ← ai-dev コマンド
│
├── templates/
│   ├── prompts/            ← 各エージェント用プロンプトテンプレート
│   │   ├── 00_master_context.md
│   │   ├── 01_analysis.md
│   │   ├── 02_implementation.md
│   │   ├── 03_bugfix.md
│   │   ├── 04_test.md
│   │   └── 05_cursor_handoff.md  ← Cursor/Claude Codeへの引き継ぎ
│   └── project/            ← 新プロジェクトのひな形
│
└── logs/                   ← AIの行動ログ（自動生成）
```

## Cursor / Claude Code との連携

### 手動で引き継ぐ場合
```bash
# 1. 引き継ぎプロンプトを表示
cat templates/prompts/05_cursor_handoff.md

# 2. CursorまたはClaude Codeのチャット欄に貼り付け
# 3. 「ai-memory/TASKS.mdを読んで続きを実装して」と伝えるだけ
```

### AIメモリの設計思想
```
SPEC.md         → 何を作るか（Claude が更新）
ARCHITECTURE.md → どう作るか（Claude が更新）
TASKS.md        → 何をすべきか（Orchestrator が管理）
PROGRESS.md     → 今どこまで来たか（自動更新）
BUGS.md         → 何が壊れているか（Codex が更新）
```
この5ファイルを読めば、**どのAIでも文脈なしに開発を引き継げる**設計です。

## 拡張方法

### 新しいエージェントを追加する
```python
# orchestrator/agents_impl.py に追記

class GeminiAgent(BaseAgent):
    """Google Geminiを使うエージェント"""
    def generate_ui(self, task: dict) -> dict:
        # Gemini APIを呼んでUI生成
        ...
```

### Webhookでトリガーする
```python
# FastAPIでエンドポイントを作り、GitHubのPushをトリガーに自動実行
from orchestrator.loop import OrchestratorLoop

@app.post("/webhook/start")
async def start(payload: dict):
    loop = OrchestratorLoop(...)
    asyncio.create_task(loop.run_async())
```

## 注意事項
- Anthropic APIの料金が発生します（1プロジェクト = 約$0.5〜$2）
- 自動commitを有効にすると履歴が大量に作られます（`GIT_AUTO_COMMIT=false` で無効化）
- 生成コードは必ず人間がレビューしてください

---
**作成:** AI Dev Orchestrator v1.0.0
