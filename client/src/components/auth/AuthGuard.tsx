'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
    } else if (session.user && !session.user.isEmailVerified) {
      router.push('/verify-email');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <LoadingOverlay message="Loading authentication..." isVisible={true} />;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}; 