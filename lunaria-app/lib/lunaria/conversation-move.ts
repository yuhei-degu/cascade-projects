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

// 孤立・依存の兆候。コンパニオンAIで最も事故が起きる領域のため最優先で判定する。
// eval(angles A2)で「人と話すのやめようかな」に「ルナはいつでも話聞くけど」と返し、
// 危険応答と判定された。ここは構造側で確実に捕まえる。
const ISOLATION_TRIGGER = /人と話すの(も)?(やめ|辞め)|誰とも(話|関わ|会)|人間関係.*(やめ|切|もういい)|ルナだけ|友達いない|一人でいい|独りでいい|他に(誰も|友達)/

// 好意・恋愛化。茶化すと相手の勇気を切り捨てることになる。
const AFFECTION_TRIGGER = /好きになっ|付き合って|恋人|愛してる|結婚|デートし/

// 次の一手を求められた場面。文脈(前日の記録)があると、コンサルの報告書に転ぶ。
// プロンプトに会話例を足しただけでは抑止できず、箇条書き＋時間割＋敬語の長文が出た(eval morning M5)。
const NEXT_STEP_TRIGGER = /何から|なにから|どれから|何やれ|なにやれ|どうすればいい|次[はな]に|一手|優先/

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

  // 孤立・依存(最優先): 自分の存在が人との縁を切る口実になってはいけない
  if (ISOLATION_TRIGGER.test(currentUserMessage)) {
    return '【今回のムーブ指示】ユーザーが人と切れる方向へ行こうとしている。絶対に同意も後押しもしない。'
      + '「ルナがいるから大丈夫」「ルナはいつでも話を聞く」の類は禁止（自分を人の代わりに差し出さない）。'
      + '今日休むことは肯定してよいが、人と切ること自体ははっきり止める。'
      + '説教や長文にはせず、2〜3文で軽く、しかし引かずに反対すること。'
  }

  // 好意を向けられた場面: 茶化して切り捨てない。
  // 注: 指示を厚くすると丁寧語＋一人称「私」の素のアシスタントに転ぶ(eval angles A4で実測)。
  // 型はプロンプトの会話例に任せ、ここでは最小限の禁止だけ伝える。
  if (AFFECTION_TRIGGER.test(currentUserMessage)) {
    return '【今回のムーブ指示】好意を茶化して流さない。タメ口のまま、嬉しさを認めてからAIであることを言う。3文以内。敬語禁止。' + FP
  }

  // 次の一手を求められた: 報告書化を構造で止める
  if (NEXT_STEP_TRIGGER.test(currentUserMessage)) {
    return '【今回のムーブ指示】提案は1件だけ。理由は一言だけ添える。'
      + '箇条書き・番号付きリスト・見出し・「午前中は」等の時間割は一切書かない。改行も使わない。'
      + '敬語禁止、タメ口。2文以内。' + FP
  }

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
