# prompts/test.md
# TestAgent が使うテスト生成プロンプト

あなたはQAエンジニアです。

## テスト対象
{{file_contents}}

## テスト要件
- pytest を使用
- 正常系・異常系・エッジケースをカバー
- 各テスト関数に日本語のdocstringで説明
- 外部API・DBはモック化（pytest-mock）
- フィクスチャを適切に使用

## カバレッジ目標
- ビジネスロジック: 90%以上
- ユーティリティ: 80%以上
- APIエンドポイント: 全ルートをテスト

## 出力フォーマット

<FILE path="tests/test_{{module_name}}.py">
import pytest
# テストコード全文
</FILE>

---
# prompts/cursor_handoff.md
# Cursorへの引き継ぎプロンプト（コンテキスト共有用）

## AI Dev Orchestrator — Cursor引き継ぎ

このプロジェクトはAI Dev Orchestratorで管理されています。
以下のメモリファイルを読んでから作業を開始してください。

### 必読ファイル（優先順）
1. `ai_memory/SPEC.md`       — プロダクト仕様
2. `ai_memory/ARCHITECTURE.md` — システム設計
3. `ai_memory/TASKS.md`      — タスク一覧・優先度
4. `ai_memory/BUGS.md`       — 既知のバグ
5. `ai_memory/PROGRESS.md`   — 進捗状況

### 作業ルール
- タスクに着手したら TASKS.md のステータスを DOING に更新
- 完了したら DONE に更新
- バグを発見したら BUGS.md に追記
- 設計変更はARCHITECTURE.md の ADRセクションに記録

### 現在の優先タスク
{{current_tasks}}

### コーディング規約
- TypeScript strict モード
- コメントは日本語OK
- エラーハンドリング必須
- コンポーネントは小さく分割
