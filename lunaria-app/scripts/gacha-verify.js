#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
const EXPECTED_PITY_THRESHOLD = 200
const EXPECTED_V2_RARITY_COUNTS = {
  common_a: 8,
  common_b: 7,
  rare_a: 3,
  rare_b: 3,
  epic: 3,
  legendary: 2,
  urban_legend: 15,
}

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

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function increment(map, key) {
  map[key] = (map[key] || 0) + 1
}

function formatCounts(map) {
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
}

function expectedTotal() {
  return Object.values(EXPECTED_V2_RARITY_COUNTS).reduce((sum, value) => sum + value, 0)
}

async function checkPoolShape(supabase) {
  const { data, error } = await supabase
    .from('lunaria_gacha_pool')
    .select('name, rarity, is_active')
    .eq('is_active', true)
    .limit(1000)

  if (error) {
    fail('Active pool query', error.message)
    return
  }

  const rows = data || []
  const byRarity = {}
  for (const row of rows) increment(byRarity, row.rarity || 'unknown')

  const total = rows.length
  if (total === expectedTotal()) {
    pass('Active pool total', `${total}/${expectedTotal()}`)
  } else {
    fail('Active pool total', `${total}/${expectedTotal()} (${formatCounts(byRarity)})`)
  }

  for (const [rarity, expected] of Object.entries(EXPECTED_V2_RARITY_COUNTS)) {
    const actual = byRarity[rarity] || 0
    if (actual === expected) {
      pass(`Rarity count ${rarity}`, String(actual))
    } else {
      fail(`Rarity count ${rarity}`, `${actual}/${expected}`)
    }
  }

  const expectedNames = [
    '月見クッション',
    '表紙の取れた本',
    '光の雫ペンダント',
    '名前のないコイン',
    '誰かのリング',
    '無音の鈴',
    '木の小箱',
    '朝の湯のみ',
    '古いマッチ箱',
    '空色のリボン',
    '細紐のブレスレット',
    '月夜の鏡',
    '名のない地図',
    '古いカメラ',
    '鏡うつしの本',
    '月光のティーポット',
    'ふたりの傘',
  ]
  const existingNames = new Set(rows.map(row => row.name))
  const missingNames = expectedNames.filter(name => !existingNames.has(name))
  if (missingNames.length === 0) {
    pass('Moonbox v2 item names', `${expectedNames.length}/${expectedNames.length}`)
  } else {
    fail('Moonbox v2 item names missing', missingNames.join(', '))
  }
}

async function checkPityState(supabase, userId) {
  const { data, error } = await supabase
    .from('lunaria_gacha_pity_state')
    .select('draws_since_urban_legend, lifetime_draws, last_urban_legend_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    fail('Pity state table', error.message)
    return
  }

  if (!data) {
    warn('Pity state row missing', `no row for ${userId}; this is OK before first draw if no prior gacha rows exist`)
    return
  }

  pass(
    'Pity state row',
    `progress=${data.draws_since_urban_legend}/${EXPECTED_PITY_THRESHOLD} lifetime=${data.lifetime_draws}`,
  )
}

async function checkHistoryPityColumns(supabase) {
  const { error } = await supabase
    .from('lunaria_gacha_history')
    .select('pity_before, pity_after, pity_triggered')
    .limit(1)

  if (error) {
    fail('History pity audit columns', error.message)
  } else {
    pass('History pity audit columns', 'pity_before, pity_after, pity_triggered')
  }
}

async function checkApi(baseUrl) {
  if (!baseUrl) {
    warn('HTTP verification skipped', 'set LUNARIA_BASE_URL or pass a base URL argument')
    return
  }

  const normalized = baseUrl.replace(/\/$/, '')
  const stateUrl = `${normalized}/api/gacha/state`
  const poolUrl = `${normalized}/api/gacha/pool`

  try {
    const stateResponse = await fetch(stateUrl, { cache: 'no-store' })
    const state = await stateResponse.json()
    if (!stateResponse.ok) {
      fail('/api/gacha/state', `HTTP ${stateResponse.status}`)
    } else if (!('pity' in state)) {
      fail('/api/gacha/state pity field', 'missing pity field')
    } else {
      pass('/api/gacha/state pity field', state.pity ? `${state.pity.draws_since_urban_legend}/${EXPECTED_PITY_THRESHOLD}` : 'null')
    }

    const poolResponse = await fetch(poolUrl, { cache: 'no-store' })
    const pool = await poolResponse.json()
    const items = Array.isArray(pool?.items) ? pool.items : []
    if (!poolResponse.ok) {
      fail('/api/gacha/pool', `HTTP ${poolResponse.status}`)
    } else if (items.length === expectedTotal()) {
      pass('/api/gacha/pool total', `${items.length}/${expectedTotal()}`)
    } else {
      fail('/api/gacha/pool total', `${items.length}/${expectedTotal()}`)
    }
  } catch (error) {
    fail('HTTP verification failed', error.message)
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

  console.log('Lunaria gacha migration verification')
  console.log(`User: ${userId}`)
  if (baseUrl) console.log(`Base URL: ${baseUrl}`)
  console.log('')

  await checkPoolShape(supabase)
  await checkPityState(supabase, userId)
  await checkHistoryPityColumns(supabase)
  await checkApi(baseUrl)

  if (process.exitCode) {
    console.error('\nLunaria gacha migration verification failed.')
    process.exit(process.exitCode)
  }
  console.log('\nLunaria gacha migration verification passed.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
