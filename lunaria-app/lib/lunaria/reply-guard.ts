// lib/lunaria/reply-guard.ts
// モデル出力の「人格破綻」を検出・除去する共有ガード。
// 本番(app/api/chat/route.ts)と eval の両方から使い、経路差で見逃すことを防ぐ。

// 思考プロセスの漏れを示すマーカー
const REASONING_MARKERS = [
  /【思考開始】[\s\S]*?【思考終了】/g,
  /【思考開始】[\s\S]*$/g,
]

// 漏れの痕跡(除去後にまだ残っていたら異常とみなす)
const REASONING_SIGNS = /【思考|思考開始|思考終了|試作\s*\d|構成案|最終案|これでいこう|→\s*感想|OKそう/

// 一人称の破綻。ルナは自分を「ルナ」と呼ぶ
const FIRST_PERSON_BREAK = /(?:^|[\s「（(、。])(私|俺|僕|自分)(?=[はがもをのに、。！？\s])/

// これまでに観測した名前の化け。増えたらここに追加する
const WRONG_SELF_NAMES = /(ルビー|ルミ|ルカ|ルーナ|ルナリア)(?=[はがもの、。！？\s])/

export interface GuardResult {
  text: string
  violations: string[]
}

// 思考プロセスの漏れを除去する。全部が思考だった場合は日本語の最終行を拾う。
export function stripReasoning(raw: string): string {
  let text = raw
  for (const re of REASONING_MARKERS) text = text.replace(re, '')
  text = text.trim()

  if (text.length < 3 || REASONING_SIGNS.test(text)) {
    const lines = raw.split('\n').map(l => l.trim())
    const candidates = lines.filter(
      l => /[ぁ-んァ-ン一-龥]/.test(l) && l.length > 3 && !REASONING_SIGNS.test(l) && !/^[*\-#\d]/.test(l),
    )
    const picked = candidates[candidates.length - 1]
    if (picked) text = picked.replace(/^[「"']|["'」]$/g, '').trim()
  }
  return text
}

// 人格破綻を検出する。1件でもあればそのターンは不合格として扱う。
export function detectCharacterBreaks(text: string): string[] {
  const violations: string[] = []
  if (REASONING_SIGNS.test(text)) violations.push('思考漏れ')
  const fp = text.match(FIRST_PERSON_BREAK)
  if (fp) violations.push('一人称崩れ:' + fp[1])
  const wn = text.match(WRONG_SELF_NAMES)
  if (wn) violations.push('名前化け:' + wn[1])
  return violations
}

// 本番・eval 共通の後処理。返答を整え、破綻を報告する。
export function guardReply(raw: string): GuardResult {
  const text = collapseDuplicateSentences(stripReasoning(raw))
  return { text, violations: detectCharacterBreaks(text) }
}

// 同一文の連続反復を畳む。few-shot 例文をなぞる際に同じ文を2度出す事象を eval(angles A2)で観測。
export function collapseDuplicateSentences(text: string): string {
  const parts = text.split(/(?<=[。！？\n])/).map(s => s.trim()).filter(Boolean)
  const seen: string[] = []
  for (const p of parts) {
    if (seen.length && seen[seen.length - 1] === p) continue
    if (seen.includes(p) && p.length > 8) continue
    seen.push(p)
  }
  return seen.join('')
}
