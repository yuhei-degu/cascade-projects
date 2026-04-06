// lib/utils.ts
// RamenFlow 共通ユーティリティ
// npm install clsx tailwind-merge が必要

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Tailwind CSS クラスを安全にマージするヘルパー
 * clsx で条件分岐 → tailwind-merge で重複クラスを解決
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 金額を日本円形式にフォーマット
 * @example formatPrice(1200) → "¥1,200"
 */
export function formatPrice(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`
}

/**
 * 日時を日本語の相対時間に変換
 * @example formatRelativeTime(new Date()) → "たった今"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 1000 / 60)

  if (diffMin < 1)  return 'たった今'
  if (diffMin < 60) return `${diffMin}分前`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}時間前`

  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

/**
 * 注文受付からの経過時間（分）を返す
 */
export function getElapsedMinutes(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime()
  return Math.floor(diff / 1000 / 60)
}

/**
 * 「5分以上経過した未提供注文」かどうかを判定
 * スタッフ画面のアラート表示に使用
 */
export function isOverdue(createdAt: string, thresholdMinutes = 5): boolean {
  return getElapsedMinutes(createdAt) >= thresholdMinutes
}

/**
 * URLサーチパラメータから table_number を安全に取得
 * /order?table=A1 → "A1"
 * パラメータがない場合は null を返す
 */
export function getTableNumberFromParams(
  searchParams: { [key: string]: string | string[] | undefined }
): string | null {
  const table = searchParams['table']
  if (!table) return null
  return Array.isArray(table) ? table[0] : table
}

/**
 * 空文字・null・undefined を安全に文字列に変換
 */
export function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}
