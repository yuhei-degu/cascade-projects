# templates/prompts/04_test.md
# TEST_AI（テストエージェント）向けプロンプト

{{MASTER_CONTEXT}}

## あなたのタスク: テスト生成

### テスト対象コード
```
{{SOURCE_CODE}}
```

### テスト要件
以下を全てカバーするpytestテストを生成してください:

1. **ユニットテスト** — 各関数・メソッドの動作確認
2. **境界値テスト** — エッジケース（空・None・最大値・最小値）
3. **異常系テスト** — エラー時の挙動確認
4. **統合テスト** — 主要な処理フロー全体

### テストコード出力形式
```filepath:tests/test_xxx.py
import pytest
from src.xxx import ...

class TestXxx:
    def test_正常系_（テスト名）(self):
        # Arrange
        # Act
        # Assert

    def test_異常系_（テスト名）(self):
        with pytest.raises(ValueError):
            ...
```

### カバレッジ目標: 80%以上

### 実行コマンド
```bash
python -m pytest tests/ -v --cov=src --cov-report=html
```
