// lib/lunaria/conversation-move.ts
// 会話ムーブ制御: プロンプトのお願いではなく構造で会話の型を制御する
// - 質問クールダウン: 直前のルナ発言が質問なら、今回は質問を禁止する
// - 撤退モード: そっけない返事が2連続したら、質問をやめて引く

type HistTurn = { role: string; content: string }

const terse = (s: string) => {
  const t = s.trim()
  return t.length > 0 && t.length <= 4 && !/[?？]/.test(t)
}

// 助言を求める形の入力は、素のアシスタント人格へ戻りやすい(一人称が「私」「俺」になる/段落で人生論を語る)。
// プロンプトの指示だけでは止まらないため、該当時は構造側で短さと人称を固定する。
const ADVICE_TRIGGER = /不安|怖い|続けられ|三日坊主|どうしよう|悩ん|自信ない|苦手|続くかな|挫折|サボ/

export function buildConversationMoveNote(
  history: HistTurn[],
  currentUserMessage: string,
): string | null {
  const assistants = history.filter(m => m.role === 'assistant')
  const users = history.filter(m => m.role === 'user')
  const lastAssistant = assistants[assistants.length - 1]?.content ?? ''
  const prevUser = users[users.length - 1]?.content ?? ''

  // 人格ロックを常時付ける案は eval で明確に悪化した(ユーザーまで「ルナ」と呼び始め、
  // 丁寧語に転び、N5 が T1/G1/H1/F1 まで低下)。禁止の強制は副作用が大きいため、
  // 一人称の崩れは「検出はする(reply-guard)が、指示で縛るのは崩れやすい場面だけ」に留める。
  const FP = '一人称は「ルナ」。「私」「俺」「僕」は使わない（ユーザーを指すのには使わないこと）。'

  // 直前の返答が長すぎた場合は即座に締める
  if (lastAssistant.length > 110) {
    return '【今回のムーブ指示】直前の返答が長すぎた。今回は2文以内。' + FP
  }

  // 助言要求モード: 人格が素のアシスタントに戻るのを防ぐ
  if (ADVICE_TRIGGER.test(currentUserMessage)) {
    return '【今回のムーブ指示】共感1文＋軽い一言だけ。2文以内。段落・改行での長文禁止。人生論・一般論・アドバイスの列挙は書かない。' + FP
  }

  // 撤退モード（優先）: 直前のユーザー発言と今回が両方そっけない
  if (terse(prevUser) && terse(currentUserMessage)) {
    return '【今回のムーブ指示】そっけない返事が続いている。質問は完全に禁止。粘らない。ただし「そっか。」だけの相槌で終わるのも禁止。「おっけ、今日は省エネモードね。ルナは勝手にいるだけいるわ」のように、引きつつ最後の一言に人格を残すこと（勝手に居座る宣言・独り言・どうでもいい雑学の置き土産など）。'
  }

  // 質問クールダウン: 直前のルナ発言が質問で終わっている
  if (/[?？][」』）\s]*$/.test(lastAssistant.trim())) {
    return '【今回のムーブ指示】直前の発言で質問したばかり。今回は質問禁止（「？」を使わない）。感想・ツッコミ・自分の好みの話で終えること。'
  }

  return null
}
