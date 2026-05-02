import { createClient } from '@supabase/supabase-js'

const USER_ID = '00000000-0000-0000-0000-000000000001'

type Check =
  | { ok: true; latency_ms?: number; [key: string]: unknown }
  | { ok: false; error: string; latency_ms?: number; [key: string]: unknown }

interface HealthReport {
  status: 'ok' | 'degraded'
  timestamp: string
  checks: {
    env: Check
    supabase: Check
    default_user: Check
    gacha_pool: Check
    gemini: Check
  }
}

function elapsedMs(start: number): number {
  return Math.max(0, Date.now() - start)
}

function configured(name: string): boolean {
  return Boolean(process.env[name]?.trim())
}

function envCheck(): Check {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
  ]
  const missing = required.filter(name => !configured(name))
  return missing.length === 0
    ? { ok: true, configured: required }
    : { ok: false, error: 'missing_env', missing }
}

function geminiCheck(): Check {
  return configured('GEMINI_API_KEY')
    ? { ok: true, configured: true }
    : { ok: false, error: 'missing_env', configured: false }
}

function byRarity(rows: Array<{ rarity: string | null }>): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const rarity = row.rarity ?? 'unknown'
    acc[rarity] = (acc[rarity] ?? 0) + 1
    return acc
  }, {})
}

export async function getHealthReport(): Promise<HealthReport> {
  const checks: HealthReport['checks'] = {
    env: envCheck(),
    supabase: { ok: false, error: 'not_checked' },
    default_user: { ok: false, error: 'not_checked' },
    gacha_pool: { ok: false, error: 'not_checked' },
    gemini: geminiCheck(),
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    return {
      status: 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    }
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const supabaseStart = Date.now()
  try {
    const { error } = await supabase
      .from('lunaria_users')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    checks.supabase = error
      ? { ok: false, error: error.message, latency_ms: elapsedMs(supabaseStart) }
      : { ok: true, latency_ms: elapsedMs(supabaseStart) }
  } catch (error) {
    checks.supabase = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown_error',
      latency_ms: elapsedMs(supabaseStart),
    }
  }

  const userStart = Date.now()
  try {
    const { data, error } = await supabase
      .from('lunaria_users')
      .select('id')
      .eq('id', USER_ID)
      .maybeSingle()

    if (error) {
      checks.default_user = { ok: false, error: error.message, latency_ms: elapsedMs(userStart) }
    } else if (data) {
      checks.default_user = { ok: true, id: USER_ID, latency_ms: elapsedMs(userStart) }
    } else {
      checks.default_user = { ok: false, error: 'missing_default_user', id: USER_ID, latency_ms: elapsedMs(userStart) }
    }
  } catch (error) {
    checks.default_user = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown_error',
      latency_ms: elapsedMs(userStart),
    }
  }

  const poolStart = Date.now()
  try {
    const { data, error } = await supabase
      .from('lunaria_gacha_pool')
      .select('rarity')
      .eq('is_active', true)
      .limit(500)

    if (error) {
      checks.gacha_pool = { ok: false, error: error.message, latency_ms: elapsedMs(poolStart) }
    } else {
      const total = data?.length ?? 0
      checks.gacha_pool = total >= 25
        ? {
            ok: true,
            total,
            by_rarity: byRarity(data ?? []),
            latency_ms: elapsedMs(poolStart),
          }
        : {
            ok: false,
            error: 'gacha_pool_too_small',
            total,
            by_rarity: byRarity(data ?? []),
            latency_ms: elapsedMs(poolStart),
          }
    }
  } catch (error) {
    checks.gacha_pool = {
      ok: false,
      error: error instanceof Error ? error.message : 'unknown_error',
      latency_ms: elapsedMs(poolStart),
    }
  }

  const status = Object.values(checks).every(check => check.ok) ? 'ok' : 'degraded'
  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
  }
}
