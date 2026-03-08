#!/bin/bash
# =============================================================
# 02_setup-claude-code.sh
# WSL Ubuntu 内で実行するセットアップスクリプト
# 実行方法: Ubuntu端末で bash /mnt/c/Users/yuuve/CascadeProjects/docs/claude-parallel-setup/02_setup-claude-code.sh
# =============================================================

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}========================================"
echo -e "  Claude Code 並列環境セットアップ"
echo -e "========================================${NC}"

# ── 1. 基本パッケージ ──────────────────────────
echo -e "\n${YELLOW}[1/6] 基本パッケージをインストール中...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq curl git build-essential tmux

# ── 2. Node.js 22 (LTS) ───────────────────────
echo -e "\n${YELLOW}[2/6] Node.js 22 をインストール中...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y -qq nodejs
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"

# ── 3. Claude Code ────────────────────────────
echo -e "\n${YELLOW}[3/6] Claude Code をインストール中...${NC}"
npm install -g @anthropic-ai/claude-code
echo "  claude: $(claude --version 2>/dev/null || echo 'インストール完了')"

# ── 4. tmux設定 ───────────────────────────────
echo -e "\n${YELLOW}[4/6] tmux設定を配置中...${NC}"
cat > ~/.tmux.conf << 'TMUXCONF'
# マウス操作を有効化
set -g mouse on

# ペイン番号を1始まりに
set -g base-index 1
setw -g pane-base-index 1

# ステータスバーをカスタマイズ
set -g status-bg colour235
set -g status-fg colour136
set -g status-left "#[fg=green][#S] "
set -g status-right "#[fg=cyan]%Y-%m-%d %H:%M"
set -g status-right-length 40

# ペイン境界線の色
set -g pane-border-style fg=colour238
set -g pane-active-border-style fg=colour51

# Prefix を Ctrl+a に変更（好みで）
# set -g prefix C-a
# unbind C-b
# bind C-a send-prefix

# ペイン分割をvi風に
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# ペイン移動をvi風に
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# リロード
bind r source-file ~/.tmux.conf \; display "Reloaded!"
TMUXCONF
echo "  ~/.tmux.conf を作成しました"

# ── 5. Windowsのプロジェクトにシンボリックリンク ──
echo -e "\n${YELLOW}[5/6] Windowsプロジェクトへのリンクを作成中...${NC}"
WIN_PROJECTS="/mnt/c/Users/yuuve/CascadeProjects"
if [ -d "$WIN_PROJECTS" ]; then
    ln -sfn "$WIN_PROJECTS" ~/projects
    echo "  ~/projects → $WIN_PROJECTS"
else
    echo "  ⚠ プロジェクトフォルダが見つかりません: $WIN_PROJECTS"
fi

# ── 6. 起動スクリプト ─────────────────────────
echo -e "\n${YELLOW}[6/6] 起動スクリプトを作成中...${NC}"
cat > ~/claude-parallel.sh << 'LAUNCHER'
#!/bin/bash
# Claude Code 並列セッション起動スクリプト
# 使い方: bash ~/claude-parallel.sh [セッション数=3]

SESSIONS=${1:-3}
SESSION_NAME="claude"
PROJECT_DIR="${2:-$(pwd)}"

echo "🚀 Claude Code を${SESSIONS}並列で起動します"
echo "   プロジェクト: $PROJECT_DIR"
echo ""

# 既存セッションがあれば削除
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

# 新しいtmuxセッションを作成
tmux new-session -d -s "$SESSION_NAME" -c "$PROJECT_DIR"

if [ "$SESSIONS" -ge 2 ]; then
    tmux split-window -h -t "$SESSION_NAME" -c "$PROJECT_DIR"
fi
if [ "$SESSIONS" -ge 3 ]; then
    tmux split-window -v -t "$SESSION_NAME:0.0" -c "$PROJECT_DIR"
fi
if [ "$SESSIONS" -ge 4 ]; then
    tmux split-window -v -t "$SESSION_NAME:0.1" -c "$PROJECT_DIR"
fi

# 各ペインでClaude Codeを起動
for i in $(seq 0 $(($SESSIONS - 1))); do
    tmux send-keys -t "$SESSION_NAME:0.$i" "echo '=== Claude Code ペイン $((i+1)) ===' && claude" Enter
    sleep 0.5
done

# tmuxにアタッチ
tmux attach-session -t "$SESSION_NAME"
LAUNCHER
chmod +x ~/claude-parallel.sh
echo "  ~/claude-parallel.sh を作成しました"

echo -e "\n${GREEN}========================================"
echo -e "  セットアップ完了！"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}使い方:${NC}"
echo "  # 3並列（デフォルト）"
echo "  ~/claude-parallel.sh"
echo ""
echo "  # 4並列で特定プロジェクトを開く"
echo "  ~/claude-parallel.sh 4 ~/projects/ai-dev-market"
echo ""
echo -e "${CYAN}tmuxの基本操作:${NC}"
echo "  Ctrl+b → ペイン切替（矢印キー or h/j/k/l）"
echo "  Ctrl+b d → デタッチ（バックグラウンド化）"
echo "  tmux attach → 再接続"
echo "  Ctrl+b | → 左右分割 / Ctrl+b - → 上下分割"
echo ""
