// ピボットmigration(025〜027)の適用状態チェック — 読み取り専用
// PostgREST経由でテーブル/列の存在を確認する(DDLは実行しない)。
// 実行: npx tsx scripts/migration-check.mts
import { readFileSync, existsSync } from 'node:fs'

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.*)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) { console.error('Supabase env not found'); process.exit(1) }

async function probe(path: string): Promise<{ ok: boolean; detail: string }> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  })
  if (res.ok) return { ok: true, detail: `OK (rows: ${res.headers.get('content-range') ?? '?'})` }
  const body = await res.text()
  return { ok: false, detail: `${res.status} ${body.slice(0, 100)}` }
}

const checks: Array<{ id: string; label: string; path: string }> = [
  { id: '025', label: 'lunaria_work_items テーブル', path: 'lunaria_work_items?select=id&limit=0' },
  { id: '026', label: 'lunaria_diary_logs.tomorrow_step 列', path: 'lunaria_diary_logs?select=tomorrow_step&limit=0' },
  { id: '027', label: 'lunaria_weekly_reviews テーブル', path: 'lunaria_weekly_reviews?select=id&limit=0' },
]

console.log('===== ピボットmigration適用状態 =====')
let missing = 0
for (const c of checks) {
  const r = await probe(c.path)
  if (!r.ok) missing++
  console.log(`${r.ok ? '○ 適用済み' : '✗ 未適用'}  ${c.id}: ${c.label}${r.ok ? '' : `\n     → ${r.detail}`}`)
}
if (missing > 0) {
  console.log(`\n未適用 ${missing}件。SQL Editorで lunaria/implementation/migrations/025-027_pivot_apply.sql を1回貼り付ければ全部入る`)
  console.log('(手順詳細: lunaria/SUPABASE_025_027_APPLY_RUNBOOK.md)')
} else {
  console.log('\n全部適用済み。ドッグフーディング開始できる')
}
process.exit(missing > 0 ? 1 : 0)
