#!/bin/bash
# 02_setup-ubuntu.sh
# Ubuntu端末で実行: bash /mnt/c/Users/yuuve/CascadeProjects/docs/claude-parallel-setup/02_setup-ubuntu.sh

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}========================================"
echo -e "  Claude Code 並列環境セットアップ"
echo -e "========================================${NC}"

echo -e "\n${YELLOW}[1/5] 基本パッケージ...${NC}"
sudo apt-get update -qq
sudo apt-get install -y -qq curl git build-essential tmux

echo -e "\n${YELLOW}[2/5] Node.js 22 LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y -qq nodejs
echo "  Node: $(node --version) / npm: $(npm --version)"

echo -e "\n${YELLOW}[3/5] Claude Code インストール...${NC}"
npm install -g @anthropic-ai/claude-code
echo "  claude: $(claude --version 2>/dev/null || echo OK)"

echo -e "\n${YELLOW}[4/5] tmux設定...${NC}"
cat > ~/.tmux.conf << 'EOF'
set -g mouse on
set -g base-index 1
setw -g pane-base-index 1
set -g status-bg colour235
set -g status-fg colour136
set -g status-left "#[fg=green,bold][#S] "
set -g status-right "#[fg=cyan]%H:%M"
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R
bind r source-file ~/.tmux.conf \; display "Reloaded"
EOF

echo -e "\n${YELLOW}[5/5] 起動スクリプト & シンボリックリンク...${NC}"
ln -sfn /mnt/c/Users/yuuve/CascadeProjects ~/projects
echo "  ~/projects -> CascadeProjects"

cat > ~/cc.sh << 'LAUNCHER'
#!/bin/bash
# Claude Code 並列起動スクリプト
# 使い方:
#   ~/cc.sh          # 3並列（デフォルト）
#   ~/cc.sh 2        # 2並列
#   ~/cc.sh 4 ai-dev-market   # 4並列・プロジェクト指定

N=${1:-3}
PROJ=${2:-""}
BASE="/mnt/c/Users/yuuve/CascadeProjects"
DIR="${PROJ:+$BASE/$PROJ}"
DIR="${DIR:-$BASE}"
SN="claude"

echo "🚀 Claude Code ${N}並列起動: $DIR"
tmux kill-session -t "$SN" 2>/dev/null || true
tmux new-session -d -s "$SN" -c "$DIR"

[[ $N -ge 2 ]] && tmux split-window -h -t "${SN}:0" -c "$DIR"
[[ $N -ge 3 ]] && tmux split-window -v -t "${SN}:0.0" -c "$DIR"
[[ $N -ge 4 ]] && tmux split-window -v -t "${SN}:0.2" -c "$DIR"

# 各ペインでclaude起動
for i in $(seq 0 $((N-1))); do
    tmux send-keys -t "${SN}:0.$i" "claude" Enter
    sleep 0.8
done

tmux attach-session -t "$SN"
LAUNCHER
chmod +x ~/cc.sh

echo -e "\n${GREEN}========================================"
echo -e "  セットアップ完了！"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}使い方:${NC}"
echo "  ~/cc.sh          # 3並列で起動"
echo "  ~/cc.sh 2        # 2並列"
echo "  ~/cc.sh 4 x-rss-tracker   # 4並列・プロジェクト指定"
echo ""
echo -e "${CYAN}tmux操作:${NC}"
echo "  Ctrl+b → 矢印  : ペイン移動"
echo "  Ctrl+b d        : バックグラウンドへ"
echo "  tmux attach     : 再接続"
echo "  Ctrl+b |        : 左右分割"
echo "  Ctrl+b -        : 上下分割"
