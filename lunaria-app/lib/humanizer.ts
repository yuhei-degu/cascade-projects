// lib/humanizer.ts  Response Humanization Layer
// モデルの生出力を、ルナリアらしい自然な会話文へ変換する

// AI臭いパターンと置換ルール
const AI_PATTERNS: [RegExp, string][] = [
  [/もちろんです[。！]?/g, ''],
  [/承知しました[。！]?/g, ''],
  [/ご質問ありがとうございます[。！]?/g, ''],
  [/お気持ちお察しします[。！]?/g, 'それはしんどいね'],
  [/〜ですね[。！]?/g, 'だよね'],
  [/〜ます。/g, 'よ。'],
  [/〜です。/g, 'だよ。'],
  [/〜でしょう[か]?[。！]?/g, 'かな？'],
  [/〜と思います[。！]?/g, 'と思う'],
  [/〜かと思われます[。！]?/g, 'かも'],
  [/是非/g, 'ぜひ'],
  [/いかがでしょうか[。？]?/g, 'どう？'],
  [/お役に立てれば幸いです[。！]?/g, ''],
  [/参考になれば幸いです[。！]?/g, ''],
]

// 箇条書き・番号リストの除去（会話文に変換）
function removeBullets(text: string): string {
  return text
    .replace(/^[\s]*[・•\-\*]\s+/gm, '')    // 箇条書き
    .replace(/^[\s]*\d+[.．、]\s+/gm, '')    // 番号リスト
    .replace(/\n{3,}/g, '\n')                 // 過剰な改行
    .trim()
}

// AI臭い表現を除去
function removeAISmell(text: string): string {
  let result = text
  for (const [pattern, replacement] of AI_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return result.replace(/\s{2,}/g, ' ').trim()
}

// 文字数チェック（長すぎる場合は最初の2〜3文に絞る）
function enforceLength(text: string, policy: 'short' | 'natural' | 'extended'): string {
  const sentences = text.split(/(?<=[。！？])\s*/)
    .map(s => s.trim()).filter(Boolean)

  if (policy === 'short'    && sentences.length > 2) return sentences.slice(0, 2).join('')
  if (policy === 'natural'  && sentences.length > 3) return sentences.slice(0, 3).join('')
  return text
}

// 英語混入チェック（日本語文中の長い英単語を除去）
function removeEnglish(text: string): string {
  return text.replace(/\b[a-zA-Z]{5,}\b/g, match => {
    const dict: Record<string, string> = {
      hospital: '病院', doctor: '医者', police: '警察',
      serious: '真剣', normal: '普通', energy: '元気',
    }
    return dict[match.toLowerCase()] ?? match
  })
}

export function humanize(
  rawOutput: string,
  lengthPolicy: 'short' | 'natural' | 'extended' = 'natural',
): { text: string; wasModified: boolean } {
  const original = rawOutput
  let text = rawOutput

  text = removeBullets(text)
  text = removeAISmell(text)
  text = removeEnglish(text)
  text = enforceLength(text, lengthPolicy)
  text = text.trim()

  // 空になった場合は元に戻す
  if (text.length < 3) text = original.trim()

  return {
    text,
    wasModified: text !== original.trim(),
  }
}
