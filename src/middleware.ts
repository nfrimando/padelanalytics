import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'

const PROTECTED_PATHS = ['/session']

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createSupabaseMiddlewareClient(request, response)

  // getUser() also silently refreshes the session token if it's near expiry
  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PATHS.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth_required', 'true')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/session/:path*', '/analysis/:path*'],
}