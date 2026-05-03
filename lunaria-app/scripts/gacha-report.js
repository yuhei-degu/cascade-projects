#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'
const PITY_THRESHOLD = 200

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

function parseArgs(argv) {
  const args = {
    userId: DEFAULT_USER_ID,
    limit: 1000,
    json: false,
  }

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--json') {
      args.json = true
    } else if (arg === '--user-id') {
      args.userId = argv[index + 1] || args.userId
      index += 1
    } else if (arg === '--limit') {
      args.limit = Number(argv[index + 1] || args.limit)
      index += 1
    } else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    }
  }

  if (!Number.isFinite(args.limit) || args.limit < 1) args.limit = 1000
  args.limit = Math.min(Math.floor(args.limit), 5000)
  return args
}

function printHelp() {
  console.log(`Lunaria gacha report

Usage:
  npm run gacha:report
  npm run gacha:report -- --json
  npm run gacha:report -- --user-id <uuid> --limit 500

Reads .env.local and reports gacha pool, inventory, and recent draw history.
This script is read-only and does not call draw or ticket RPCs.`)
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function increment(map, key) {
  const safeKey = key || 'unknown'
  map[safeKey] = (map[safeKey] || 0) + 1
}

function percentage(part, total) {
  if (!total) return '0.0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function formatCountMap(map) {
  const entries = Object.entries(map)
  if (entries.length === 0) return 'none'
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(', ')
}

async function fetchReport({ userId, limit }) {
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )

  const [stateResult, poolResult, inventoryResult, historyResult, pityResult] = await Promise.all([
    Promise.all([
      supabase.from('lunaria_gacha_tickets').select('count').eq('user_id', userId).maybeSingle(),
      supabase.from('lunaria_gacha_coins').select('balance').eq('user_id', userId).maybeSingle(),
    ]),
    supabase
      .from('lunaria_gacha_pool')
      .select('id, name, rarity, category, is_active')
      .limit(1000),
    supabase
      .from('lunaria_gacha_inventory')
      .select('acquired_at, pool:lunaria_gacha_pool(name, rarity, category)')
      .eq('user_id', userId)
      .order('acquired_at', { ascending: false })
      .limit(5000),
    supabase
      .from('lunaria_gacha_history')
      .select(`
        pulled_at,
        rarity,
        was_duplicate,
        coin_earned,
        pool:lunaria_gacha_pool(name, category)
      `)
      .eq('user_id', userId)
      .order('pulled_at', { ascending: false })
      .limit(limit),
    supabase
      .from('lunaria_gacha_pity_state')
      .select('draws_since_urban_legend, lifetime_draws, last_urban_legend_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  const [ticketsResult, coinsResult] = stateResult
  for (const result of [ticketsResult, coinsResult, poolResult, inventoryResult, historyResult]) {
    if (result.error) throw result.error
  }

  const poolRows = poolResult.data || []
  const inventoryRows = inventoryResult.data || []
  const historyRows = historyResult.data || []

  const poolByRarity = {}
  const poolByCategory = {}
  const inventoryByRarity = {}
  const historyByRarity = {}
  const duplicateByRarity = {}

  let activePoolCount = 0
  for (const row of poolRows) {
    if (!row.is_active) continue
    activePoolCount += 1
    increment(poolByRarity, row.rarity)
    increment(poolByCategory, row.category)
  }

  for (const row of inventoryRows) {
    const pool = Array.isArray(row.pool) ? row.pool[0] : row.pool
    increment(inventoryByRarity, pool?.rarity)
  }

  let duplicateDraws = 0
  let coinEarnedTotal = 0
  for (const row of historyRows) {
    increment(historyByRarity, row.rarity)
    if (row.was_duplicate) {
      duplicateDraws += 1
      increment(duplicateByRarity, row.rarity)
    }
    coinEarnedTotal += Number(row.coin_earned || 0)
  }

  return {
    timestamp: new Date().toISOString(),
    user_id: userId,
    state: {
      ticket_count: ticketsResult.data?.count || 0,
      coin_balance: coinsResult.data?.balance || 0,
    },
    pity: pityResult.error
      ? { available: false, reason: pityResult.error.message || 'not available' }
      : {
          available: true,
          draws_since_urban_legend: pityResult.data?.draws_since_urban_legend ?? 0,
          threshold: PITY_THRESHOLD,
          lifetime_draws: pityResult.data?.lifetime_draws ?? 0,
          last_urban_legend_at: pityResult.data?.last_urban_legend_at ?? null,
          updated_at: pityResult.data?.updated_at ?? null,
        },
    pool: {
      total: poolRows.length,
      active: activePoolCount,
      inactive: poolRows.length - activePoolCount,
      by_rarity: poolByRarity,
      by_category: poolByCategory,
    },
    inventory: {
      unique_items: inventoryRows.length,
      completion_rate: percentage(inventoryRows.length, activePoolCount),
      by_rarity: inventoryByRarity,
      newest: inventoryRows.slice(0, 10).map(row => {
        const pool = Array.isArray(row.pool) ? row.pool[0] : row.pool
        return {
          acquired_at: row.acquired_at,
          name: pool?.name || 'unknown',
          rarity: pool?.rarity || 'unknown',
          category: pool?.category || 'unknown',
        }
      }),
    },
    history: {
      sampled_draws: historyRows.length,
      duplicate_draws: duplicateDraws,
      duplicate_rate: percentage(duplicateDraws, historyRows.length),
      coin_earned_total: coinEarnedTotal,
      by_rarity: historyByRarity,
      duplicate_by_rarity: duplicateByRarity,
      recent: historyRows.slice(0, 20).map(row => {
        const pool = Array.isArray(row.pool) ? row.pool[0] : row.pool
        return {
          pulled_at: row.pulled_at,
          name: pool?.name || 'unknown',
          rarity: row.rarity || 'unknown',
          category: pool?.category || 'unknown',
          was_duplicate: Boolean(row.was_duplicate),
          coin_earned: Number(row.coin_earned || 0),
        }
      }),
    },
  }
}

function printReport(report) {
  console.log(`Lunaria Gacha Report (${report.timestamp})`)
  console.log(`User: ${report.user_id}`)
  console.log('')
  console.log('State')
  console.log(`  Tickets: ${report.state.ticket_count}`)
  console.log(`  Coins:   ${report.state.coin_balance}`)
  console.log('')
  console.log('Pool')
  console.log(`  Active:   ${report.pool.active}/${report.pool.total}`)
  console.log(`  Rarity:   ${formatCountMap(report.pool.by_rarity)}`)
  console.log(`  Category: ${formatCountMap(report.pool.by_category)}`)
  console.log('')
  console.log('Inventory')
  console.log(`  Unique:   ${report.inventory.unique_items}/${report.pool.active} (${report.inventory.completion_rate})`)
  console.log(`  Rarity:   ${formatCountMap(report.inventory.by_rarity)}`)
  console.log('')
  console.log('History')
  console.log(`  Draws sampled: ${report.history.sampled_draws}`)
  console.log(`  Duplicates:    ${report.history.duplicate_draws} (${report.history.duplicate_rate})`)
  console.log(`  Coins earned:  ${report.history.coin_earned_total}`)
  console.log(`  Rarity:        ${formatCountMap(report.history.by_rarity)}`)
  console.log('')
  console.log('Moon fullness')
  if (report.pity.available) {
    console.log(`  Progress: ${report.pity.draws_since_urban_legend}/${report.pity.threshold}`)
    console.log(`  Lifetime: ${report.pity.lifetime_draws}`)
    console.log(`  Last urban_legend: ${report.pity.last_urban_legend_at || 'none'}`)
  } else {
    console.log(`  Not available: ${report.pity.reason}`)
  }
  console.log('')
  console.log('Recent draws')
  for (const row of report.history.recent.slice(0, 10)) {
    const duplicate = row.was_duplicate ? ` duplicate +${row.coin_earned} coins` : ' new'
    console.log(`  ${row.pulled_at} | ${row.rarity} | ${row.name} |${duplicate}`)
  }
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'))
  const args = parseArgs(process.argv)
  const report = await fetchReport(args)

  if (args.json) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printReport(report)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
