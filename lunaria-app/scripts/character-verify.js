#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001'

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

async function checkSelectableColumns(supabase, table, columns, label) {
  const { error } = await supabase
    .from(table)
    .select(columns.join(', '))
    .limit(1)

  if (error) fail(label, error.message)
  else pass(label, columns.join(', '))
}

async function checkCount(supabase, table, label) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })

  if (error) fail(label, error.message)
  else pass(label, String(count ?? 0))
}

async function checkDefaultCharacterState(supabase, userId) {
  const { data, error } = await supabase
    .from('lunaria_character_states')
    .select('user_id, character_profile_id, current_expression, current_motion, affinity_level')
    .eq('user_id', userId)
    .eq('character_profile_id', 'lunaria')
    .maybeSingle()

  if (error) {
    fail('Default character state row', error.message)
    return
  }
  if (!data) {
    fail('Default character state row', `missing for ${userId}`)
    return
  }
  pass('Default character state row', `${data.current_expression}/${data.current_motion}/affinity=${data.affinity_level}`)
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'))
  const userId = process.env.LUNARIA_VERIFY_USER_ID || DEFAULT_USER_ID
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )

  console.log('Lunaria character/items verification')
  console.log(`User: ${userId}`)
  console.log('')

  await checkSelectableColumns(
    supabase,
    'lunaria_user_items',
    ['id', 'user_id', 'pool_id', 'obtained_from', 'duplicate_count', 'last_obtained_at', 'deleted_at'],
    'User items columns',
  )
  await checkSelectableColumns(
    supabase,
    'lunaria_character_states',
    ['id', 'user_id', 'character_profile_id', 'current_expression', 'current_motion', 'affinity_level', 'deleted_at'],
    'Character states columns',
  )
  await checkCount(supabase, 'lunaria_user_items', 'User items row count')
  await checkCount(supabase, 'lunaria_character_states', 'Character states row count')
  await checkDefaultCharacterState(supabase, userId)

  if (process.exitCode) {
    console.error('\nLunaria character/items verification failed.')
    process.exit(process.exitCode)
  }

  console.log('\nLunaria character/items verification passed.')
}

main().catch(error => {
  fail('Unexpected verification error', error.message)
  process.exit(process.exitCode || 1)
})
