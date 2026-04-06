// lib/wait-time.ts
// RamenFlow — 待ち時間ルールベース計算ロジック

import type { WaitTimeParams } from '@/lib/types/database'

/**
 * 現在の注文状況から待ち時間（分）を計算する
 * MVP版: ルールベース。将来はMLで補正予定
 */
export function calcWaitMinutes(params: WaitTimeParams): number {
  const { pendingItems, staffCount, parallelCapacity } = params

  if (pendingItems.length === 0) return 0

  // 調理待ち（new）の合計負荷
  const newLoad = pendingItems
    .filter(i => i.status === 'new')
    .reduce((sum, i) => sum + i.cooking_time_minutes, 0)

  // 調理中（cooking）は残り50%と仮定
  const cookingLoad = pendingItems
    .filter(i => i.status === 'cooking')
    .reduce((sum, i) => sum + Math.ceil(i.cooking_time_minutes * 0.5), 0)

  // 実効同時調理数（staffCount × 2 と parallelCapacity の小さい方）
  const effectiveCapacity = Math.max(
    1,
    Math.min(parallelCapacity, staffCount * 2)
  )

  const rawMinutes = (newLoad + cookingLoad) / effectiveCapacity

  // 最低2分（調理中でも提供まで少し時間がかかる）
  return Math.max(2, Math.ceil(rawMinutes))
}

/**
 * 稼働率による補正
 * @param baseMinutes calcWaitMinutes の結果
 * @param occupiedCount 使用中の席数
 * @param totalCount 総席数
 * @param staffCount スタッフ人数
 * @param configuredStaff 設定上のスタッフ人数
 */
export function applyCorrections(
  baseMinutes: number,
  occupiedCount: number,
  totalCount: number,
  staffCount: number,
  configuredStaff: number
): number {
  let result = baseMinutes

  // スタッフが設定値の半分以下なら 1.5倍
  if (staffCount <= Math.floor(configuredStaff / 2)) {
    result = Math.ceil(result * 1.5)
  }

  // 席の稼働率 80% 以上なら +5分
  if (totalCount > 0 && occupiedCount / totalCount >= 0.8) {
    result += 5
  }

  return result
}

/**
 * 待ち時間（分）を客向けのテキストに変換する
 * 断定しない表現を使うこと（約・〜・程度）
 */
export function formatWaitTime(minutes: number, isOpen: boolean): string {
  if (!isOpen) return ''
  if (minutes <= 0) return 'ただいますぐご案内できます'
  if (minutes <= 5)  return '現在 約5分のお待ち'
  if (minutes <= 10) return '現在 約5〜10分のお待ち'
  if (minutes <= 20) return '現在 約10〜20分のお待ち'
  if (minutes <= 35) return '現在 約20〜35分のお待ち（混雑中）'
  return '現在 大変混み合っております（35分以上）'
}

/**
 * ホームページ向け: 混雑度を3段階で返す
 */
export type CrowdLevel = 'low' | 'medium' | 'high'

export function getCrowdLevel(waitMinutes: number): CrowdLevel {
  if (waitMinutes <= 5)  return 'low'
  if (waitMinutes <= 20) return 'medium'
  return 'high'
}

export const CROWD_LEVEL_LABELS: Record<CrowdLevel, string> = {
  low:    '空いています',
  medium: 'やや混んでいます',
  high:   '混雑中',
}

export const CROWD_LEVEL_COLORS: Record<CrowdLevel, string> = {
  low:    'text-status-delivered',
  medium: 'text-status-cooking',
  high:   'text-status-alert',
}
