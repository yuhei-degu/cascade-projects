#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
]

const OPTIONAL = [
  'LUNARIA_ADMIN_STATUS_TOKEN',
  'LUNARIA_BASE_URL',
  'ANTHROPIC_API_KEY',
]

const SECRET_NAMES = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY',
  'ANTHROPIC_API_KEY',
  'LUNARIA_ADMIN_STATUS_TOKEN',
]

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return null

  const values = {}
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
    values[key] = value
  }
  return values
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

function main() {
  const envPath = path.join(process.cwd(), '.env.local')
  const values = parseEnv(envPath)

  if (!values) {
    fail('.env.local not found', envPath)
    console.log('Create it from .env.example and fill the values.')
    process.exit(process.exitCode)
  }

  for (const key of REQUIRED) {
    const value = values[key]
    if (!value) {
      fail(`Missing required env var ${key}`)
    } else {
      pass(`Required env var ${key}`, '<set>')
    }
  }

  for (const key of OPTIONAL) {
    const value = values[key]
    if (!value) {
      warn(`Optional env var ${key} is not set`)
    } else {
      pass(`Optional env var ${key}`, SECRET_NAMES.includes(key) ? '<set>' : value)
    }
  }

  const publicSecrets = SECRET_NAMES.filter(key => key.startsWith('NEXT_PUBLIC_'))
  if (publicSecrets.length) {
    fail('Secret env vars must not be NEXT_PUBLIC_*', publicSecrets.join(', '))
  }

  for (const key of Object.keys(values)) {
    if (key.startsWith('NEXT_PUBLIC_') && /SECRET|SERVICE|PRIVATE|TOKEN|KEY/i.test(key) && key !== 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      warn(`Review public-looking secret ${key}`, 'NEXT_PUBLIC_* values are bundled into browser code')
    }
  }

  if (process.exitCode) {
    console.error('\nLunaria env check failed.')
    process.exit(process.exitCode)
  }

  console.log('\nLunaria env check passed.')
}

main()
