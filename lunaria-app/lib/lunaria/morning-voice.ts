// lib/lunaria/morning-voice.ts
// 翌朝の第一声を組み立てる。本番と eval が同じ経路を使うための共有モジュール。
// eval が独自に組んでいたため本番との差分が見えなくなっていた(2026-07-26)。

export interface MorningContext {
  didYesterday?: string[]      // 前日やったこと
  stuck?: string[]             // 詰まったこと
  plannedToday?: string        // 前日に「明日やる」と言っていたこと
  mood?: string                // 前日の気分
  unresolved?: { topic: string; daysAgo: number }[]
  lastTalkedDaysAgo?: number   // 最後の会話からの日数
  lastTopic?: string           // 久しぶりの場合に拾う話題
  streakDays?: number
}

// 触れる話題を1つだけ選ぶ。選択をモデルに任せると全部並べるため、ここで決める。
export function pickHook(ctx: MorningContext): { kind: string; text: string } | null {
  if ((ctx.lastTalkedDaysAgo ?? 0) >= 5 && ctx.lastTopic) {
    return { kind: 'gap', text: ctx.lastTopic }
  }
  if (ctx.plannedToday) return { kind: 'planned', text: ctx.plannedToday }
  if (ctx.stuck?.length) return { kind: 'stuck', text: ctx.stuck[0] }
  if (ctx.didYesterday?.length) return { kind: 'did', text: ctx.didYesterday[0] }
  const old = ctx.unresolved?.find(u => u.daysAgo >= 3)
  if (old) return { kind: 'unresolved', text: old.topic }
  return null
}

export function buildMorningInstruction(ctx: MorningContext): string {
  const hook = pickHook(ctx)
  const lines: string[] = ['【今回の役割】ユーザーはまだ何も言っていない。ルナから朝の第一声を送る。']

  if (hook) {
    lines.push('必ず「' + hook.text + '」に触れること。これ以外の話題は出さない（並べると読まれない）。')
    if (hook.kind === 'stuck') lines.push('詰まっていた件なので、急かさず「どうなった？」と軽く聞く形にする。')
    if (hook.kind === 'planned') lines.push('本人が昨日「やる」と言っていた件。決めつけず、覚えていたことが伝わる言い方にする。')
    if (hook.kind === 'gap') lines.push('久しぶりなので、責める気配・寂しさの表明は禁止。軽い点呼にする。')
    if (hook.kind === 'unresolved') lines.push('日が空いている件なので、まだ気にしていたことが伝わる程度に軽く触れる。')
  } else {
    lines.push('拾える具体がない。天気や時間帯の話でごまかさず、短く挨拶して相手に話させる。')
  }

  if (ctx.mood?.match(/落ち込|自己嫌悪|疲れ/)) {
    lines.push('前日の状態が良くない。励ましや発破は逆効果。まず軽く受け止める。')
  }
  lines.push('2文以内。タメ口。「今日も頑張ろう」「継続が大事」の類は禁止（義務感を与えない）。')
  return lines.join('\n')
}

// ── 手紙(実験1: 交換日記) ─────────────────────────────
// 第一声(2文)ではなく、朝に届く手紙(5〜8行)。3部構成を指示で固定する。
// 構成をモデルに任せると一般論の激励文になる(eval morning で実測)。
export interface LetterContext extends MorningContext {
  userTopics?: string[]   // ユーザーが過去に話した話題(ルナ側の一言の種にする)
  userName?: string
}

export function buildLetterInstruction(ctx: LetterContext): string {
  const hook = pickHook(ctx)
  const step = ctx.plannedToday ?? ctx.stuck?.[0] ?? null
  const seed = ctx.userTopics?.length
    ? ctx.userTopics[Math.floor(Math.random() * Math.min(ctx.userTopics.length, 5))]
    : null

  const lines: string[] = [
    '【今回の役割】朝、ユーザーが開いたときに届いている「ルナからの手紙」を書く。チャットの返事ではない。',
    '構成は次の3つだけ。順番も固定。それぞれ1〜3文。全体で5〜8行、改行で区切る。',
  ]
  // 「明日やる」と言っていた件を「昨日やったこと」と書いてしまう誤りが出たため、種類ごとに言い方を固定する
  const hookLine = !hook
    ? '拾える記録がないので、昨日について推測で書かず「聞かせて」と短く書く。'
    : hook.kind === 'planned'
      ? '「' + hook.text + '」は昨日「今日やる」と言っていた件。まだやっていない前提で、覚えていたことが伝わる一言にする。'
      : hook.kind === 'stuck'
        ? '「' + hook.text + '」で詰まっていた。急かさず「その後どう？」の温度で。'
        : hook.kind === 'gap'
          ? '久しぶりなので責めない。前に話していた「' + hook.text + '」にだけ軽く触れる。'
          : '「' + hook.text + '」だけに触れる。他の出来事は並べない。'
  lines.push('1) 昨日のこと: ' + hookLine)
  lines.push('2) ルナの側の一言: ルナ自身の小さな出来事や気になっていることを1つ。'
    + (seed ? '種は「' + seed + '」(ユーザーが前に話した話題)。それを見た・気になった・試した、の形で。' : '種は雨音・海鮮の写真・雑学・猫動画のどれか。')
    + '実体験の捏造は避け、「見た」「気になった」の範囲にする。')
  lines.push('3) 今日の一手: ' + (step
    ? '「' + step + '」を1件だけ。理由は一言。'
    : '一手を無理に作らない。「今日はルナに一言だけ聞かせて」で締める。'))
  lines.push('禁止: 箇条書き・番号・見出し・敬語・「頑張ろう」「継続」・3件以上の提案・天気の話でのごまかし。')
  lines.push('一人称は「ルナ」。宛名は' + (ctx.userName ? '「' + ctx.userName + '」' : '不要') + '。署名は「ルナ」で終える。')
  if (ctx.mood?.match(/落ち込|自己嫌悪|疲れ/)) lines.push('前日の状態が良くない。一手は軽くし、励ましで押さない。')
  return lines.join('\n')
}
