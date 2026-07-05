import type { SupabaseClient } from '@supabase/supabase-js'

export async function trackEvent(
  supabase: SupabaseClient,
  userId: string,
  event: string,
): Promise<void> {
  try {
    const normalizedEvent = event.trim()
    if (!userId || !normalizedEvent) return

    const { error } = await supabase
      .from('usage_events')
      .insert({ user_id: userId, event: normalizedEvent })

    if (error) {
      console.warn('[track]', error)
    }
  } catch (error) {
    console.warn('[track]', error)
  }
}
