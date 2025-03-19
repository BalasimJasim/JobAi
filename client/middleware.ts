import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(request: NextRequestWithAuth) {
    // Redirect if they don't have an active subscription
    if (
      request.nextUrl.pathname.startsWith('/app') && 
      request.nextauth.token?.subscriptionStatus !== 'ACTIVE'
    ) {
      return NextResponse.redirect(new URL('/subscription', request.url))
    }

    // Redirect if email is not verified
    if (
      request.nextUrl.pathname.startsWith('/app') && 
      !request.nextauth.token?.isEmailVerified
    ) {
      return NextResponse.redirect(new URL('/auth/verify-email', request.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

// Protect all routes under /app and /api
export const config = {
  matcher: ['/app/:path*', '/api/:path*']
} 