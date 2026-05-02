#!/usr/bin/env node

const DEFAULT_BASE_URL = 'http://localhost:3000'

function normalizeBaseUrl(value) {
  return (value || DEFAULT_BASE_URL).replace(/\/$/, '')
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

async function fetchText(url, options) {
  const response = await fetch(url, { cache: 'no-store', ...options })
  const text = await response.text()
  return { response, text }
}

async function fetchJson(url, options) {
  const { response, text } = await fetchText(url, options)
  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    // Keep null; caller will produce a targeted failure.
  }
  return { response, body, text }
}

async function checkPage(baseUrl, path) {
  const url = `${baseUrl}${path}`
  try {
    const { response, text } = await fetchText(url)
    if (!response.ok) {
      fail(`Page ${path}`, `HTTP ${response.status}`)
      return
    }
    if (!text.includes('<html')) {
      fail(`Page ${path}`, 'response does not look like HTML')
      return
    }
    pass(`Page ${path}`, `HTTP ${response.status}`)
  } catch (error) {
    fail(`Page ${path}`, error.message)
  }
}

async function checkHealth(baseUrl) {
  const url = `${baseUrl}/api/health`
  try {
    const { response, body, text } = await fetchJson(url)
    if (!response.ok) {
      fail('/api/health', `HTTP ${response.status} ${text.slice(0, 160)}`)
      return
    }
    if (body?.status !== 'ok') {
      fail('/api/health', `status=${body?.status || 'unknown'}`)
      return
    }
    pass('/api/health', 'status=ok')
  } catch (error) {
    fail('/api/health', error.message)
  }
}

async function checkGachaState(baseUrl) {
  const url = `${baseUrl}/api/gacha/state`
  try {
    const { response, body, text } = await fetchJson(url)
    if (!response.ok) {
      fail('/api/gacha/state', `HTTP ${response.status} ${text.slice(0, 160)}`)
      return
    }
    const required = ['ticket_count', 'coin_balance', 'earned_today', 'daily_bonus_available']
    const missing = required.filter(key => !(key in (body || {})))
    if (missing.length) {
      fail('/api/gacha/state', `missing ${missing.join(', ')}`)
      return
    }
    pass('/api/gacha/state', `tickets=${body.ticket_count} coins=${body.coin_balance}`)
  } catch (error) {
    fail('/api/gacha/state', error.message)
  }
}

async function checkGachaPool(baseUrl) {
  const url = `${baseUrl}/api/gacha/pool`
  try {
    const { response, body, text } = await fetchJson(url)
    if (!response.ok) {
      fail('/api/gacha/pool', `HTTP ${response.status} ${text.slice(0, 160)}`)
      return
    }
    const items = Array.isArray(body?.items) ? body.items : []
    if (items.length < 25) {
      fail('/api/gacha/pool', `too few items: ${items.length}`)
      return
    }
    pass('/api/gacha/pool', `${items.length} items`)
  } catch (error) {
    fail('/api/gacha/pool', error.message)
  }
}

async function checkInventory(baseUrl) {
  const url = `${baseUrl}/api/gacha/inventory`
  try {
    const { response, body, text } = await fetchJson(url)
    if (!response.ok) {
      fail('/api/gacha/inventory', `HTTP ${response.status} ${text.slice(0, 160)}`)
      return
    }
    if (!Array.isArray(body?.items)) {
      fail('/api/gacha/inventory', 'items is not an array')
      return
    }
    pass('/api/gacha/inventory', `${body.items.length} items`)
  } catch (error) {
    fail('/api/gacha/inventory', error.message)
  }
}

async function checkAdminStats(baseUrl) {
  const url = `${baseUrl}/api/admin/pool-stats`
  const token = process.env.LUNARIA_ADMIN_STATUS_TOKEN?.trim()
  const headers = token ? { authorization: `Bearer ${token}` } : {}
  try {
    const { response, body, text } = await fetchJson(url, { headers })
    if (response.status === 401) {
      warn('/api/admin/pool-stats', 'unauthorized; set LUNARIA_ADMIN_STATUS_TOKEN to verify production admin stats')
      return
    }
    if (!response.ok) {
      fail('/api/admin/pool-stats', `HTTP ${response.status} ${text.slice(0, 160)}`)
      return
    }
    if ((body?.pool?.active || 0) < 25) {
      fail('/api/admin/pool-stats', `active pool too small: ${body?.pool?.active || 0}`)
      return
    }
    pass('/api/admin/pool-stats', `${body.pool.active} active items`)
  } catch (error) {
    fail('/api/admin/pool-stats', error.message)
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(process.argv[2] || process.env.LUNARIA_BASE_URL)
  console.log(`Lunaria gacha smoke test: ${baseUrl}`)
  console.log('')

  await checkPage(baseUrl, '/')
  await checkPage(baseUrl, '/gacha')
  await checkPage(baseUrl, '/gacha/inventory')
  await checkPage(baseUrl, '/admin/gacha')
  await checkHealth(baseUrl)
  await checkGachaState(baseUrl)
  await checkGachaPool(baseUrl)
  await checkInventory(baseUrl)
  await checkAdminStats(baseUrl)

  if (process.exitCode) {
    console.error('\nLunaria gacha smoke test failed.')
    process.exit(process.exitCode)
  }
  console.log('\nLunaria gacha smoke test passed.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
