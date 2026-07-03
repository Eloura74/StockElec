import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './lib/auth'

// Specify which routes are protected
const protectedRoutes = ['/', '/catalogue', '/chantiers', '/reassort', '/inventaire', '/equipe']
const chefRoutes = ['/depart-matin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip API, static files, images...
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next()
  }

  const session = await getSession()

  // 1. Unauthenticated users -> Redirect to login
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. Authenticated users going to login -> Redirect to their respective dashboard
  if (session && pathname === '/login') {
    if (session.role === 'GERANT') {
      return NextResponse.redirect(new URL('/', request.url))
    } else {
      return NextResponse.redirect(new URL('/depart-matin', request.url))
    }
  }

  // 3. Chefs d'équipe trying to access Gerant routes -> Redirect to depart-matin
  if (session && session.role === 'CHEF_EQUIPE' && protectedRoutes.some(r => pathname === r || pathname.startsWith(`${r}/`))) {
    return NextResponse.redirect(new URL('/depart-matin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
