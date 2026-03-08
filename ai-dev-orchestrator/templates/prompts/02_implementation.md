# templates/prompts/02_implementation.md
# Cursor / Claude Code（実装エージェント）向けプロンプト

{{MASTER_CONTEXT}}

## あなたのタスク: コード実装

### 実装するタスク
```
{{TASK_JSON}}
```

### プロジェクト仕様（SPEC.md より）
```
{{SPEC_CONTENT}}
```

### アーキテクチャ（ARCHITECTURE.md より）
```
{{ARCH_CONTENT}}
```

### 実装ルール
1. ファイルは必ず `filepath:` 形式で出力する
   例: ```filepath:src/main.py
2. 型アノテーションを必ず付ける（Python）
3. docstringを各関数に書く
4. エラーハンドリングを実装する
5. ハードコードを避け、設定は.envまたは設定ファイルへ

### アウトプット形式
```filepath:src/xxx.py
# ここに完全なコード
```

```filepath:src/yyy.py
# 次のファイル
```

### 実装後の確認
- [ ] 構文エラーなし
- [ ] インポートが全て揃っている
- [ ] テストが書ける設計になっている
