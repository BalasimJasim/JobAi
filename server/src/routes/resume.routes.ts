import express from 'express';
import { 
  uploadResume, 
  getResumes, 
  getResumeFeedback, 
  testOpenAIConnection, 
  testAuth,
  analyzeResumeText,
  optimizeResumeForJob,
  downloadPDF,
  improveSectionWithAI
} from '../controllers/resume.controller';
import { requireAuth } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth.middleware';
import upload from '../config/multer.config';

const router = express.Router();

// Test OpenAI connection - public endpoint for testing
router.get('/test-openai', testOpenAIConnection);

// Test authentication endpoint - public for testing
router.get('/test-auth', testAuth);

// Analyze resume text without file upload (temporary public access for testing)
router.post('/analyze', analyzeResumeText);

// Protect all other resume routes with authentication
router.use(authMiddleware);  // First verify and decode the token
router.use(requireAuth);     // Then check if userId exists

// Upload resume route with multer middleware
router.post('/upload', (req, res, next) => {
  console.log('Request content type:', req.headers['content-type']);
  console.log('Request body type:', typeof req.body);
  next();
}, upload.single('resume'), uploadResume);

// Get all resumes for a user
router.get('/', getResumes);

// Get feedback history for a resume
router.get('/:resumeId/feedback', getResumeFeedback);

// Optimize resume based on analysis
router.post('/:resumeId/optimize', optimizeResumeForJob);

// Improve individual resume section
router.post('/improve-section', improveSectionWithAI);

// Download resume as PDF
console.log('Registering PDF download route: /download');
router.post('/download', downloadPDF);

export default router; 