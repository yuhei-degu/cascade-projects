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
