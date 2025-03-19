'use client';

import { TestConnection } from '@/components/TestConnection';

export default function TestConnectionPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Server Connection Test</h1>
      <TestConnection />
    </div>
  );
} 