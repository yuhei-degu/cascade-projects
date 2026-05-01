import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

const USER_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('lunaria_messages')
    .select('role, content, created_at')
    .eq('user_id', USER_ID)
    .order('created_at', { ascending: false })
    .limit(60)

  if (error) {
    return NextResponse.json({ messages: [] })
  }

  const messages = (data ?? [])
    .sort((a: any, b: any) => {
      const tDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (tDiff !== 0) return tDiff
      // 同じ created_at は user → assistant の順に固定
      return a.role === 'user' ? -1 : 1
    })
    .map((m: any) => ({
      role:    m.role === 'ai' ? 'assistant' : m.role,
      content: m.content,
      ts:      new Date(m.created_at).getTime(),
    }))

  return NextResponse.json({ messages })
}
