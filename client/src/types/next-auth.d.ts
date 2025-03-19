import 'next-auth';
import { UserRole } from '@/lib/access-control';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: UserRole;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    isEmailVerified?: boolean;
  }
  
  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: UserRole;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    isEmailVerified?: boolean;
  }
} 