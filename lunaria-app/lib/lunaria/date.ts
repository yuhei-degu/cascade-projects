const JST_OFFSET_MS = 9 * 60 * 60 * 1000

export function getJstDateString(date = new Date()): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10)
}

export function getJstDayRange(dateString: string): { startIso: string; endIso: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('invalid_date')
  }

  const [year, month, day] = dateString.split('-').map(Number)
  const startUtc = Date.UTC(year, month - 1, day) - JST_OFFSET_MS
  const start = new Date(startUtc)
  const end = new Date(startUtc + 24 * 60 * 60 * 1000)

  if (getJstDateString(start) !== dateString) {
    throw new Error('invalid_date')
  }

  return {
    startIso: start.toISOString(),
    endIso:   end.toISOString(),
  }
}

