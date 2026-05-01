import { NextResponse } from 'next/server'
import { getInventory } from '../../../../lib/lunaria/gacha'

export async function GET() {
  try {
    const items = await getInventory()
    return NextResponse.json({ items })
  } catch (e: unknown) {
    console.error('[gacha/inventory]', e)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
