import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { CoverLetterService } from '../services/cover-letter.service';
import { GenerateCoverLetterRequest } from '../types/cover-letter.types';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const generateCoverLetterHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const coverLetterService = new CoverLetterService();
    
    const coverLetter = await coverLetterService.generateCoverLetter(
      req.body,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Cover letter generated successfully',
      data: {
        coverLetter
      }
    });
  } catch (error) {
    console.error('Error generating cover letter:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating cover letter',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getAllCoverLetters = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const coverLetterService = new CoverLetterService();
    
    const coverLetters = await coverLetterService.getCoverLettersByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        coverLetters
      }
    });
  } catch (error) {
    console.error('Error fetching cover letters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cover letters',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const enhanceCoverLetter = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { content, context } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Cover letter content is required' });
    }

    const coverLetterService = new CoverLetterService();
    const enhancedContent = await coverLetterService.enhanceCoverLetter(content, context);
    
    res.json({ 
      success: true,
      content: enhancedContent 
    });
  } catch (error) {
    console.error('Error enhancing cover letter:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to enhance cover letter' 
    });
  }
};

export const downloadCoverLetterPDF = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { content, metadata } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Cover letter content is required' });
    }

    const coverLetterService = new CoverLetterService();
    const pdfBuffer = await coverLetterService.generatePDF({
      title: 'Cover Letter',
      content,
      metadata: {
        author: metadata?.author || 'JobAI User',
        keywords: metadata?.keywords || ['cover letter'],
        subject: metadata?.subject || 'Job Application Cover Letter'
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cover-letter.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating cover letter PDF:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate PDF' 
    });
  }
}; 