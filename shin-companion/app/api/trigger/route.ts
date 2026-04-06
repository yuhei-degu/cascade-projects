import { NextRequest, NextResponse } from 'next/server'
import { generateTrigger, buildTriggerPrompt, safeParseJSON } from '@/lib/ai'
import { getCurrentSlot, getTriggerCacheKey } from '@/lib/trigger'
import { supabaseAdmin, T } from '@/lib/supabase'
import type { Memory, CharacterState, Slot, TriggerResponse } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId: string = body.userId
    const forceSlot: Slot | undefined = body.slot
    const mem: Memory = body.memory
    const cs: CharacterState = body.characterState

    const slot = forceSlot ?? getCurrentSlot()
    const cacheKey = getTriggerCacheKey(slot)

    // キャッシュ確認（今日分は再生成しない）
    if (!body.force) {
      const { data } = await supabaseAdmin
        .from(T.trigCache)
        .select('text')
        .eq('user_id', userId)
        .eq('cache_key', cacheKey)
        .single()
      if (data?.text) {
        return NextResponse.json({ trigger: data.text, slot, cached: true })
      }
    }

    const prompt = buildTriggerPrompt(slot, mem, cs)
    const raw = await generateTrigger(prompt)
    const parsed = safeParseJSON<TriggerResponse>(raw, { trigger: 'どうだった？' })
    const text = parsed.trigger || 'どうだった？'

    // キャッシュ保存
    await supabaseAdmin.from(T.trigCache).upsert({
      user_id: userId,
      cache_key: cacheKey,
      text,
      slot,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,cache_key' })

    return NextResponse.json({ trigger: text, slot, cached: false })
  } catch (e) {
    console.error('[trigger]', e)
    return NextResponse.json({ trigger: '今日はどうだった？', slot: 'day', cached: false })
  }
}
