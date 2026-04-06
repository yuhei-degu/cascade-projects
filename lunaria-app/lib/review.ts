// lib/review.ts  ルナリア育成ログ評価ロジック

// ── キャラ崩れ自動検知 ──────────────────────────────────────
export function detectCharacterBreak(response: string): {
  suspected: boolean
  flags: string[]
} {
  const flags: string[] = []

  // 4文以上
  const sentences = response.split(/[。！？]/).filter(s => s.trim().length > 0)
  if (sentences.length >= 4) flags.push('too_long')

  // 断定ワード
  if (/絶対|すべき|必ず|〜べきだ/.test(response)) flags.push('断定ワード')

  // 敬語混入
  if (/です。|ます。|でしょう|ございます/.test(response)) flags.push('敬語混入')

  // 思考ワードゼロ（serious モードでのみチェック）
  const thinkingWords = ['ちょい待って', 'うまく言えない', '多分こうだと', '違ったらごめん']
  if (!thinkingWords.some(w => response.includes(w))) flags.push('思考ワード欠落')

  // 英語混入
  if (/[a-zA-Z]{4,}/.test(response)) flags.push('英語混入')

  return { suspected: flags.length >= 2, flags }
}

// ── 次発言センチメント評価 ───────────────────────────────────
export function evalFollowupSentiment(
  prevRoute: string,
  nextMessage: string,
  nextScore: number,
): 'escalated' | 'neutral' | 'resolved' | 'dropped' {
  // 会話が途切れた（短すぎる・離脱系）
  if (nextMessage.length <= 3 && /^(は|え|ん|ふ|うん|そ)/.test(nextMessage)) {
    return 'dropped'
  }
  // 悪化（スコア急上昇）
  if (nextScore >= 4) return 'escalated'
  // 好転（seriousから軽い雑談に戻った）
  if (prevRoute === 'claude_serious' && nextScore === 0) return 'resolved'
  return 'neutral'
}

// ── ルートミスマッチ疑い検知 ──────────────────────────────────
export function suspectRouteMismatch(
  selectedRoute: string,
  sentiment: string,
  prevWindowScore: number,
  nextScore: number,
): boolean {
  // light_normal/probe で次発言が急激に重化
  if (
    (selectedRoute === 'light_normal' || selectedRoute === 'light_probe') &&
    sentiment === 'escalated' &&
    nextScore >= 6
  ) return true

  // claude_serious なのに次発言が trivial で続く（重すぎた）
  if (selectedRoute === 'claude_serious' && sentiment === 'dropped') return true

  return false
}

// ── 自動フラグ生成（保存用 JSON）──────────────────────────────
export interface AutoFlags {
  characterBreak: boolean
  characterBreakReasons: string[]
  routeMismatch: boolean
  followupSentiment: string
}

export function buildAutoFlags(
  response: string,
  selectedRoute: string,
  prevWindowScore: number,
  nextMessage: string,
  nextScore: number,
): AutoFlags {
  const { suspected, flags } = detectCharacterBreak(response)
  const sentiment = evalFollowupSentiment(selectedRoute, nextMessage, nextScore)
  const mismatch = suspectRouteMismatch(selectedRoute, sentiment, prevWindowScore, nextScore)

  return {
    characterBreak: suspected,
    characterBreakReasons: flags,
    routeMismatch: mismatch,
    followupSentiment: sentiment,
  }
}
