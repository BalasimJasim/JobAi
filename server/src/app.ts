import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import coverLetterRoutes from './routes/cover-letter.routes';
import applicationRoutes from './routes/application.routes';
import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import { csrfProtection } from './middleware/csrf.middleware';
import { errorHandler } from './middleware/error.middleware';
import path from 'path';
import fs from 'fs';

// Create the app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-XSRF-TOKEN',
    'X-Requested-With',
    'Accept',
    'Accept-Version',
    'Content-Length',
    'Content-MD-5',
    'Date',
    'X-Api-Version'
  ]
}));

// Make sure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Make sure resumes directory exists
const resumesDir = path.join(uploadsDir, 'resumes');
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/test', express.static(path.join(__dirname, '../test-files')));

// CSRF protection
app.use(csrfProtection);

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to JobAI API' });
});

// Log all routes being registered
console.log('Registering routes:');
console.log('- /api/auth');
console.log('- /api/resumes');
console.log('- /api/cover-letters');
console.log('- /api/applications');
console.log('- /api/payments');
console.log('- /api/subscriptions');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handling
app.use(errorHandler);

export { app }; 