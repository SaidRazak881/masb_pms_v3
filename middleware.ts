import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API import routes must never receive the browser /login redirect.
  // Their route handlers own authentication/authorization and return JSON 401/403.
  if (pathname.startsWith('/api/import/')) {
    return updateSession(request, { skipRedirect: true })
  }

  // Preserve existing browser-page authentication behavior.
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
}
