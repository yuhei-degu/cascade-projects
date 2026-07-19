// ピボット・ドッグフーディングのスコアボード — 「最初の審判」(2週間毎晩使うか)の計測
// 読み取り専用。実行: npx tsx scripts/pivot-metrics.mts [--days=14]
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

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = a.match(/^--([a-z]+)=(.*)$/)
  return m ? [m[1], m[2]] : [a, '1']
}))
const DAYS = Number(args.days ?? 14)
const JST = 9 * 60 * 60 * 1000
const today = new Date(Date.now() + JST).toISOString().slice(0, 10)
const since = new Date(Date.now() + JST - (DAYS - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const sinceIso = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

async function q<T = any>(path: string): Promise<T[] | null> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) return null
  return res.json() as Promise<T[]>
}

console.log(`===== ピボット・スコアボード (${since} 〜 ${today}) =====\n`)

// 1. 会話の継続(最初の審判)
const messages = await q<{ created_at: string; role: string }>(
  `lunaria_messages?select=created_at,role&created_at=gte.${sinceIso}&limit=5000`)
if (messages) {
  const daySet = new Set(messages.filter(m => m.role === 'user')
    .map(m => new Date(new Date(m.created_at).getTime() + JST).toISOString().slice(0, 10)))
  console.log(`会話した日: ${daySet.size}/${DAYS}日 (ユーザー発言 ${messages.filter(m => m.role === 'user').length}件)`)
  console.log(`  ${[...daySet].sort().join(', ') || 'なし'}`)
} else {
  console.log('会話ログ: 取得失敗')
}

// 2. 作業抽出(Phase 1)
const workItems = await q<{ date: string; kind: string; deleted_at: string | null }>(
  `lunaria_work_items?select=date,kind,deleted_at&date=gte.${since}&limit=2000`)
if (workItems) {
  const active = workItems.filter(w => !w.deleted_at)
  const byKind = active.reduce((acc: Record<string, number>, w) => {
    acc[w.kind] = (acc[w.kind] ?? 0) + 1
    return acc
  }, {})
  const days = new Set(active.map(w => w.date)).size
  console.log(`\n作業記録: ${active.length}件 / ${days}日 (削除済み ${workItems.length - active.length}件)`)
  console.log(`  内訳: ${Object.entries(byKind).map(([k, n]) => `${k}:${n}`).join(' ') || 'なし'}`)
} else {
  console.log('\n作業記録: テーブル未適用(migration 025)')
}

// 3. 修正率(抽出精度の実地KPI)
const events = await q<{ event: string; created_at: string }>(
  `usage_events?select=event,created_at&created_at=gte.${sinceIso}&limit=5000`)
if (events) {
  const count = (name: string) => events.filter(e => e.event === name).length
  const edits = count('work_item_edit')
  const deletes = count('work_item_delete')
  const total = (workItems ?? []).length
  const rate = total > 0 ? (((edits + deletes) / total) * 100).toFixed(1) : '-'
  console.log(`\n修正操作: 編集${edits} / 削除${deletes} / 復元${count('work_item_restore')} (修正率 ${rate}%${total > 0 ? '' : ' — 分母なし'})`)
  console.log(`  /workページ閲覧: ${count('work_view')}回 / 日記閲覧: ${count('diary_view')}回`)
} else {
  console.log('\n修正操作: usage_events未適用(migration 024)')
}

// 4. 明日の一手(Phase 2)
const diaries = await q<{ diary_date: string; tomorrow_step: string | null }>(
  `lunaria_diary_logs?select=diary_date,tomorrow_step&diary_date=gte.${since}&limit=100`)
if (diaries) {
  const withStep = diaries.filter(d => d.tomorrow_step && d.tomorrow_step.trim())
  console.log(`\n日記: ${diaries.length}件 / 明日の一手あり: ${withStep.length}件`)
  for (const d of withStep.slice(-3)) console.log(`  ${d.diary_date}: ${d.tomorrow_step}`)
} else {
  const legacy = await q<{ diary_date: string }>(`lunaria_diary_logs?select=diary_date&diary_date=gte.${since}&limit=100`)
  console.log(`\n日記: ${legacy ? `${legacy.length}件` : '取得失敗'} / 明日の一手: 列未適用(migration 026)`)
}

// 5. 週次レビュー(Phase 3)
const reviews = await q<{ week_start: string; title: string }>(
  `lunaria_weekly_reviews?select=week_start,title&week_start=gte.${since}&limit=10`)
if (reviews) {
  console.log(`\n週次レビュー: ${reviews.length}件`)
  for (const r of reviews) console.log(`  ${r.week_start}: ${r.title}`)
} else {
  console.log('\n週次レビュー: テーブル未適用(migration 027)')
}

console.log('\n(migration未適用の項目は lunaria/implementation/migrations/025-027_pivot_apply.sql を適用すると動き出す)')
