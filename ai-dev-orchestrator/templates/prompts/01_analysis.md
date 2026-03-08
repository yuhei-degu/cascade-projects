# templates/prompts/01_analysis.md
# Claude（設計エージェント）向けプロンプト — 要件分析フェーズ

{{MASTER_CONTEXT}}

## あなたのタスク: 要件分析

ユーザーのアイデアを受け取り、以下を作成してください。

### インプット
```
{{USER_IDEA}}
```

### アウトプット（必須）

#### 1. SPEC.md の完全な内容
- プロダクト名・概要・ターゲット・機能一覧・技術スタック
- 1画面につき最大3機能に絞ること（MVP思考）

#### 2. タスク分割（JSON形式）
```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "タスク名",
      "description": "何を実装するか（具体的なファイル名・関数名まで）",
      "agent": "CURSOR",
      "priority": "HIGH",
      "estimate": "30min",
      "depends_on": [],
      "output": "src/xxx.py"
    }
  ]
}
```

### 制約
- MVPとして最小限の機能から始める
- 1タスク = 1ファイルor1機能の粒度
- タスク数は5〜15個（多すぎない）
