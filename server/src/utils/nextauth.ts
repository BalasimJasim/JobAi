import jwt from 'jsonwebtoken'

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET

if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set')
}

export interface NextAuthUser {
  id: string
  email: string
  name?: string
  isEmailVerified?: boolean
  subscriptionPlan?: string
  subscriptionStatus?: string
}

export interface NextAuthSession {
  user?: NextAuthUser
}

export async function verifyNextAuthToken(token: string): Promise<NextAuthSession | null> {
  try {
    if (!NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not set')
    }

    // NextAuth.js tokens are JWT tokens signed with NEXTAUTH_SECRET
    const decoded = jwt.verify(token, NEXTAUTH_SECRET) as {
      sub?: string
      email?: string
      name?: string
      isEmailVerified?: boolean
      subscriptionPlan?: string
      subscriptionStatus?: string
      exp?: number
    }

    // Check if token is expired
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.log('Token expired')
      return null
    }

    // NextAuth.js session tokens contain user data in a specific format
    if (decoded.sub && decoded.email) {
      return {
        user: {
          id: decoded.sub,
          email: decoded.email,
          name: decoded.name,
          isEmailVerified: decoded.isEmailVerified,
          subscriptionPlan: decoded.subscriptionPlan,
          subscriptionStatus: decoded.subscriptionStatus,
        }
      }
    }

    return null
  } catch (error) {
    console.error('NextAuth token verification failed:', error)
    return null
  }
} 