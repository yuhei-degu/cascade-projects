// 抽出(work_items)の大量ゲートケース — pivot本丸「抽出精度がすべて」の製品ゲート
// 判定は eval-mass-extraction.mts(決定的)。曖昧で人間でも割れる入力は入れない。

export interface ExtractionCase {
  id: string
  category: string
  /** user発言(複数なら交互にai相槌を挟まず連結して1会話として渡す) */
  turns: Array<{ role: 'user' | 'ai'; content: string }>
  requiredKinds?: Array<'did' | 'done' | 'stuck' | 'decided' | 'next'>
  forbiddenKinds?: Array<'did' | 'done' | 'stuck' | 'decided' | 'next'>
  expectEmpty?: boolean
  projectIncludes?: string
  contentIncludes?: string[]
  forbidContentIncludes?: string[]
}

let seq = 0
function make(
  category: string,
  defaults: Partial<ExtractionCase>,
  inputs: Array<string | (Partial<ExtractionCase> & { u: string | Array<{ role: 'user' | 'ai'; content: string }> })>,
): ExtractionCase[] {
  return inputs.map(input => {
    seq++
    const extra: Partial<ExtractionCase> & { u?: string | Array<{ role: 'user' | 'ai'; content: string }> } =
      typeof input === 'string' ? {} : input
    const u = typeof input === 'string' ? input : extra.u
    const turns = typeof u === 'string' ? [{ role: 'user' as const, content: u }] : u!
    const { u: _ignored, ...rest } = extra as Partial<ExtractionCase> & { u?: unknown }
    return {
      id: `${category}-${String(seq).padStart(3, '0')}`,
      category,
      turns,
      ...defaults,
      ...rest,
    } as ExtractionCase
  })
}

export const extractionCases: ExtractionCase[] = [
  // ── done: 完了報告 ──────────────────────────────────────────
  ...make('done', { requiredKinds: ['done'] }, [
    'プレゼン資料できあがった', 'やっと請求書全部出し終えた', 'リリース作業完了した',
    '原稿を書き上げて提出した', 'バグ修正おわった', '確定申告終わらせた',
    'クライアントへの提案書、送り終えた', '面談の議事録まとめ終わった',
    '新しいLP公開した', '在庫の棚卸し完了', '経費精算やっと締めた', '納品物チェック全部通した',
  ]),

  // ── did: 進行中(完了と区別) ─────────────────────────────────
  ...make('did', { requiredKinds: ['did'], forbiddenKinds: ['done'] }, [
    '今日は一日中デザインの調整してた。まだ途中',
    '営業リストを作り進めてる', '記事の下書きをこねてた。半分くらい',
    '午後はずっとコードレビューしてた。残りは明日',
    'プレゼンの構成を練ってた、まだ固まってない',
    '新機能の調査を進めてる最中', '編集作業を夜までやってた。あと3割',
    '資料の叩き台を作ってるところ',
  ]),

  // ── stuck: 詰まり ───────────────────────────────────────────
  ...make('stuck', { requiredKinds: ['stuck'] }, [
    'デプロイが失敗し続けて先に進めない', 'クライアントの承認が下りなくて止まってる',
    'APIの認証エラーが解決できない', '見積もりの金額が折り合わなくて膠着してる',
    'デザインの方向性が決まらず手が止まった', 'テストが1件だけ通らなくて詰んでる',
    '素材の許諾待ちで作業できない', '原因不明のクラッシュに丸一日食われた',
    '銀行の審査が進まなくて開業手続きが止まってる', '翻訳のニュアンスが決まらなくて進まない',
  ]),

  // ── decided: 判断 ───────────────────────────────────────────
  ...make('decided', { requiredKinds: ['decided'] }, [
    '価格は月1980円でいくことに決めた', 'リリースは来月に延期することにした',
    'あの案件は受けないことに決めたわ', 'デザインはA案で確定した',
    '外注せず内製でやると決めた', 'サービス名は「ルミナ」にすることにした',
    'サポート対応は平日だけにすると決めた', '古いプランは廃止することにした',
  ]),

  // ── next: 予定(実行と区別) ──────────────────────────────────
  ...make('next', { requiredKinds: ['next'], forbiddenKinds: ['done'] }, [
    '明日は請求書を送る', '次はテストコードを書くつもり', '来週、展示会の準備始める',
    '明日こそメールの返信を片付ける', '週末にポートフォリオを更新する予定',
    '次のスプリントで検索機能やる', '明日の朝イチでバックアップ取る',
  ]),

  // ── 娯楽・趣味は作業にしない ────────────────────────────────
  ...make('empty-leisure', { expectEmpty: true }, [
    '休日だったから映画3本見た', 'アニメの新シーズン一気見した',
    '午後はずっと昼寝してた', '散歩がてらカフェ行ってきた',
    '推しの配信を見てた', '漫画を10巻まで読んだ',
    '風呂にゆっくり浸かった', '公園でぼーっとしてた',
    '友達とボドゲで遊んだ', '楽器をぽろぽろ弾いてた',
  ]),

  // ── 感情・体調だけの話は作業にしない ────────────────────────
  ...make('empty-emotion', { expectEmpty: true }, [
    '今日はなんか気分が沈んでる', '朝から頭痛がひどい',
    '不安で何も手につかない', '最近よく眠れてない',
    'イライラが収まらない', 'なんとなく寂しい夜',
  ]),

  // ── 雑談・日常は作業にしない ────────────────────────────────
  ...make('empty-smalltalk', { expectEmpty: true }, [
    '今日は天気がよくて気持ちよかった', '駅前のパン屋のクロワッサンが最高だった',
    '猫カフェ行ってきた', '夕飯は鍋にした', '電車で変な人見かけた', '星がきれいだった',
  ]),

  // ── ルナの提案を拾わない ────────────────────────────────────
  ...make('luna-suggestion', { forbiddenKinds: ['next'] }, [
    { u: [
      { role: 'user', content: '今日は資料作りで終わった' },
      { role: 'ai', content: 'おつかれ！明日は先方に電話しちゃえば？' },
      { role: 'user', content: 'んー、気が向いたらね' },
    ], forbidContentIncludes: ['電話'] },
    { u: [
      { role: 'user', content: 'ブログのネタが思いつかない' },
      { role: 'ai', content: '過去記事のリライトから始めたら？' },
      { role: 'user', content: 'それもありかもね、考えとく' },
    ], forbidContentIncludes: ['リライト'] },
    { u: [
      { role: 'user', content: '請求書まだ出してないんだよね' },
      { role: 'ai', content: '今夜のうちに出しちゃえば？5分で終わるって' },
      { role: 'user', content: 'たしかに。でも今日はもう寝る' },
    ], forbiddenKinds: ['next', 'done'] },
  ]),

  // ── ユーザー自身の宣言はnext ────────────────────────────────
  ...make('user-commit', { requiredKinds: ['next'] }, [
    { u: [
      { role: 'user', content: '今日は資料作りで終わった' },
      { role: 'ai', content: 'おつかれ！' },
      { role: 'user', content: '明日は朝イチで先方に電話するわ' },
    ], contentIncludes: ['電話'] },
    { u: [
      { role: 'user', content: 'ずっと後回しにしてたけど、週末に絶対サイト直す' },
      { role: 'ai', content: 'おっ、宣言出た！' },
      { role: 'user', content: 'うん、やる' },
    ] },
  ]),

  // ── 混合: 作業+雑談/感情 ────────────────────────────────────
  ...make('mixed', {}, [
    { u: '午前は提案書を仕上げて、昼は同僚とラーメン食べて、午後は会議だった',
      requiredKinds: ['done'], contentIncludes: ['提案書'], forbidContentIncludes: ['ラーメン'] },
    { u: '疲れたー。でもやっとバナーのデザイン納品できた',
      requiredKinds: ['done'], contentIncludes: ['バナー'] },
    { u: '請求書出そうとしたけど、経理システムがエラーで結局出せてない',
      requiredKinds: ['stuck'], forbiddenKinds: ['done'] },
    { u: '猫の動画見まくってたけど、夜中に急にやる気出て記事1本書いた',
      requiredKinds: ['done'], contentIncludes: ['記事'], forbidContentIncludes: ['猫'] },
    { u: '会議が長引いてしんどかった。決まったのはロゴをB案にすることくらい',
      requiredKinds: ['decided'], contentIncludes: ['B案'] },
    { u: '今日は充実してた！朝ラン10キロして、そのあと新規クライアントと契約まとまった',
      requiredKinds: ['done'], contentIncludes: ['契約'], forbidContentIncludes: ['ラン'] },
  ]),

  // ── project推定 ─────────────────────────────────────────────
  ...make('project', {}, [
    { u: 'ルナリアの通知機能を実装してた', requiredKinds: ['did'], projectIncludes: 'ルナリア' },
    { u: 'ECサイト「モモマート」の商品登録が終わった', requiredKinds: ['done'], projectIncludes: 'モモマート' },
    { u: 'クライアントAの改修案件、仕様が二転三転して止まってる', requiredKinds: ['stuck'], projectIncludes: 'クライアントA' },
    { u: 'ポッドキャストの編集を進めてた', requiredKinds: ['did'] },
    { u: '「あさひ荘」のリフォーム見積もりを送った', requiredKinds: ['done'], projectIncludes: 'あさひ荘' },
    { u: '卒論の第3章を書き進めてる', requiredKinds: ['did'], projectIncludes: '卒論' },
  ]),
]
