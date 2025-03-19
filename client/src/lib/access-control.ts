import { Session } from 'next-auth';
import { useSession } from 'next-auth/react';

// Define user roles with increasing levels of access
export enum UserRole {
  GUEST = 'GUEST',
  USER = 'USER',
  PREMIUM_USER = 'PREMIUM_USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// Define permission levels for different resources
export enum ResourcePermission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN'
}

// Access control matrix defining role-based permissions
const ACCESS_CONTROL_MATRIX: Record<UserRole, Record<string, ResourcePermission[]>> = {
  [UserRole.GUEST]: {
    dashboard: [],
    profile: [],
    applications: [],
  },
  [UserRole.USER]: {
    dashboard: [ResourcePermission.READ],
    profile: [ResourcePermission.READ, ResourcePermission.WRITE],
    applications: [ResourcePermission.READ, ResourcePermission.WRITE],
  },
  [UserRole.PREMIUM_USER]: {
    dashboard: [ResourcePermission.READ],
    profile: [ResourcePermission.READ, ResourcePermission.WRITE],
    applications: [ResourcePermission.READ, ResourcePermission.WRITE],
    advancedFeatures: [ResourcePermission.READ, ResourcePermission.WRITE],
  },
  [UserRole.ADMIN]: {
    dashboard: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.ADMIN],
    profile: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.DELETE],
    applications: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.DELETE],
    users: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.DELETE],
  },
  [UserRole.SUPER_ADMIN]: {
    dashboard: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.ADMIN],
    profile: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.DELETE],
    applications: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.DELETE],
    users: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.DELETE],
    system: [ResourcePermission.READ, ResourcePermission.WRITE, ResourcePermission.ADMIN],
  }
};

export class AccessControl {
  // Check if a user has a specific permission for a resource
  static hasPermission(
    session: Session | null, 
    resource: string, 
    requiredPermission: ResourcePermission
  ): boolean {
    if (!session?.user) return false;

    const userRole = (session.user as any).role as UserRole || UserRole.GUEST;
    const resourcePermissions = ACCESS_CONTROL_MATRIX[userRole][resource] || [];

    return resourcePermissions.includes(requiredPermission);
  }

  // Get user's role
  static getUserRole(session: Session | null): UserRole {
    return (session?.user as any)?.role || UserRole.GUEST;
  }

  // Check if user is authenticated
  static isAuthenticated(session: Session | null): boolean {
    return !!session?.user;
  }

  // Check if user's email is verified
  static isEmailVerified(session: Session | null): boolean {
    return !!(session?.user as any)?.isEmailVerified;
  }

  // Get allowed resources for a user
  static getAllowedResources(session: Session | null): string[] {
    if (!session?.user) return [];

    const userRole = (session.user as any).role as UserRole || UserRole.GUEST;
    return Object.keys(ACCESS_CONTROL_MATRIX[userRole]);
  }
}

// Utility hook for client-side access control
export function useAccessControl() {
  const { data: session } = useSession();

  return {
    hasPermission: (resource: string, permission: ResourcePermission) => 
      AccessControl.hasPermission(session, resource, permission),
    getUserRole: () => AccessControl.getUserRole(session),
    isAuthenticated: AccessControl.isAuthenticated(session),
    isEmailVerified: AccessControl.isEmailVerified(session),
    getAllowedResources: () => AccessControl.getAllowedResources(session)
  };
} 