import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'

const PROTECTED_PATHS = [
    '/session', 
    // '/analysis'
]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createSupabaseMiddlewareClient(request, response)

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PATHS.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/session/:path*', 
    // '/analysis/:path*'
],
}