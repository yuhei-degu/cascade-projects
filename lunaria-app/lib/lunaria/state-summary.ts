import type { Emotion } from './types'

type TimeSlot = 'morning' | 'daytime' | 'evening' | 'night' | 'latenight'

export function getTimeSlot(): TimeSlot {
  const h = new Date().getHours()
  if (h >= 5  && h < 10) return 'morning'
  if (h >= 10 && h < 17) return 'daytime'
  if (h >= 17 && h < 21) return 'evening'
  if (h >= 21 && h < 24) return 'night'
  return 'latenight'
}

const TIME_NOTE: Record<TimeSlot, string> = {
  morning:   'おはよう時間帯・少しテンション控えめでOK',
  daytime:   '',
  evening:   '夕方・仕事終わりの可能性あり',
  night:     '夜・落ち着いたトーンで',
  latenight: '深夜・無理に明るくしない・短めに',
}

// 感情数値を短い雰囲気ワードに変換 + 時間帯を付加
export function buildStateSummary(emotion: Emotion, closenessNote: string): string {
  const tags: string[] = []

  if (emotion.joy >= 7)                                   tags.push('機嫌いい')
  else if (emotion.joy <= 1)                              tags.push('少し元気なし')

  if (emotion.sadness >= 6 || emotion.anxiety >= 6)      tags.push('重さあり')
  else if (emotion.sadness >= 3 || emotion.anxiety >= 3) tags.push('少し沈み気味')

  if (emotion.loneliness >= 7)                           tags.push('つながり求めてる')
  else if (emotion.loneliness >= 4)                      tags.push('少し寂しげ')

  if (emotion.anger >= 5)                                tags.push('苛立ちあり')
  if (emotion.shyness >= 5)                              tags.push('照れてる')

  const base = tags.length > 0 ? tags.join('・') : '普通'
  const timeNote = TIME_NOTE[getTimeSlot()]

  return [base, closenessNote, timeNote].filter(Boolean).join('　')
}
