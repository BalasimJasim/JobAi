'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

interface TestResponse {
  message: string;
  cookies?: Record<string, string>;
  origin?: string;
  host?: string;
  [key: string]: unknown;
}

export function TestConnection() {
  const [result, setResult] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testDirectConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing direct connection to server...');
      const response = await fetch('http://localhost:5000/api/test-cors', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err) {
      console.error('Error testing connection:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testProxiedConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing proxied connection to server...');
      const response = await fetch('/api/test-cors', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
    } catch (err) {
      console.error('Error testing connection:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testCsrfToken = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Testing CSRF token endpoint...');
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
      
      const data = await response.json();
      console.log('Response data:', data);
      setResult(data);
      
      // Check cookies
      console.log('Cookies after CSRF request:', document.cookie);
    } catch (err) {
      console.error('Error testing CSRF token:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button onClick={testDirectConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Direct Connection'}
          </Button>
          <Button onClick={testProxiedConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Proxied Connection'}
          </Button>
          <Button onClick={testCsrfToken} disabled={loading}>
            {loading ? 'Testing...' : 'Test CSRF Token'}
          </Button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-green-50 text-green-800 rounded-md">
            <p className="font-semibold">Result:</p>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 