import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/database';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import coverLetterRoutes from './routes/cover-letter.routes';
import applicationRoutes from './routes/application.routes';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import { errorHandler } from './middleware/error';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve test files
app.use('/test', express.static(path.join(__dirname, '../test-files')));

// Basic test route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to JobAI API' });
});

// Test route for CORS and cookies
app.get('/api/test-cors', (req: Request, res: Response) => {
  console.log('Test CORS endpoint called');
  console.log('Request headers:', req.headers);
  console.log('Request cookies:', req.cookies);
  
  // Set a test cookie
  res.cookie('test-cookie', 'test-value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 1000 // 1 minute
  });
  
  res.json({ 
    message: 'CORS test successful',
    cookies: req.cookies,
    origin: req.headers.origin || 'No origin header',
    host: req.headers.host
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handling
app.use(errorHandler);

// Connect to database before starting server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Only start server after successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app; 