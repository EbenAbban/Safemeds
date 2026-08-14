import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { dashboardPathForRole, isPublicRoute } from '@/lib/routes'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // A signed-in visitor landing on "/" is sent to their dashboard here, before
  // anything renders.
  //
  // This used to happen on the client: the page rendered a full-screen
  // "Loading SafeMeds…" spinner while the session resolved, then a second
  // full-screen "Welcome back… redirecting" panel, and only then navigated.
  // Two blocking interstitials before any real content, on the very first
  // thing anyone sees when they open the site. A redirect issued here costs
  // no render at all.
  if (pathname === '/') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      // Vercel serves over HTTPS, so the cookie carries the __Secure- prefix
      // there and not in local development. Getting this wrong means the token
      // is never found and the redirect silently stops happening.
      secureCookie: request.nextUrl.protocol === 'https:',
    })
    const role = typeof token?.role === 'string' ? token.role : null
    const destination = dashboardPathForRole(role)
    if (destination) {
      return NextResponse.redirect(new URL(destination, request.url))
    }
  }

  // The allowlist lives in @/lib/routes so the client-side redirect in useAuth
  // enforces exactly the same set. When these two disagreed, public pages that
  // called useAuth bounced signed-out visitors to /auth.
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  
  // Get the session token from cookies
  const sessionToken = request.cookies.get('authjs.session-token')?.value ||
                      request.cookies.get('__Secure-authjs.session-token')?.value
 
  // If no session token, redirect to auth
  if (!sessionToken) {
    const authUrl = new URL('/auth', request.url)
    return NextResponse.redirect(authUrl)
  }
 
  // If we have a token, allow the request to continue
  // The actual token validation happens in the NextAuth API routes
  return NextResponse.next()
}
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - any other path with a file extension (public/ static assets —
     *   images, fonts, 3D models, etc. — none of which need an auth check)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
}