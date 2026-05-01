import { NextResponse } from 'next/server'
import { fetchPool } from '../../../../lib/lunaria/gacha'

export async function GET() {
  try {
    const items = await fetchPool()
    return NextResponse.json({ items })
  } catch (e: any) {
    console.error('[gacha/pool]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
