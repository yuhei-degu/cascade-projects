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

export function getJstMonthRange(monthString: string): { startDate: string; endDate: string; startIso: string; endIso: string } {
  if (!/^\d{4}-\d{2}$/.test(monthString)) {
    throw new Error('invalid_month')
  }

  const [year, month] = monthString.split('-').map(Number)
  const startDate = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-01`
  const nextMonthUtc = Date.UTC(year, month, 1) - JST_OFFSET_MS
  const start = getJstDayRange(startDate)
  const endDate = getJstDateString(new Date(nextMonthUtc))

  return {
    startDate,
    endDate,
    startIso: start.startIso,
    endIso:   new Date(nextMonthUtc).toISOString(),
  }
}

