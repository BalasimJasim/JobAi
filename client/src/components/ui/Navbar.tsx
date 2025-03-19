'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: session, status } = useSession();
  console.log('Authentication Status:', status);
  console.log('Session Data:', session);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
      router.push('/');
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Render functions for different parts of the navbar
  const renderAuthButtons = () => (
    <>
      <Link href="/login">
        <Button variant="secondary" className="ml-2">
          Log in
        </Button>
      </Link>
      <Link href="/signup">
        <Button>
          Sign up
        </Button>
      </Link>
    </>
  );

  const renderUserDropdown = () => {
    // Only render if explicitly authenticated and session exists
    if (status !== 'authenticated' || !session) return null;
    
    return (
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500"
        >
          <span>{session.user?.name || session.user?.email}</span>
          <svg
            className={`h-5 w-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 py-2 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
            <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)}>
              <span className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Dashboard
              </span>
            </Link>
            <Link href="/profile" onClick={() => setIsDropdownOpen(false)}>
              <span className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Profile
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMobileAuthButtons = () => (
    <div className="space-y-2 px-4">
      <Link href="/login" className="block" onClick={() => setIsMenuOpen(false)}>
        <Button variant="secondary" className="w-full">
          Log in
        </Button>
      </Link>
      <Link href="/signup" className="block" onClick={() => setIsMenuOpen(false)}>
        <Button className="w-full">
          Sign up
        </Button>
      </Link>
    </div>
  );

  const renderMobileUserOptions = () => {
    if (status !== 'authenticated' || !session) return null;
    
    return (
      <div className="space-y-2 px-4">
        <Link href="/dashboard" className="block" onClick={() => setIsMenuOpen(false)}>
          <Button variant="ghost" className="w-full text-left">
            Dashboard
          </Button>
        </Link>
        <Link href="/profile" className="block" onClick={() => setIsMenuOpen(false)}>
          <Button variant="ghost" className="w-full text-left">
            Profile
          </Button>
        </Link>
        <Button
          variant="secondary"
          className="w-full text-red-500"
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              JobAI
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 px-3 py-2">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500 px-3 py-2">
              Pricing
            </a>
            
            {/* Always render one of these - either auth buttons or user dropdown */}
            {status === 'authenticated' && session ? renderUserDropdown() : renderAuthButtons()}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <a
              href="#features"
              className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="block px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500"
            >
              Pricing
            </a>
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {/* Always render one of these - either auth buttons or user options */}
            {status === 'authenticated' && session ? renderMobileUserOptions() : renderMobileAuthButtons()}
          </div>
        </div>
      )}
    </nav>
  );
}; 