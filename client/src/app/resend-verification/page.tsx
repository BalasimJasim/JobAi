'use client';

import Link from 'next/link';
import { ResendVerificationEmail } from '@/components/auth/ResendVerificationEmail';

export default function ResendVerificationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link 
            href="/" 
            className="inline-block transition-transform hover:scale-105"
          >
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              JobAI
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              AI-powered Job Assistant
            </p>
          </Link>
        </div>
        <ResendVerificationEmail />
        <div className="text-center mt-4">
          <Link 
            href="/login" 
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
} 