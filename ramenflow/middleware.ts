// middleware.ts
// RamenFlow 認証ミドルウェア
// /staff/* → staff 以上 → なければ /staff/login へリダイレクト
// /admin/* → owner のみ   → なければ /staff/login へリダイレクト

import { createServerClient } from '@supabase/ssr'
import type { SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // レスポンスオブジェクトを作成（cookie更新のため）
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Supabase クライアントを作成（ミドルウェア専用）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // セッションを取得（これにより cookie が自動更新される）
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ログインしていない場合 → /staff/login へ
  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/staff/login'
    // リダイレクト元を保持して戻れるようにする
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ロールを取得
  const { data: profile } = await supabase
    .from('staff_profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  // プロフィールが存在しない or 無効なアカウント → ログインへ
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/staff/login'
    return NextResponse.redirect(loginUrl)
  }

  // /admin/* は owner のみ
  if (pathname.startsWith('/admin') && profile.role !== 'owner') {
    // staff は /staff/orders にリダイレクト
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/staff/orders'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/staff/((?!login).*)',
    '/admin/:path*',
  ],
}
