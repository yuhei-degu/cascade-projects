#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
const EXPECTED_GACHA_TABLES = [
  'lunaria_gacha_coins',
  'lunaria_gacha_daily_bonus',
  'lunaria_gacha_daily_quota',
  'lunaria_gacha_history',
  'lunaria_gacha_inventory',
  'lunaria_gacha_pool',
  'lunaria_gacha_tickets',
]

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

async function checkHealthEndpoint(baseUrl) {
  if (!baseUrl) {
    warn('Health endpoint skipped', 'set LUNARIA_BASE_URL or pass a URL argument')
    return
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/health`
  try {
    const response = await fetch(url, { cache: 'no-store' })
    const text = await response.text()
    let body
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }

    if (!response.ok) {
      fail('Health endpoint returned non-OK status', `${response.status} ${url}`)
      if (text) console.error(text.slice(0, 500))
      return
    }

    if (body?.status === 'ok') {
      pass('Health endpoint status', `${body.status} (${url})`)
    } else {
      fail('Health endpoint status is not ok', `${body?.status ?? 'unknown'} (${url})`)
    }
  } catch (error) {
    fail('Health endpoint request failed', error.message)
  }
}

async function checkSupabase() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
  ]
  const missing = required.filter(key => !process.env[key]?.trim())
  if (missing.length > 0) {
    fail('Required env vars are missing', missing.join(', '))
    return
  }
  pass('Required env vars are present', required.join(', '))

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  )

  const { data: user, error: userError } = await supabase
    .from('lunaria_users')
    .select('id')
    .eq('id', DEFAULT_USER_ID)
    .maybeSingle()

  if (userError) {
    fail('Default user query failed', userError.message)
  } else if (!user) {
    fail('Default user is missing', DEFAULT_USER_ID)
  } else {
    pass('Default user exists', user.id)
  }

  let readableTables = 0
  for (const table of EXPECTED_GACHA_TABLES) {
    const { error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      fail(`Gacha table is not readable: ${table}`, error.message)
    } else {
      readableTables += 1
    }
  }
  if (readableTables === EXPECTED_GACHA_TABLES.length) {
    pass('Gacha tables readable', `${readableTables}/${EXPECTED_GACHA_TABLES.length}`)
  }

  const { data: poolRows, error: poolError } = await supabase
    .from('lunaria_gacha_pool')
    .select('rarity')
    .eq('is_active', true)
    .limit(500)

  if (poolError) {
    fail('Active gacha pool query failed', poolError.message)
  } else {
    const byRarity = {}
    for (const row of poolRows ?? []) {
      const rarity = row.rarity ?? 'unknown'
      byRarity[rarity] = (byRarity[rarity] ?? 0) + 1
    }

    const total = poolRows?.length ?? 0
    if (total >= 25) {
      pass('Active gacha pool size', `${total} items ${JSON.stringify(byRarity)}`)
    } else {
      fail('Active gacha pool is too small', `${total} items ${JSON.stringify(byRarity)}`)
    }
  }

  warn(
    'RPC privilege check skipped',
    'verify draw_gacha/grant_gacha_ticket grants in Supabase SQL Editor; this script stays read-only',
  )
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'))

  const baseUrl = process.argv[2] || process.env.LUNARIA_BASE_URL
  await checkSupabase()
  await checkHealthEndpoint(baseUrl)

  if (process.exitCode) {
    console.error('\nLunaria production self-check failed.')
    process.exit(process.exitCode)
  }
  console.log('\nLunaria production self-check passed.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
