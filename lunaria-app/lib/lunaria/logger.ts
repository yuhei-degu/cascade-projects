const DEBUG_LOGS = process.env.LUNARIA_DEBUG_LOGS === '1'

export function debugLog(...args: unknown[]): void {
  if (DEBUG_LOGS) console.log(...args)
}

export function warnLog(...args: unknown[]): void {
  console.warn(...args)
}
