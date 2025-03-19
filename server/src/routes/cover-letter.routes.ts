import express, { RequestHandler } from 'express';
import { 
  generateCoverLetterHandler, 
  getAllCoverLetters, 
  enhanceCoverLetter, 
  downloadCoverLetterPDF 
} from '../controllers/cover-letter.controller';
import { validateCoverLetterRequest } from '../middleware/validate-cover-letter';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Router } from 'express';

const router = express.Router();

// Protect all cover letter routes with authentication
router.use(requireAuth);

// Generate a new cover letter with validation
router.post(
  '/generate',
  validateCoverLetterRequest as RequestHandler,
  generateCoverLetterHandler as RequestHandler<any, any, any, any>
);

// Get all cover letters for a user
router.get('/', getAllCoverLetters as RequestHandler<any, any, any, any>);

// Cover letter enhancement endpoint
router.post('/enhance', enhanceCoverLetter as RequestHandler<any, any, any, any>);

// Cover letter PDF download endpoint
router.post('/download', downloadCoverLetterPDF as RequestHandler<any, any, any, any>);

export default router; 