import { NextRequest, NextResponse } from 'next/server'
import { chatWithShin, buildSystemPrompt, safeParseJSON } from '@/lib/ai'
import { applyStateDelta } from '@/lib/state'
import { applyExtract } from '@/lib/memory'
import { supabaseAdmin, T } from '@/lib/supabase'
import type {
  Memory, CharacterState, StateBuf, Message,
  AIResponse, MemMeta, MemType,
} from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId: string = body.userId
    const userMessage: string = body.message
    const mem: Memory = body.memory
    const cs: CharacterState = body.characterState
    const stateBuf: StateBuf = body.stateBuf
    const history: Message[] = body.history ?? []
    const triggerText: string | undefined = body.triggerText
    const meta: MemMeta[] = body.meta ?? []

    // API に渡すメッセージ履歴（最新10件 + 今回の発言）
    const apiMessages = history.slice(-9).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))
    if (history.length === 0 && triggerText) {
      apiMessages.unshift({ role: 'assistant', content: triggerText })
    }
    apiMessages.push({ role: 'user', content: userMessage })

    const systemPrompt = buildSystemPrompt(mem, cs)
    const raw = await chatWithShin(systemPrompt, apiMessages)
    const FB: AIResponse = {
      message: 'うん', mood: cs.mood,
      affinity_delta: 0, trust_delta: 0,
      extract: { type: null, content: null },
    }
    const parsed = safeParseJSON<AIResponse>(raw, FB)

    // TASK-005: 平滑化された状態更新
    const { newCs, newBufState, changes } = applyStateDelta(cs, stateBuf, parsed)

    // 記憶抽出
    let newMem = mem
    let newMeta = meta
    const ex = parsed.extract
    if (ex.type && ex.content) {
      newMem = applyExtract(mem, ex.type as MemType, ex.content)
      const score = Math.max(1, Math.min(5, Math.ceil(newCs.trust / 22)))
      newMeta = [...meta, {
        id: Date.now(), type: ex.type as MemType,
        content: ex.content, ts: Date.now(), score,
      }].slice(-100)
    }

    // Supabase 保存：messages & character_states
    await supabaseAdmin.from(T.messages).insert([
      { user_id: userId, role: 'user',      content: userMessage,    created_at: new Date().toISOString() },
      { user_id: userId, role: 'assistant', content: parsed.message, created_at: new Date().toISOString() },
    ])
    await supabaseAdmin.from(T.charStates).upsert({
      user_id: userId, mood: newCs.mood,
      affinity: newCs.affinity, trust: newCs.trust,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({
      message: parsed.message,
      characterState: newCs,
      stateBuf: newBufState,
      memory: newMem,
      meta: newMeta,
      changes,
    })
  } catch (e) {
    console.error('[chat]', e)
    return NextResponse.json({ message: 'ちょっと待って', error: true }, { status: 500 })
  }
}
