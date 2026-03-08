# templates/prompts/03_bugfix.md
# Codex（バグ修正エージェント）向けプロンプト

{{MASTER_CONTEXT}}

## あなたのタスク: バグ修正

### エラーログ
```
{{ERROR_LOG}}
```

### 関連コード
```
{{CODE_FILES}}
```

### 修正手順
1. エラーの**原因**を1〜3行で説明する
2. **修正コード**を `filepath:` 形式で出力する
3. **BUGS.md** を更新する（以下のフォーマット）

#### BUGS.md 更新フォーマット
```markdown
### {{BUG_ID}}: （エラーの一言タイトル）
- Status: FIXED
- Severity: HIGH | MEDIUM | LOW
- File: （ファイルパス）:（行番号）
- Fixed: {{TIMESTAMP}}

#### 症状
（エラーログの要約）

#### 原因
（技術的な原因）

#### 修正方法
（何をどう直したか）

#### 修正コミット
（コミットハッシュ）
```

### 修正コード
```filepath:src/xxx.py
# 修正後のコード全体
```

### 再発防止策
（同じバグを防ぐための改善点）
