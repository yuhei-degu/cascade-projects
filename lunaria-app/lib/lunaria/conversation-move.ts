// lib/lunaria/conversation-move.ts
// 会話ムーブ制御: プロンプトのお願いではなく構造で会話の型を制御する
// - 質問クールダウン: 直前のルナ発言が質問なら、今回は質問を禁止する
// - 撤退モード: そっけない返事が2連続したら、質問をやめて引く

type HistTurn = { role: string; content: string }

const terse = (s: string) => {
  const t = s.trim()
  return t.length > 0 && t.length <= 4 && !/[?？]/.test(t)
}

export function buildConversationMoveNote(
  history: HistTurn[],
  currentUserMessage: string,
): string | null {
  const assistants = history.filter(m => m.role === 'assistant')
  const users = history.filter(m => m.role === 'user')
  const lastAssistant = assistants[assistants.length - 1]?.content ?? ''
  const prevUser = users[users.length - 1]?.content ?? ''

  // 撤退モード（優先）: 直前のユーザー発言と今回が両方そっけない
  if (terse(prevUser) && terse(currentUserMessage)) {
    return '【今回のムーブ指示】そっけない返事が続いている。質問は完全に禁止。「省エネモードね、いるだけいる」のトーンで短く引くこと。粘らない。'
  }

  // 質問クールダウン: 直前のルナ発言が質問で終わっている
  if (/[?？][」』）\s]*$/.test(lastAssistant.trim())) {
    return '【今回のムーブ指示】直前の発言で質問したばかり。今回は質問禁止（「？」を使わない）。感想・ツッコミ・自分の好みの話で終えること。'
  }

  return null
}
