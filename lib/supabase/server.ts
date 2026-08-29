import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient(accessToken?: string) {
  const store = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
      cookies: {
        getAll() {
          return store.getAll()
        },
        setAll(cs) {
          try {
            cs.forEach(({ name, value, options }) => store.set(name, value, options))
          } catch {
            // Server Components cannot always mutate cookies.
          }
        },
      },
    },
  )
}
