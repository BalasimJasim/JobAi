import { getServerSession } from "next-auth/next"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "../[...nextauth]/route"
import * as fs from 'fs';
import * as path from 'path';

function writeSessionLog(message: string, data?: any) {
  const logDir = path.join(process.cwd(), 'logs');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'session-endpoint.log');
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;

  fs.appendFileSync(logFile, logEntry);
  
  // Also log to console
  console.log(`[SESSION_ENDPOINT_DEBUG] ${message}`, data || '');
}

export async function GET(req: NextRequest) {
  try {
    writeSessionLog('Session Endpoint Called', {
      method: req.method,
      headers: Object.fromEntries(req.headers)
    });

    const session = await getServerSession(authOptions);
    
    writeSessionLog('Server Session Retrieved', { 
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null
    });

    // If no session, return a clear JSON response
    if (!session) {
      return NextResponse.json({ 
        user: null 
      }, { 
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Return session with explicit user properties
    return NextResponse.json({ 
      user: {
        id: session.user.id || '',
        email: session.user.email || '',
        name: session.user.name || ''
      }
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    writeSessionLog('Session Endpoint Error', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });

    return NextResponse.json(
      { 
        error: 'Session retrieval failed', 
        details: (error as Error).message 
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 