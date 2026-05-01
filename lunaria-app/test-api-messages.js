const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const http = require('http')

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').trim().split('\n')
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)] })
)

// /api/messages と同じロジックを再現
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

s.from('lunaria_messages')
  .select('role, content, created_at')
  .eq('user_id', '00000000-0000-0000-0000-000000000001')
  .order('created_at', { ascending: true })
  .limit(40)
  .then(({ data, error }) => {
    if (error) { console.log('DB ERROR:', error); return }
    const messages = (data ?? []).map(m => ({
      role:    m.role === 'ai' ? 'assistant' : m.role,
      content: m.content,
      ts:      new Date(m.created_at).getTime(),
    }))
    console.log('count:', messages.length)
    console.log('first:', messages[0])
    console.log('last:', messages[messages.length - 1])
  })
