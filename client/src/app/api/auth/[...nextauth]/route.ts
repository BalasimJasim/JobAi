import NextAuth, { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'

// Enhanced logging utility with file-based logging
import * as fs from 'fs';
import * as path from 'path';

function writeLog(message: string, data?: any) {
  const logDir = path.join(process.cwd(), 'logs');
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, 'nextauth-detailed.log');
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n\n`;

  fs.appendFileSync(logFile, logEntry);
  
  // Also log to console with more context
  console.log(`[NEXTAUTH_DETAILED] ${message}`, data || '');
}

export const authOptions: AuthOptions = {
  // Use environment variable for secret
  secret: process.env.NEXTAUTH_SECRET,
  
  // MongoDB adapter for persistence
  adapter: MongoDBAdapter(clientPromise),
  
  // JWT-based session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Configure providers
  providers: [
    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    // Credentials Provider
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        writeLog('Authorization Attempt', { 
          email: credentials?.email,
          apiUrl: process.env.NEXT_PUBLIC_API_URL 
        });

        // Basic input validation
        if (!credentials?.email || !credentials?.password) {
          writeLog('Missing Credentials', { 
            missingEmail: !credentials?.email,
            missingPassword: !credentials?.password 
          });
          return null;
        }

        try {
          // Fetch authentication from backend
          const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            })
          });

          writeLog('Backend Response', {
            status: authResponse.status,
            headers: Object.fromEntries(authResponse.headers)
          });

          // Handle authentication response
          if (!authResponse.ok) {
            const errorText = await authResponse.text();
            writeLog('Authentication Failed', { 
              status: authResponse.status, 
              errorText 
            });
            return null;
          }

          // Parse user data with detailed logging
          const user = await authResponse.json();
          
          writeLog('User Authentication Success', {
            userId: user.id,
            userEmail: user.email,
            hasName: !!user.name
          });

          // Validate user object structure
          if (!user.id || !user.email) {
            writeLog('Invalid User Object', { user });
            return null;
          }

          // Return user object for session
          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            isEmailVerified: user.isEmailVerified || false,
            subscriptionPlan: user.subscriptionPlan || 'free',
            subscriptionStatus: user.subscriptionStatus || 'inactive'
          };
        } catch (error) {
          writeLog('Authentication Error', {
            errorName: (error as Error).name,
            errorMessage: (error as Error).message,
            stack: (error as Error).stack
          });
          return null;
        }
      }
    })
  ],

  // Callbacks for customizing session and token
  callbacks: {
    async session({ session, token }) {
      writeLog('Session Generation', { 
        tokenSub: token.sub,
        tokenEmail: token.email 
      });

      // Only set user properties if token contains valid user data
      if (token.email) {
        session.user = {
          ...session.user,
          id: token.sub || '',
          email: token.email || '',
          isEmailVerified: token.isEmailVerified as boolean,
          subscriptionPlan: token.subscriptionPlan as string,
          subscriptionStatus: token.subscriptionStatus as string
        };
      } else {
        session.user = {} as any; // Set to empty object to avoid type error
      }

      return session;
    },

    async jwt({ token, user, account }) {
      writeLog('JWT Generation', { 
        userId: user?.id, 
        userEmail: user?.email,
        accountType: account?.provider
      });
      
      // Only update token if user is present
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isEmailVerified = user.isEmailVerified;
        token.subscriptionPlan = user.subscriptionPlan;
        token.subscriptionStatus = user.subscriptionStatus;
      }
      return token;
    }
  },

  // Custom pages for authentication flow
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/verify-email',
  },

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development'
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 