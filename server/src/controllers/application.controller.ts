import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { ApplicationService } from '../services/application.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const createApplication = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const applicationService = new ApplicationService();
    
    const application = await applicationService.createApplication({
      ...req.body,
      userId
    });

    res.status(201).json({
      success: true,
      message: 'Application created successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating application',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getApplications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const applicationService = new ApplicationService();
    
    const applications = await applicationService.getApplications(userId);

    res.status(200).json({
      success: true,
      data: {
        applications
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getApplication = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const { id } = req.params;
    const applicationService = new ApplicationService();
    
    const application = await applicationService.getApplicationById(id, userId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateApplicationStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const { id } = req.params;
    const applicationService = new ApplicationService();
    
    const application = await applicationService.updateApplicationStatus(
      id,
      userId,
      req.body
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application
      }
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const deleteApplication = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const { id } = req.params;
    const applicationService = new ApplicationService();
    
    const success = await applicationService.deleteApplication(id, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting application',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 