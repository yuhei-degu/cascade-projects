import type { Slot } from './types'

// TASK-001: 時刻 → スロット判定
export function getSlot(hour: number): Slot {
  if (hour >= 5 && hour <= 10) return 'morning'
  if (hour >= 20 || hour < 5)  return 'night'
  return 'day'
}

export function getCurrentSlot(): Slot {
  return getSlot(new Date().getHours())
}

export function getTriggerCacheKey(slot: Slot): string {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  return `trigger_${slot}_${today}`
}
