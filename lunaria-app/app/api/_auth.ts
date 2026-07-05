import { NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'

export async function getAuthenticatedUserId(): Promise<
  { userId: string } | { response: NextResponse }
> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return { response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }

  return { userId: data.user.id }
}
