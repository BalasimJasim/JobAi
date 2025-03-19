import * as z from 'zod';

// Environment Variable Validation Schema
const EnvSchema = z.object({
  // NextAuth Configuration
  NEXTAUTH_SECRET: z.string().min(10, "NEXTAUTH_SECRET must be at least 10 characters"),
  NEXTAUTH_URL: z.string().url("Invalid NEXTAUTH_URL"),
  
  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url("Invalid API URL"),
  
  // Database Configuration
  MONGODB_URI: z.string().url("Invalid MongoDB URI"),
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "Google Client Secret is required"),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

// Validate and parse environment variables
function validateConfig() {
  try {
    return EnvSchema.parse(process.env);
  } catch (error) {
    if (z.ZodError.is(error)) {
      console.error('Configuration Validation Error:', error.errors);
      throw new Error('Invalid configuration. Please check your environment variables.');
    }
    throw error;
  }
}

// Memoized configuration to prevent multiple validations
const config = (() => {
  let cachedConfig: z.infer<typeof EnvSchema> | null = null;
  
  return () => {
    if (!cachedConfig) {
      cachedConfig = validateConfig();
    }
    return cachedConfig;
  };
})();

// Centralized configuration export
export const CONFIG = {
  // NextAuth Configuration
  nextAuth: {
    secret: () => config().NEXTAUTH_SECRET,
    url: () => config().NEXTAUTH_URL,
  },
  
  // API Configuration
  api: {
    baseUrl: () => config().NEXT_PUBLIC_API_URL,
  },
  
  // Database Configuration
  database: {
    uri: () => config().MONGODB_URI,
  },
  
  // OAuth Providers
  oauth: {
    google: {
      clientId: () => config().GOOGLE_CLIENT_ID,
      clientSecret: () => config().GOOGLE_CLIENT_SECRET,
    }
  },
  
  // Environment Helpers
  isDevelopment: () => config().NODE_ENV === 'development',
  isProduction: () => config().NODE_ENV === 'production',
  
  // Logging Utility
  log: {
    debug: (message: string, data?: any) => {
      if (CONFIG.isDevelopment()) {
        console.log(`[Debug] ${message}`, data || '');
      }
    },
    error: (message: string, error?: unknown) => {
      console.error(`[Error] ${message}`, error || '');
    }
  }
}; 