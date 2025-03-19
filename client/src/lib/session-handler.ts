import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import * as fs from 'fs';
import * as path from 'path';

function writeSessionLog(message: string, data?: any) {
  const logDir = path.join(process.cwd(), 'logs');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'session-handler.log');
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;

  fs.appendFileSync(logFile, logEntry);
  
  // Also log to console
  console.log(`[SESSION_DEBUG] ${message}`, data || '');
}

export async function getCustomServerSession() {
  try {
    writeSessionLog('Attempting to get server session');

    // Fetch session with detailed logging
    const session = await getServerSession(authOptions);
    
    writeSessionLog('Server Session Retrieved', { 
      hasSession: !!session,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null
    });

    return session;
  } catch (error) {
    writeSessionLog('Server Session Error', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });

    throw error;
  }
}

export async function fetchCustomSession() {
  try {
    writeSessionLog('Attempting to fetch custom session');

    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    writeSessionLog('Session Fetch Response', {
      status: response.status,
      headers: Object.fromEntries(response.headers)
    });

    if (!response.ok) {
      const errorText = await response.text();
      writeSessionLog('Session Fetch Failed', { 
        status: response.status, 
        errorText 
      });
      return null;
    }

    const sessionData = await response.json();
    
    writeSessionLog('Session Data Retrieved', sessionData);

    return sessionData;
  } catch (error) {
    writeSessionLog('Session Fetch Error', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack
    });

    throw error;
  }
} 