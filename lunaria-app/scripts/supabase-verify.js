#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
const EXPECTED_POOL_TOTAL = 41
const EXPECTED_PITY_THRESHOLD = 200

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  const content = fs.readFileSync(filePath, 'utf8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const equals = line.indexOf('=')
    if (equals === -1) continue

    const key = line.slice(0, equals).trim()
    let value = line.slice(equals + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function pass(message, detail) {
  console.log(`PASS ${message}${detail ? `: ${detail}` : ''}`)
}

function fail(message, detail) {
  console.error(`FAIL ${message}${detail ? `: ${detail}` : ''}`)
  process.exitCode = 1
}

function warn(message, detail) {
  console.warn(`WARN ${message}${detail ? `: ${detail}` : ''}`)
}

async function checkSelectableColumns(supabase, table, columns, label) {
  const { error } = await supabase
    .from(table)
    .select(columns.join(', '))
    .limit(1)

  if (error) {
    fail(label, error.message)
  } else {
    pass(label, columns.join(', '))
  }
}

async function checkGachaPool(supabase) {
  const { data, error } = await supabase
    .from('lunaria_gacha_pool')
    .select('id, rarity')
    .eq('is_active', true)
    .limit(1000)

  if (error) {
    fail('Gacha active pool query', error.message)
    return
  }

  const total = data?.length ?? 0
  if (total === EXPECTED_POOL_TOTAL) {
    pass('Gacha active pool total', `${total}/${EXPECTED_POOL_TOTAL}`)
  } else {
    fail('Gacha active pool total', `${total}/${EXPECTED_POOL_TOTAL}`)
  }
}

async function checkPityState(supabase, userId) {
  const { error } = await supabase
    .from('lunaria_gacha_pity_state')
    .select('draws_since_urban_legend, lifetime_draws, last_urban_legend_at, updated_at')
    .eq('user_id', userId)
    .limit(1)

  if (error) {
    fail('Gacha pity state columns', error.message)
  } else {
    pass('Gacha pity state columns')
  }
}

async function checkHttp(baseUrl) {
  if (!baseUrl) {
    warn('HTTP checks skipped', 'pass http://localhost:3000 or set LUNARIA_BASE_URL')
    return
  }

  const normalized = baseUrl.replace(/\/$/, '')
  const checks = [
    ['/api/health', response => response.ok],
    ['/api/gacha/state', async response => {
      if (!response.ok) return false
      const data = await response.json()
      return !data.pity || data.pity.threshold === EXPECTED_PITY_THRESHOLD
    }],
    ['/api/diary?meta=1', response => response.ok],
  ]

  for (const [route, isOk] of checks) {
    try {
      const response = await fetch(`${normalized}${route}`, { cache: 'no-store' })
      const ok = await isOk(response)
      if (ok) pass(`HTTP ${route}`, `HTTP ${response.status}`)
      else fail(`HTTP ${route}`, `HTTP ${response.status}`)
    } catch (error) {
      fail(`HTTP ${route}`, error.message)
    }
  }
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'))
  const baseUrl = process.argv[2] || process.env.LUNARIA_BASE_URL || ''
  const userId = process.env.LUNARIA_VERIFY_USER_ID || DEFAULT_USER_ID
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )

  console.log('Lunaria Supabase 014-018 verification')
  console.log(`User: ${userId}`)
  if (baseUrl) console.log(`Base URL: ${baseUrl}`)
  console.log('')

  await checkGachaPool(supabase)
  await checkPityState(supabase, userId)
  await checkSelectableColumns(
    supabase,
    'lunaria_gacha_history',
    ['pity_before', 'pity_after', 'pity_triggered'],
    'Gacha history pity columns',
  )
  await checkSelectableColumns(
    supabase,
    'lunaria_diary_logs',
    ['title', 'talked_about', 'memory_changes', 'source_message_count', 'generated_at'],
    'Diary v1 columns',
  )
  await checkSelectableColumns(
    supabase,
    'lunaria_core_memory',
    ['source_date', 'source_message_id', 'confidence', 'status', 'last_confirmed_at', 'created_by', 'notes'],
    'Core memory provenance columns',
  )
  await checkSelectableColumns(
    supabase,
    'lunaria_memory_candidates',
    ['candidate_type', 'content', 'source_type', 'source_date', 'confidence', 'status', 'reason', 'deleted_at'],
    'Memory candidate columns',
  )
  await checkHttp(baseUrl)

  if (process.exitCode) {
    console.error('\nLunaria Supabase verification failed.')
    process.exit(process.exitCode)
  }
  console.log('\nLunaria Supabase verification passed.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
