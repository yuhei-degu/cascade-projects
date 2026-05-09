import { NextResponse } from 'next/server'
import { getCharacterStateOverview } from '../../../../lib/lunaria/character-items'

export async function GET() {
  try {
    const state = await getCharacterStateOverview()
    return NextResponse.json(state)
  } catch (error) {
    console.error('[character/state]', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
