import express, { RequestHandler } from 'express';
import {
  createApplication,
  getApplications,
  getApplication,
  updateApplicationStatus,
  deleteApplication
} from '../controllers/application.controller';
import {
  validateCreateApplication,
  validateUpdateStatus
} from '../middleware/validate-application';
import { requireAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Protect all application routes with authentication
router.use(requireAuth);

// Create a new job application
router.post(
  '/',
  validateCreateApplication as RequestHandler,
  createApplication as RequestHandler<any, any, any, any>
);

// Get all job applications
router.get('/', getApplications as RequestHandler<any, any, any, any>);

// Get a specific job application
router.get('/:id', getApplication as RequestHandler<any, any, any, any>);

// Update job application status
router.patch(
  '/:id/status',
  validateUpdateStatus as RequestHandler,
  updateApplicationStatus as RequestHandler<any, any, any, any>
);

// Delete a job application
router.delete('/:id', deleteApplication as RequestHandler<any, any, any, any>);

export default router; 