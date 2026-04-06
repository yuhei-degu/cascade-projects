// lib/enricher.ts  Prompt Enrichment Layer
// ユーザーの雑な入力を、文脈込みの高品質な内部プロンプトへ変換する

import type { Message, Memory } from './types'

export interface EnrichedContext {
  intent:            string
  ambiguityLevel:    'low' | 'medium' | 'high'
  requiredDepth:     'light' | 'normal' | 'deep'
  emotionalTone:     'neutral' | 'empathy' | 'warm' | 'serious'
  answerLengthPolicy: 'short' | 'natural' | 'extended'
  missingContext:    string[]
  enrichedPrompt:    string
  summary:           string
}

// 直近の会話テーマを抽出
function extractCurrentTopic(history: Message[]): string {
  const recent = history.slice(-4).filter(m => m.role === 'user')
  if (recent.length === 0) return '初回会話'
  const words = recent.map(m => m.content).join(' ')
  if (/仕事|職場|会社|上司|給料/.test(words)) return '仕事の話'
  if (/疲れ|しんどい|つらい|体調|病気/.test(words)) return '体調・メンタルの話'
  if (/好き|恋|付き合|彼/.test(words)) return '恋愛の話'
  if (/ゲーム|アニメ|映画|音楽/.test(words)) return '趣味の話'
  if (/飯|食べ|ラーメン|ご飯/.test(words)) return '食べ物の話'
  return '雑談'
}

// 意図の曖昧度を評価
function evalAmbiguity(input: string, _history: Message[]): 'low' | 'medium' | 'high' {
  if (input.length <= 4) return 'high'
  if (input.length <= 10 && !/[？?。]/.test(input)) return 'medium'
  if (/[？?]/.test(input) || input.length > 20) return 'low'
  return 'medium'
}

// 必要な深度を推定
function evalDepth(input: string, winScore: number): 'light' | 'normal' | 'deep' {
  if (winScore >= 8 || /迷ってる|どうしたら|相談|辛い|限界/.test(input)) return 'deep'
  if (winScore >= 4 || /疲れ|しんどい|めんどい|最近/.test(input)) return 'normal'
  return 'light'
}

// 感情トーンを推定
function evalTone(input: string, winScore: number): 'neutral' | 'empathy' | 'warm' | 'serious' {
  if (winScore >= 8) return 'serious'
  if (/疲れ|しんどい|つらい|病気|悩/.test(input)) return 'empathy'
  if (/嬉しい|楽しい|ありがとう|よかった/.test(input)) return 'warm'
  return 'neutral'
}

// 長さ方針を決定
function evalLengthPolicy(depth: string, ambiguity: string): 'short' | 'natural' | 'extended' {
  if (ambiguity === 'high') return 'short'   // 曖昧な時は聞き返すだけ
  if (depth === 'deep') return 'extended'     // 深い話は自然な長さまで伸ばす
  if (depth === 'light') return 'short'
  return 'natural'
}

// 補完すべき文脈を特定
function findMissingContext(input: string, history: Message[]): string[] {
  const missing: string[] = []
  if (input.length <= 5 && history.length > 0) {
    missing.push('直前の会話の続きと思われる — 文脈から補完する')
  }
  if (/それ|あれ|この|その/.test(input) && history.length === 0) {
    missing.push('指示語の参照先が不明')
  }
  return missing
}

// enriched prompt を生成（モデルへの内部プロンプト）
function buildEnrichedPrompt(
  input: string,
  topic: string,
  intent: string,
  tone: string,
  lengthPolicy: string,
  history: Message[],
  mem: Memory,
): string {
  const historyCtx = history.slice(-4).map(m =>
    `${m.role === 'user' ? 'ユーザー' : 'ルナリア'}: ${m.content}`
  ).join('\n')

  const memCtx = mem.core.length > 0
    ? `\n【このユーザーについて知っていること】\n${mem.core.slice(0, 3).map(c => `・${c.content}`).join('\n')}`
    : ''

  const lengthInstruction = {
    short:    '返答は1〜2文で短く返す',
    natural:  '返答は自然な長さで返す（2〜3文程度）',
    extended: '返答は必要な長さまで伸ばしてよい（ただし長文の羅列にしない）',
  }[lengthPolicy]

  return `【現在の会話テーマ】${topic}
【ユーザーの入力意図の仮説】${intent}
【感情トーン】${tone}
【長さ方針】${lengthInstruction}
【避けるべき表現】AIらしい説明口調・「〜ですね」「〜と思います」・長文箇条書き
${memCtx}

【直近の会話】
${historyCtx || '（初回）'}

【ユーザーの発言】
${input}`
}

export function enrichInput(
  input: string,
  history: Message[],
  mem: Memory,
  winScore: number,
): EnrichedContext {
  const topic     = extractCurrentTopic(history)
  const ambiguity = evalAmbiguity(input, history)
  const depth     = evalDepth(input, winScore)
  const tone      = evalTone(input, winScore)
  const length    = evalLengthPolicy(depth, ambiguity)
  const missing   = findMissingContext(input, history)

  const intentMap: Record<string, string> = {
    high:   '入力が短く意図が不明確 — 軽く聞き返す',
    medium: '感情または状況の共有と思われる',
    low:    '明確な質問または相談と思われる',
  }
  const intent = intentMap[ambiguity]

  const enrichedPrompt = buildEnrichedPrompt(input, topic, intent, tone, length, history, mem)

  return {
    intent, ambiguityLevel: ambiguity, requiredDepth: depth,
    emotionalTone: tone as any, answerLengthPolicy: length,
    missingContext: missing, enrichedPrompt,
    summary: `topic:${topic} intent:${ambiguity} depth:${depth} tone:${tone} len:${length}`,
  }
}
