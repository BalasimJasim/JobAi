'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const router = useRouter();
  const params = useParams<{ token: string }>();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('Starting email verification process');
        // Get token from URL params
        const token = params?.token;
        console.log('Token from URL:', token);
        
        if (!token) {
          console.error('No token found in URL parameters');
          setStatus('error');
          setMessage('No verification token provided');
          return;
        }

        // Call the verification API
        const response = await fetch(`/api/auth/verify-email/${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }
        
        console.log('Verification response:', data);
        
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        
        // Store email for auto-login if available
        if (data.user?.email) {
          setEmail(data.user.email);
        }
        
        // Auto-redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?verified=true' + (email ? `&email=${encodeURIComponent(email)}` : ''));
        }, 3000);
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        if (error instanceof Error) {
          setMessage(error.message || 'Failed to verify email. The link may be invalid or expired.');
        } else {
          setMessage('Failed to verify email. The link may be invalid or expired.');
        }
      }
    };

    verifyEmail();
  }, [params, router, email]);

  const handleLogin = async () => {
    if (email) {
      // If we have the email, redirect to login page with email prefilled
      router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
    } else {
      // Otherwise just go to login page
      router.push('/login?verified=true');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">JobAI</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered Job Assistant
            </p>
          </Link>
          
          <h2 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Email Verification
          </h2>
        </div>
        
        <div className="mt-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Verifying your email...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{message}</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Redirecting you to the login page...
              </p>
              <button
                onClick={handleLogin}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
                <svg className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Verification Failed</p>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{message}</p>
              <div className="mt-6">
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 