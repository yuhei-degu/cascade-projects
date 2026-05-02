import { NextRequest, NextResponse } from 'next/server'
import { getGachaPoolStats } from '@/lib/lunaria/gacha-stats'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.LUNARIA_ADMIN_STATUS_TOKEN?.trim()
  if (!expected) return process.env.NODE_ENV !== 'production'

  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
  return token === expected
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const stats = await getGachaPoolStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('[admin/pool-stats]', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
