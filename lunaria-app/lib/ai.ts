// callGemini(gemini-2.0-flash, 404)は死にコードだったため削除（pivot Phase 1 / pivot-plan.md 参照）
export const safe = <T>(s: string, fb: T): T => {
  try { return JSON.parse(s) } catch { return fb }
}
