import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    console.log(`API route: Verifying email with token: ${params.token}`);
    
    // Get the token from the URL parameters
    const token = params.token;
    
    if (!token) {
      console.error('No token provided in URL parameters');
      return NextResponse.json(
        { success: false, message: 'Verification token is missing' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend server
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const response = await fetch(`${serverUrl}/auth/verify-email/${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    });
    
    console.log(`Server response status: ${response.status}`);
    
    // Get the response data
    const data = await response.json();
    console.log('Server response data:', data);
    
    // Set any cookies from the server response
    const setCookieHeader = response.headers.get('set-cookie');
    const headers = new Headers();
    
    if (setCookieHeader) {
      headers.set('set-cookie', setCookieHeader);
    }
    
    // Return the response with the same status code
    return NextResponse.json(data, { 
      status: response.status,
      headers
    });
  } catch (error) {
    console.error('Error in verify-email API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while verifying your email' 
      },
      { status: 500 }
    );
  }
} 