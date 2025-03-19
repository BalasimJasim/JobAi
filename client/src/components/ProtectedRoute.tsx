'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    if (status === 'unauthenticated') {
      // Redirect to login if not authenticated
      router.replace('/login');
      return;
    }

    // Check role if specified
    if (requiredRole && session?.user?.role !== requiredRole) {
      // Redirect to unauthorized page or dashboard
      router.replace('/dashboard');
      return;
    }

    // Check email verification
    if (session?.user && !session.user.isEmailVerified) {
      // Redirect to verification page
      router.replace('/verify-email');
      return;
    }
  }, [session, status, router, requiredRole]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // Render children if authenticated and authorized
  return <>{children}</>;
};

// Higher-order component for class components or simpler usage
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
} 