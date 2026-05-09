import { NextResponse } from 'next/server'
import { getItemsOverview } from '../../../lib/lunaria/character-items'

export async function GET() {
  try {
    const overview = await getItemsOverview()
    return NextResponse.json(overview)
  } catch (error) {
    console.error('[items]', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
