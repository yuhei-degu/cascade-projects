# KNOWLEDGE.md 追記 - 2026-04-07

## 曖昧質問への提案羅列問題（解決済み）

### 問題
Gemini 2.5 Flash が「他に面白いことあるかな」に対して提案を2〜3個羅列する。

### 根本原因（チャッピー分析）
プロンプトの問題ではなく責務設計の問題。
LLMのデフォルト最適化が「役に立つ＝提案」になっている。

### 解決策
コード側でパターンマッチ → 曖昧質問を確実に検知 → LLMをバイパス。

```typescript
const VAGUE_PATTERNS = [/他に.{0,5}(ある|ない)/, /何が.{0,5}(いい|良い)/, ...]
if (VAGUE_PATTERNS.some(p => p.test(message)) && message.length < 25) {
  return { intent: 'clarify_first', clarifying_question: 'どんなのが好き？' }
}
```

### 教訓
- Gemini の分類は信頼できない（answer_directly を返し続けた）
- コード側で強制制御する方が確実・高速・コスト削減にもなる
- チャッピーの言う「分類と生成を分離する」は正しい

## 「わかるわかる！」問題
Few-shot 例文から滲み出る。humanizer で直接除去した。
→ AI_PATTERNS に追加して構造的に除去。

## max_tokens の適切値（Gemini 2.5 Flash）
- 150 → 短すぎ（「わかるわかる！」で切れる）
- 300 → やや短い（深い話で途切れる）
- 500 → 概ね適切
- 1000 → 長すぎ（提案が羅列される）
