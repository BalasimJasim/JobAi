import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// This function can be marked `async` if using `await` inside
export default withAuth(
  function middleware(req) {
    // Allow all auth-related routes to pass through
    if (req.nextUrl.pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }

    // Check if user is authenticated and has verified email
    const token = req.nextauth.token
    
    // Protected routes that require authentication
    if (req.nextUrl.pathname.startsWith('/dashboard') || 
        req.nextUrl.pathname.startsWith('/profile') ||
        req.nextUrl.pathname.startsWith('/applications')) {
      
      // If not authenticated, redirect to login
      if (!token) {
        return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(req.nextUrl.pathname)}`, req.url))
      }
      
      // If email not verified, redirect to verification page
      if (token && !token.isEmailVerified && req.nextUrl.pathname !== '/verify-email') {
        return NextResponse.redirect(new URL('/verify-email', req.url))
      }
      
      // If subscription required for this route and user doesn't have active subscription
      if (req.nextUrl.pathname.startsWith('/premium') && 
          token.subscriptionStatus !== 'ACTIVE') {
        return NextResponse.redirect(new URL('/subscription', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/applications/:path*',
    '/premium/:path*',
    '/api/auth/:path*',
  ],
} 