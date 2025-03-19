import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const login = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
        return false
      }

      // Refresh session to get latest data
      await update()
      
      // Redirect based on email verification status
      if (!session?.user?.isEmailVerified) {
        router.push('/auth/verify-email')
      } else {
        router.push('/app')
      }

      return true
    } catch (error) {
      toast.error('Failed to login')
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut({ redirect: false })
      router.push('/auth/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const googleLogin = async () => {
    try {
      await signIn('google', { redirect: false })
    } catch (error) {
      toast.error('Failed to login with Google')
    }
  }

  return {
    session,
    status,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
    user: session?.user,
    login,
    logout,
    googleLogin,
  }
} 