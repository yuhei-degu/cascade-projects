#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const DEFAULT_BASE_URL = 'http://localhost:3000'
const SMOKE_EMAIL = 'smoke-test@lunaria.local'

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

function normalizeBaseUrl(value) {
  return (value || DEFAULT_BASE_URL).replace(/\/$/, '')
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function supabaseStorageKey(supabaseUrl) {
  return `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
}

function createCookieHeader(supabaseUrl, session) {
  const key = supabaseStorageKey(supabaseUrl)
  return `${key}=${encodeURIComponent(JSON.stringify(session))}`
}

function jstDateString(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function makePassword() {
  return `Smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function bodyPreview(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 700)
}

async function readResponseBody(response) {
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // Keep text for diagnostics.
  }
  return { text, json }
}

async function fetchApi(baseUrl, authHeaders, check) {
  const headers = {
    ...authHeaders,
    ...(check.json ? { 'content-type': 'application/json' } : {}),
    ...(check.headers || {}),
  }
  const response = await fetch(`${baseUrl}${check.path}`, {
    method: check.method || 'GET',
    headers,
    body: check.json ? JSON.stringify(check.json) : undefined,
    cache: 'no-store',
  })
  const body = await readResponseBody(response)
  return { check, response, body }
}

function printFailure(result) {
  const { check, response, body } = result
  console.error(`FAIL ${check.name} ${check.method || 'GET'} ${check.path}`)
  console.error(`  HTTP ${response.status} ${response.statusText}`)
  console.error(`  Response: ${bodyPreview(body.text) || '(empty)'}`)
}

async function cleanupExistingSmokeUsers(admin) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error

  const users = (data?.users || []).filter(user => user.email === SMOKE_EMAIL)
  for (const user of users) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
    if (deleteError) throw deleteError
  }
}

async function createSmokeSession(admin, anon, supabaseUrl) {
  await cleanupExistingSmokeUsers(admin)

  const password = makePassword()
  let createdUserId = null
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: SMOKE_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { purpose: 'lunaria-smoke-test' },
  })
  if (createError) throw createError
  if (!created?.user?.id) throw new Error('Smoke user creation did not return a user id')
  createdUserId = created.user.id

  try {
    const { data: signedIn, error: signInError } = await anon.auth.signInWithPassword({
      email: SMOKE_EMAIL,
      password,
    })
    if (signInError) throw signInError
    if (!signedIn?.session?.access_token) throw new Error('Smoke sign-in did not return an access token')

    return {
      userId: createdUserId,
      accessToken: signedIn.session.access_token,
      cookieHeader: createCookieHeader(supabaseUrl, signedIn.session),
    }
  } catch (error) {
    try {
      await deleteSmokeUser(admin, createdUserId)
    } catch (deleteError) {
      console.error(`WARN failed to delete smoke user after sign-in failure: ${deleteError.message}`)
    }
    throw error
  }
}

async function deleteSmokeUser(admin, userId) {
  if (!userId) return
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) throw error
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env.local'))

  const baseUrl = normalizeBaseUrl(process.argv[2] || process.env.LUNARIA_BASE_URL)
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anon = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let userId = null
  let cleanupError = null
  const failures = []

  try {
    const session = await createSmokeSession(admin, anon, supabaseUrl)
    userId = session.userId

    const authHeaders = {
      authorization: `Bearer ${session.accessToken}`,
      cookie: session.cookieHeader,
    }
    const today = jstDateString()
    const month = today.slice(0, 7)

    const checks = [
      { name: 'health', path: '/api/health' },
      {
        name: 'conversation send',
        path: '/api/chat',
        method: 'POST',
        json: {
          message: 'Good morning, this is a smoke test.',
          history: [],
          prevScores: [],
          coverage: {},
        },
      },
      { name: 'messages list', path: `/api/messages?date=${encodeURIComponent(today)}` },
      { name: 'gacha state before draw', path: '/api/gacha/state' },
      { name: 'gacha daily bonus', path: '/api/gacha/daily', method: 'POST' },
      { name: 'gacha execution', path: '/api/gacha/draw', method: 'POST' },
      { name: 'gacha inventory', path: '/api/gacha/inventory' },
      { name: 'diary get', path: `/api/diary?date=${encodeURIComponent(today)}&meta=1` },
      { name: 'diary month', path: `/api/diary/month?month=${encodeURIComponent(month)}` },
      { name: 'memory list', path: '/api/memory?limit=20' },
      { name: 'items overview', path: '/api/items' },
      { name: 'character state', path: '/api/character/state' },
    ]

    for (const check of checks) {
      const result = await fetchApi(baseUrl, authHeaders, check)
      if (!result.response.ok) {
        failures.push(result)
        printFailure(result)
      } else {
        console.log(`PASS ${check.name} ${result.response.status}`)
      }
    }
  } finally {
    try {
      await deleteSmokeUser(admin, userId)
    } catch (error) {
      cleanupError = error
    }
  }

  if (cleanupError) {
    console.error(`FAIL cleanup delete smoke user: ${cleanupError.message}`)
    process.exit(1)
  }

  if (failures.length > 0) {
    console.error(`SMOKE FAILED (${failures.length} failed)`)
    process.exit(1)
  }

  console.log('SMOKE OK')
}

main().catch(error => {
  console.error('SMOKE FAILED')
  console.error(error?.stack || error?.message || String(error))
  process.exit(1)
})
