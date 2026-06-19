import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
 
  // Public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/auth',
    '/signin',
    '/signup',
    '/verify',
    '/about',
    '/contact',
    '/search',
    '/legal',
    '/consult',
    '/track',
    '/delivery'
  ]
 
  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )
 
  if (isPublicRoute) {
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}