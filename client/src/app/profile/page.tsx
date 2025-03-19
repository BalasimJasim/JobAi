'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  if (!session) {
    router.push('/login');
    return null;
  }

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      // Implement profile update logic
      console.log('Updating profile');
    } catch (error) {
      console.error('Profile update failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        Profile
      </h1>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center space-x-6 mb-6">
          <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {session.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-500 dark:text-gray-400 text-3xl">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {session.user?.name || 'User'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {session.user?.email}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input 
              type="email" 
              value={session.user?.email || ''} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name
            </label>
            <input 
              type="text" 
              value={session.user?.name || ''} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <input 
              type="text" 
              value={session.user?.role || 'User'} 
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <Button 
            variant="secondary"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button 
            onClick={handleUpdateProfile}
            disabled={isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </div>
      </div>
    </div>
  );
} 