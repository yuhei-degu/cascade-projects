import { NextResponse } from 'next/server'
import { getCharacterStateOverview } from '../../../../lib/lunaria/character-items'
import { getAuthenticatedUserId } from '../../_auth'

export async function GET() {
  try {
    const auth = await getAuthenticatedUserId()
    if ('response' in auth) return auth.response

    const state = await getCharacterStateOverview(auth.userId)
    return NextResponse.json(state)
  } catch (error) {
    console.error('[character/state]', error)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
