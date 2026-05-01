import OpenAI from 'openai'
import type {
  TurnTopicExtraction, DailyCoverageState,
  ConversationMode, TopicCluster,
} from './types'
import { FALLBACK_TOPIC } from './types'

const gemini = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

// 曖昧質問パターン（コード側で確実に判定）
const VAGUE_PATTERNS = [
  /他に.{0,5}(ある|ない|ない[かな])/,
  /何が.{0,5}(いい|良い|ある)/,
  /おすすめ.{0,5}(ある|ない|は)/,
  /何か.{0,5}ない/,
  /どれ.{0,5}(がいい|が良い)/,
]

// 実用質問の検知（how-to 系 + 事実・数字系）
const PRACTICAL_PATTERNS = [
  // how-to 系
  'どうすれば', '対策', '治し方', 'おすすめ', '方法', 'コツ',
  '防ぐ', '避ける', '直す', '使い方', 'やり方', 'どうしたら',
  '解決', '改善', 'どうにか',
  // 事実・数字系（v7 追加：はぐらかし防止）
  '平均', '相場', 'どれくらい', 'いくらくらい', 'いくら',
  '比較', '違い', '何円',
]

export function detectResponseMode(input: string): 'normal' | 'practical_help' {
  return PRACTICAL_PATTERNS.some(p => input.includes(p)) ? 'practical_help' : 'normal'
}

const VAGUE_CLARIFY_QUESTIONS = [
  'どんなのが好き？',
  '何系の気分？',
  'ひとりで？それとも誰かと？',
  'インドア派？アウトドア派？',
  'どんなジャンルが好きなの？',
]

function detectVague(message: string): { isVague: boolean; question: string } {
  if (VAGUE_PATTERNS.some(p => p.test(message)) && message.length < 25) {
    const q = VAGUE_CLARIFY_QUESTIONS[Math.floor(Math.random() * VAGUE_CLARIFY_QUESTIONS.length)]
    return { isVague: true, question: q }
  }
  return { isVague: false, question: '' }
}

const TOPIC_PROMPT = `以下のユーザー発言を分析して、JSONのみを返してください。

{
  "summary": "発言の要点を1文で",
  "emotions": ["emotion1"],
  "current_topic": "work|health|meal|hobby|relation|future|daily_event|money|self_image|sleep|other",
  "subtopic": "lower_snake_case",
  "topic_depth": 1,
  "novelty": 1,
  "needs_followup": false,
  "user_initiated_shift": false,
  "intent": "clarify_first|answer_directly",
  "clarifying_question": ""
}

intentの判定基準：
- clarify_first: 条件（ジャンル・目的・状況）が不足していて提案できない
  これらは全て clarify_first：
  「他に面白いことあるかな」「何がいいかな」「おすすめある？」「何かない？」
  「どうしたらいい？」「何をしたらいい？」「どれがいい？」
- answer_directly: 感情・出来事・具体的な内容が含まれている

clarifying_question: clarify_firstの場合のみ埋める（20〜30文字の自然な聞き返し）

判定基準：
topic_depth: 1=初出 〜 5=深く掘っている
novelty: 0=繰り返し / 1=少し新情報 / 2=明確な新展開
needs_followup: 今話題を変えると不自然かどうか
user_initiated_shift: 「そういえば」「話変わるけど」など明示的な話題変更`

export async function extractTurnTopic(
  userMessage: string,
  recentMessages: Array<{ role: string; content: string }>,
): Promise<TurnTopicExtraction> {
  // コード側で曖昧パターンを先に判定（Geminiに頼らない）
  const vague = detectVague(userMessage)
  if (vague.isVague) {
    return { ...FALLBACK_TOPIC, intent: 'clarify_first', clarifying_question: vague.question }
  }

  // 短い雑談はGemini呼び出しをスキップ（速度優先）
  if (userMessage.length <= 10) {
    return { ...FALLBACK_TOPIC, intent: 'answer_directly' }
  }

  const ctx = recentMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')
  try {
    const res = await gemini.chat.completions.create({
      model: 'gemini-2.5-flash',
      max_tokens: 300,
      messages: [
        { role: 'system', content: TOPIC_PROMPT },
        { role: 'user', content: `直近の会話:\n${ctx}\n\nユーザーの発言: ${userMessage}` },
      ],
    })
    const raw = (res.choices[0]?.message?.content ?? '{}').replace(/```json|```/g, '').trim()
    return JSON.parse(raw) as TurnTopicExtraction
  } catch { return FALLBACK_TOPIC }
}

export function decideConversationMode(params: {
  messageScore: number; windowScore: number; heavySignalCount: number
  consecutiveTopicCount: number; topic: TurnTopicExtraction
}): ConversationMode {
  const { messageScore, windowScore, heavySignalCount, consecutiveTopicCount, topic } = params
  if (topic.user_initiated_shift) return 'continue'
  if (messageScore >= 6 || topic.needs_followup || heavySignalCount >= 2 || windowScore >= 8)
    return 'deepen'
  if (messageScore < 4 && consecutiveTopicCount >= 3 && topic.novelty === 0 && !topic.needs_followup)
    return 'shift_soft'
  if (messageScore >= 4 && consecutiveTopicCount >= 5 && topic.topic_depth >= 4 && topic.novelty === 0 && !topic.needs_followup)
    return 'shift_soft'
  return 'continue'
}

export function getShiftCandidates(coverage: DailyCoverageState): string[] {
  const c: string[] = []
  if (!coverage.health)         c.push('体調')
  if (!coverage.meal)           c.push('食事')
  if (!coverage.tomorrow)       c.push('明日の予定')
  if (!coverage.hobby)          c.push('趣味')
  if (!coverage.small_positive) c.push('今日少しよかったこと')
  return c.slice(0, 3)
}

export function updateCoverage(coverage: DailyCoverageState, topic: TurnTopicExtraction): DailyCoverageState {
  const next = { ...coverage }
  const t = topic.current_topic
  if (t === 'work')     next.work = true
  if (t === 'health')   next.health = true
  if (t === 'meal')     next.meal = true
  if (t === 'relation') next.relation = true
  if (t === 'hobby')    next.hobby = true
  if (t === 'future')   next.tomorrow = true
  if (topic.emotions.some(e => ['happy', 'relieved', 'excited'].includes(e))) next.small_positive = true
  return next
}

export function buildModeInstruction(mode: ConversationMode, candidates: string[]): string {
  if (mode === 'deepen') return `
[Conversation Mode: deepen]
現在の話題はまだ受け止め継続が必要です。無理に話題を変えないでください。共感・整理を優先し、問いは1つだけ。`

  if (mode === 'shift_soft') {
    const hint = candidates.length > 0 ? `\n転換候補：${candidates.join('・')}` : ''
    return `
[Conversation Mode: shift_soft]
現在の話題は十分に触れられています。1文で受け止めた後、今日という1日の別の側面へ自然に橋渡ししてください。
「ところで別の話なんだけど」は禁止。例：「それだけ今日は仕事の比重が大きかったんだね。帰ってからは少し落ち着けた？」${hint}`
  }
  return ''
}

export function clusterTopics(extractions: any[]): any[] {
  const map = new Map<string, any>()
  for (const e of extractions) {
    const key = `${e.current_topic ?? 'other'}__${e.subtopic ?? 'unknown'}`
    const weight = (e.importance_score ?? 1) * (1 + (e.self_disclosure_depth ?? 0) * 0.5)
    const ex = map.get(key)
    if (ex) {
      ex.count++
      ex.emotionalWeight += weight
    } else {
      map.set(key, { topic: e.current_topic ?? 'other', subtopic: e.subtopic ?? 'unknown', count: 1, emotionalWeight: weight })
    }
  }
  return [...map.values()].sort((a, b) => b.emotionalWeight - a.emotionalWeight).slice(0, 3)
}
