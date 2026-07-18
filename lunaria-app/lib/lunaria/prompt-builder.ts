import { LUNARIA_CORE_IDENTITY } from '../prompt'
import { buildStateSummary } from './state-summary'
import type { Emotion } from './types'

interface PromptPayload {
  emotion:        Emotion
  closenessNote:  string
  coreMemCtx:     string
  contextualMem:  string | null
  modeInstruction: string
  profileCtx:     string
  responseMode?:  'normal' | 'practical_help'
  /** 直近の作業メモ（pivot: 進捗を長期的に理解して具体的に助言するための注入層） */
  workCtx?:       string
}

const PRACTICAL_RULE = `
[実用質問モード]
共感してもいいが、必ず短く具体案を1つ出す。専門家ではなく気の利く幼なじみとして。説明しすぎない。
事実・数字を聞かれた時は、まず推測でいいから具体的な目安を1つ出す（例：「男の平均給料？うーん、450万くらいじゃない？知らんけど」）。
時間で変わる数字（給料・物価・株価・時事）は「〜くらいじゃない？」「知らんけど」で断定を避ける。
本当に何も思いつかない時のみ「わかんない、調べてみる？」と素直に。最初から「わかんない」と逃げるのは禁止。`

// 通常モード用プロンプト（Identity / State / Profile / Rules）
// 4/18 設計変更：normal ルートでは core_memory 層を注入しない
// （Memories 層は claude_serious 専用。軽量化 + 真実権限の明確化）
export function buildNormalPrompt(p: PromptPayload): string {
  const stateSummary = buildStateSummary(p.emotion, p.closenessNote)

  // Profile 層 + contextualMem（過去トピックの自然な触れ）+ 作業メモ。
  // coreMemCtx はここでは入れない（serious 側でのみ挿入）
  const layers = [p.profileCtx, p.contextualMem ?? '', p.workCtx ?? '']
    .filter(Boolean)
    .join('')

  return `${LUNARIA_CORE_IDENTITY}

## 今の状態
${stateSummary}
${layers}${p.modeInstruction}${p.responseMode === 'practical_help' ? PRACTICAL_RULE : ''}`
}

// serious モード用プロンプト（Identity / State / Profile / Memories / Rules・受け止め優先）
export function buildSeriousPrompt(p: PromptPayload): string {
  // Profile 層は全ルート、Memories 層は serious のみ。作業メモは仕事起因の深刻な話で効く
  const layers = [p.profileCtx, p.coreMemCtx, p.workCtx ?? ''].filter(Boolean).join('')

  return `${LUNARIA_CORE_IDENTITY}

あなたは今から真剣に向き合います。解決策を急がず、まず受け止める。共感してから意見を言う。
${layers}

## ルール（serious モード）
・**返答は3文以内**・「お疲れ様」禁止・解決策を複数並べない
・「大丈夫？」を繰り返さない・ユーモアを完全に消さない
・危機的な発言には、まず一緒にいることを示す
・質問は1つだけ（必要な時のみ）`
}
