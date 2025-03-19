import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('API route: Processing password reset');
    
    // Get the request body
    const body = await request.json();
    const { token, password } = body;
    
    if (!token || !password) {
      console.error('Missing required fields in request body');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Token and password are required' 
        },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend server
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const response = await fetch(`${serverUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ token, password }),
      credentials: 'include'
    });
    
    console.log(`Server response status: ${response.status}`);
    
    // Get the response data
    const data = await response.json();
    console.log('Server response data:', data);
    
    // Return the response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in reset-password API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while resetting your password' 
      },
      { status: 500 }
    );
  }
} 