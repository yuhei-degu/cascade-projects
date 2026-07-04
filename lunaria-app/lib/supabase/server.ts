import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieOptions = Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2]
type CookieToSet = {
  name: string
  value: string
  options?: CookieOptions
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Components cannot set cookies. Middleware and Route
            // Handlers handle session refresh writes.
          }
        },
      },
    },
  )
}
