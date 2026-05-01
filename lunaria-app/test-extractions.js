const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').trim().split('\n')
    .map(l => { const i = l.indexOf('='); return [l.slice(0,i), l.slice(i+1)] })
)

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

s.from('lunaria_extractions')
  .select('session_date, summary, importance_score, unresolved_issues')
  .eq('user_id', '00000000-0000-0000-0000-000000000001')
  .order('created_at', { ascending: false })
  .limit(5)
  .then(({ data, error }) => {
    if (error) console.log('ERROR:', error)
    else data.forEach(e => console.log(
      e.session_date, '| score:', e.importance_score,
      '| summary:', (e.summary ?? '').slice(0, 40),
      '| issues:', JSON.stringify(e.unresolved_issues)
    ))
  })
