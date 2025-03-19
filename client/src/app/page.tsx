'use client';

import { Button } from '../components/ui/Button';
import { Navbar } from '../components/ui/Navbar';
import { FeatureCard } from '../components/ui/FeatureCard';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session } = useSession();

  const features = [
    {
      title: 'AI Resume Optimization',
      description: 'Get instant feedback on your resume with our AI-powered analysis and optimization tools.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: 'Smart Cover Letters',
      description: 'Generate customized cover letters that match job descriptions using advanced AI technology.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Application Tracking',
      description: 'Keep track of all your job applications in one place with our intuitive tracking system.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Your AI-Powered
                <span className="text-blue-600 block">Job Search Assistant</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8">
                Optimize your job applications with AI-powered tools. Create perfect resumes,
                generate tailored cover letters, and track your applications effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {session ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard/resume">
                      <Button className="text-lg px-8 py-3">
                        Create Resume
                      </Button>
                    </Link>
                    <Link href="/dashboard/cover-letters">
                      <Button variant="secondary" className="text-lg px-8 py-3">
                        Write Cover Letter
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <Link href="/signup">
                      <Button className="text-lg px-8 py-3">
                        Get Started Free
                      </Button>
                    </Link>
                    <Button variant="secondary" className="text-lg px-8 py-3">
                      Watch Demo
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything You Need to Land Your Dream Job
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Our AI-powered tools help you create professional resumes, write compelling
                cover letters, and stay organized throughout your job search.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Supercharge Your Job Search?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of job seekers who have already found success with JobAI.
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-3">
              Start Free Trial
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
