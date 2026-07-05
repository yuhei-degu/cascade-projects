import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackEvent } from '@/lib/track'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      void trackEvent(supabase, data.user.id, 'login')
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
