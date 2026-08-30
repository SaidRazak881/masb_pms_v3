import { updateSession } from '@/lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes remain authenticated but must never receive a browser /login redirect.
  // Their route handlers own the JSON 401/403 response semantics (import, reports, settings).
  if (pathname.startsWith('/api/')) {
    return updateSession(request, { redirectUnauthenticated: false })
  }

  // Preserve existing browser-page authentication behavior.
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
}
