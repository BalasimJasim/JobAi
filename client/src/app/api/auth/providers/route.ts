import { NextResponse } from 'next/server';
import { getProviders } from 'next-auth/react';

export async function GET() {
  try {
    // Fetch providers server-side
    const providers = await getProviders();
    
    // Log providers for debugging
    console.log('Fetched Providers:', providers);

    // Return providers as JSON response
    return NextResponse.json(providers || {}, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    
    // Detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to fetch authentication providers', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
} 