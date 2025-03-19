import { Request, Response } from 'express';
import { Types, Document } from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { ResumeFeedbackService } from '../services/resume-feedback.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { testOpenAIConnection as testOpenAI } from '../utils/openai';
import PDFDocument from 'pdfkit';
import { ResumeEntityService } from '../services/resume-entity.service';
import OpenAI from 'openai';
import { Resume } from '../models/resume.model';
import { ResumeFeedback } from '../models/resume-feedback.model';
import { generateOptimizedSection, improveSectionWithConstraints } from '../utils/openai';
import { generateContextAwareOptimizedResume } from '../utils/openai';
import { User } from '../models/user.model';
import { uploadToS3, deleteFromS3 } from '../utils/s3';
import { v4 as uuidv4 } from 'uuid';
import { AuthError } from '../utils/auth';
import { OptimizedResume, optimizeResumeForJob as optimizeResume } from '../services/resume.service';

// Define Resume interface
interface IResume {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  status: string;
  createdAt: Date;
  originalResumeId?: Types.ObjectId;
}

type ResumeDocument = Document<unknown, {}, IResume> & 
  Omit<IResume, '_id'> & {
    _id: Types.ObjectId;
    get<K extends keyof IResume>(key: K): IResume[K];
  };

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test OpenAI connection
export const testOpenAIConnection = async (req: Request, res: Response) => {
  try {
    console.log('Testing OpenAI connection...');
    const isConnected = await testOpenAI();
    
    if (isConnected) {
      return res.status(200).json({
        success: true,
        message: 'Successfully connected to OpenAI API'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to OpenAI API'
      });
    }
  } catch (error) {
    console.error('Error testing OpenAI connection:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing OpenAI connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Test authentication and cookies
export const testAuth = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== DEBUG: Testing authentication ===');
    console.log('Request headers:', req.headers);
    console.log('Request cookies:', req.cookies);
    
    // Check if user is authenticated
    const isAuthenticated = req.userId !== undefined;
    console.log('Is authenticated:', isAuthenticated);
    
    if (isAuthenticated) {
      console.log('User ID:', req.userId);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Authentication test completed',
      isAuthenticated,
      user: isAuthenticated ? { id: req.userId } : null
    });
  } catch (error) {
    console.error('Error in test auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing authentication',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const uploadResume = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const fileKey = `resumes/${req.userId}/${uuidv4()}-${req.file.originalname}`;
    const uploadResult = await uploadToS3(req.file.buffer, fileKey);

    const resumeDoc = (await Resume.create({
      userId: new Types.ObjectId(req.userId),
      fileName: req.file.originalname,
      fileKey: fileKey,
      fileUrl: uploadResult.Location,
      status: 'UPLOADED'
    })).toObject() as unknown as ResumeDocument;

    const resume: IResume = {
      _id: resumeDoc._id,
      userId: resumeDoc.userId,
      fileName: resumeDoc.fileName,
      fileKey: resumeDoc.fileKey,
      fileUrl: resumeDoc.fileUrl,
      status: resumeDoc.status,
      createdAt: resumeDoc.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        id: resume._id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        status: resume.status,
        createdAt: resume.createdAt
      }
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume'
    });
  }
};

export const getResumes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const resumeDocs = (await Resume.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec()) as unknown as ResumeDocument[];

    const resumes: IResume[] = resumeDocs.map(doc => ({
      _id: doc._id,
      userId: doc.userId,
      fileName: doc.fileName,
      fileKey: doc.fileKey,
      fileUrl: doc.fileUrl,
      status: doc.status,
      createdAt: doc.createdAt,
      originalResumeId: doc.originalResumeId
    }));

    res.status(200).json({
      success: true,
      resumes: resumes.map(resume => ({
        id: resume._id,
        fileName: resume.fileName,
        fileUrl: resume.fileUrl,
        status: resume.status,
        createdAt: resume.createdAt
      }))
    });
  } catch (error) {
    console.error('Get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resumes'
    });
  }
};

export const deleteResume = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { resumeId } = req.params;

    const resume = (await Resume.findOne({
      _id: resumeId,
      userId: req.userId
    }).lean().exec()) as unknown as ResumeDocument;

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    // Delete from S3
    await deleteFromS3(resume.fileKey);

    // Delete from database
    await Resume.deleteOne({ _id: resumeId });

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume'
    });
  }
};

export const optimizeResumeForJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { resumeId } = req.params;
    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required'
      });
    }

    const resume = (await Resume.findOne({
      _id: resumeId,
      userId: req.userId
    }).lean().exec()) as unknown as ResumeDocument;

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found'
      });
    }

    const optimizedResume = await optimizeResume(resume.fileUrl, jobDescription);

    // Save optimized resume
    const fileKey = `resumes/${req.userId}/optimized-${uuidv4()}-${resume.fileName}`;
    const uploadResult = await uploadToS3(
      Buffer.from(optimizedResume.content),
      fileKey,
      'application/pdf'
    );

    const optimizedResumeDoc = (await Resume.create({
      userId: new Types.ObjectId(req.userId),
      fileName: `optimized-${resume.fileName}`,
      fileKey: fileKey,
      fileUrl: uploadResult.Location,
      status: 'OPTIMIZED',
      originalResumeId: resume._id
    })).toObject() as unknown as ResumeDocument;

    const optimizedResumeData: IResume = {
      _id: optimizedResumeDoc._id,
      userId: optimizedResumeDoc.userId,
      fileName: optimizedResumeDoc.fileName,
      fileKey: optimizedResumeDoc.fileKey,
      fileUrl: optimizedResumeDoc.fileUrl,
      status: optimizedResumeDoc.status,
      createdAt: optimizedResumeDoc.createdAt,
      originalResumeId: optimizedResumeDoc.originalResumeId
    };

    res.status(200).json({
      success: true,
      message: 'Resume optimized successfully',
      resume: {
        id: optimizedResumeData._id,
        fileName: optimizedResumeData.fileName,
        fileUrl: optimizedResumeData.fileUrl,
        status: optimizedResumeData.status,
        createdAt: optimizedResumeData.createdAt,
        changes: optimizedResume.changes
      }
    });
  } catch (error) {
    console.error('Optimize resume error:', error);
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to optimize resume'
    });
  }
};

export const getResumeFeedback = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = new Types.ObjectId(req.userId);
    const { resumeId } = req.params;

    // Get all feedback for the user
    const allFeedback = await ResumeFeedbackService.getFeedbackHistory(userId);
    
    // Filter feedback for the specific resume
    const feedback = allFeedback.filter(f => f.resumeId === resumeId);

    if (feedback.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No feedback found for this resume'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        feedback
      }
    });
  } catch (error) {
    console.error('Error in getResumeFeedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resume feedback',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Define interface for resume section
interface ResumeSection {
  title: string;
  content: string;
  suggestions?: string[];
}

export const analyzeResumeText = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Starting resume analysis...');
    const { resumeText, jobDescription } = req.body;

    if (!resumeText) {
      console.log('No resume text provided');
      return res.status(400).json({
        success: false,
        message: 'Resume text is required'
      });
    }

    const userId = req.userId ? new Types.ObjectId(req.userId) : new Types.ObjectId();
    console.log('Processing for user:', userId);

    const tempResumeId = `temp_${Date.now()}_${userId}`;
    console.log('Generated resume ID:', tempResumeId);

    try {
      console.log('Calling ResumeFeedbackService...');
      const feedback = await ResumeFeedbackService.analyzeAndStoreFeedback(
        userId,
        tempResumeId,
        resumeText,
        jobDescription || ''
      );

      console.log('Analysis completed successfully');
      return res.status(200).json({
        success: true,
        message: 'Resume analyzed successfully',
        data: feedback
      });
    } catch (analysisError) {
      console.error('Error in ResumeFeedbackService:', analysisError);
      return res.status(500).json({
        success: false,
        message: 'Error analyzing resume',
        error: analysisError instanceof Error ? analysisError.message : 'Internal server error'
      });
    }
  } catch (error) {
    console.error('Error in analyzeResumeText:', error);
    return res.status(500).json({
      success: false,
      message: 'Error analyzing resume',
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};

/**
 * Calculate an overall improvement score based on the optimization result
 */
function calculateImprovementScore(optimizationResult: any): number {
  // This would ideally use a more sophisticated algorithm
  // For now, we'll use a simple calculation based on contextual metadata
  const { contextualMetadata } = optimizationResult;
  
  let score = 0.5; // Start with a neutral score
  
  // Add points for industry relevance (0-0.2)
  score += contextualMetadata.industryRelevance * 0.2;
  
  // Add points for career level appropriateness (0-0.1)
  score += contextualMetadata.careerLevelAppropriate ? 0.1 : 0;
  
  // Add points for role alignment (0-0.2)
  score += contextualMetadata.roleAlignment * 0.2;
  
  // Add points for company fit if available (0-0.1)
  if (contextualMetadata.companyFit) {
    score += contextualMetadata.companyFit * 0.1;
  }
  
  // Ensure score is between 0 and 1
  return Math.min(1, Math.max(0, score));
}

/**
 * Calculate keyword optimization score based on job description
 */
function calculateKeywordOptimizationScore(optimizedText: string, jobDescription: string): string {
  // Extract key terms from job description
  const jobTerms = jobDescription
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(term => term.length > 3)
    .filter(term => !['and', 'the', 'for', 'with', 'that', 'this', 'have', 'from'].includes(term));
  
  const uniqueJobTerms = [...new Set(jobTerms)];
  let matchCount = 0;
  
  for (const term of uniqueJobTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(optimizedText)) {
      matchCount++;
    }
  }
  
  const percentage = Math.round((matchCount / uniqueJobTerms.length) * 100);
  return `${percentage}% (${matchCount}/${uniqueJobTerms.length} keywords)`;
}

/**
 * Calculate readability score for the optimized text
 */
function calculateReadabilityScore(text: string): string {
  // This would ideally use a proper readability algorithm like Flesch-Kincaid
  // For now, we'll use a simple approximation
  
  // Count sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Count words
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  
  // Count syllables (very rough approximation)
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) {
    return 'N/A';
  }
  
  // Calculate average sentence length
  const avgSentenceLength = words.length / sentences.length;
  
  // Calculate average syllables per word
  const avgSyllablesPerWord = syllables / words.length;
  
  // Simple readability score (lower is easier to read)
  const readabilityScore = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
  
  // Convert to a descriptive rating
  if (readabilityScore < 30) {
    return 'Very Easy';
  } else if (readabilityScore < 50) {
    return 'Easy';
  } else if (readabilityScore < 60) {
    return 'Moderate';
  } else if (readabilityScore < 70) {
    return 'Difficult';
  } else {
    return 'Very Difficult';
  }
}

/**
 * Count syllables in a word (rough approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  // Remove es, ed at the end
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  // Count vowel groups
  const syllableCount = word.match(/[aeiouy]{1,2}/g);
  return syllableCount ? syllableCount.length : 1;
}

export const downloadPDF = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resume, sections } = req.body;
    console.log('PDF Generation - Input:', {
      hasResume: !!resume,
      resumeLength: resume?.length,
      hasSections: !!sections,
      sectionsCount: sections?.length,
      sectionTypes: sections?.map((s: { id: string }) => s.id)
    });

    if (!resume && !sections) {
      console.error('PDF Generation - Error: No content provided');
      return res.status(400).json({
        success: false,
        message: 'Resume content is required'
      });
    }

    console.log('PDF Generation - Creating PDF document...');
    // Create a PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    // Add error handlers for the PDF document
    doc.on('error', (err) => {
      console.error('PDF Generation - Document Error:', err);
    });

    console.log('PDF Generation - Setting response headers...');
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=optimized-resume.pdf');

    // Add error handler for the response stream
    res.on('error', (err) => {
      console.error('PDF Generation - Response Stream Error:', err);
    });

    console.log('PDF Generation - Piping document to response...');
    // Pipe the PDF document to the response
    doc.pipe(res);

    if (sections && Array.isArray(sections)) {
      console.log('PDF Generation - Processing sections...');
      // Use structured sections for better formatting
      sections.forEach((section: any, index: number) => {
        console.log(`PDF Generation - Processing section ${index + 1}/${sections.length}:`, {
          id: section.id,
          hasTitle: !!section.title,
          contentLength: section.content?.length
        });

        try {
          // Format content based on section type
          if (section.id === 'header') {
            // Contact info formatting
            doc.font('Helvetica').fontSize(11).text(section.content);
            
            // Add professional separator after contact info
            doc.moveDown(0.5)
               .lineWidth(1)
               .strokeColor('#cccccc')
               .lineCap('butt')
               .moveTo(50, doc.y)
               .lineTo(545, doc.y)
               .stroke()
               .moveDown(1);
          } 
          else {
            // Add section title if it exists and is not "RESUME"
            if (section.title && section.title.toLowerCase() !== 'resume') {
          doc
            .font('Helvetica-Bold')
            .fontSize(14)
            .text(section.title)
            .moveDown(0.5);
        }

            if (section.id === 'experience' || section.id === 'projects') {
          // Experience sections with bullet points
          const lines = section.content.split('\n');
          
          lines.forEach((line: string) => {
            if (line.includes('|')) {
              // This is a job title/company line
              doc.font('Helvetica-Bold').fontSize(12).text(line);
            } else if (line.startsWith('•')) {
              // This is a bullet point
              doc.font('Helvetica').fontSize(11).text(line, { indent: 15 });
            } else if (line.trim() === '') {
              // Empty line for spacing
              doc.moveDown(0.5);
            } else {
              // Regular text
              doc.font('Helvetica').fontSize(11).text(line);
            }
          });
        } 
        else if (section.id === 'skills') {
          // Skills section with categories
          const lines = section.content.split('\n');
          lines.forEach((line: string) => {
            if (line.includes(':')) {
              const [category, skills] = line.split(':');
              doc.font('Helvetica-Bold').fontSize(11).text(category + ':', { continued: true });
              doc.font('Helvetica').text(skills);
            } else {
              doc.fontSize(11).text(line);
            }
          });
        } 
        else {
          // Default formatting for other sections
          doc.fontSize(11).text(section.content || '');
        }
        
        doc.moveDown(1.5);
          }
        } catch (sectionError) {
          console.error(`PDF Generation - Error processing section ${section.id}:`, sectionError);
          throw sectionError;
        }
      });
    } else if (resume) {
      // Fallback to simple text formatting if no structured sections
      const textSections = resume.split('\n\n');
      textSections.forEach((section: string) => {
        if (section.trim()) {
          doc
            .fontSize(12)
            .text(section.trim())
            .moveDown();
        }
      });
    }

    console.log('PDF Generation - Finalizing document...');
    // Finalize the PDF
    doc.end();
    
    console.log('PDF Generation - Complete');
  } catch (error) {
    console.error('PDF Generation - Fatal Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// New controller function for improving individual resume sections
export const improveSectionWithAI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sectionId, sectionType, sectionTitle, content, analysis } = req.body;

    if (!sectionId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Section ID and content are required'
      });
    }

    // Don't allow AI to modify personal information
    if (sectionId === 'header') {
      return res.status(400).json({
        success: false,
        message: 'Personal information cannot be modified by AI'
      });
    }

    console.log(`Improving section: ${sectionTitle} (${sectionId})`);

    // In a real implementation, this would use OpenAI to generate improved content
    // based on the section type and content
    let improvedContent = content;
    
    // Apply different improvement strategies based on section type
    if (sectionType === 'summary') {
      // Make summary more concise and impactful
      improvedContent = await generateOptimizedSection(
        'summary',
        content,
        'Rewrite this summary to be more concise, engaging, and results-driven. ' +
        'Focus on achievements and metrics where possible. ' +
        'Keep all factual details intact. Do not invent new experiences or skills. ' +
        'Use strong action verbs and quantify achievements where possible.'
      );
    } else if (sectionType === 'experience' || sectionType === 'projects') {
      // Improve experience with action verbs and measurable results
      improvedContent = await generateOptimizedSection(
        'experience',
        content,
        'Enhance clarity, action verbs, and achievements in this section. ' +
        'Do not add fake experience or change company names, job titles, or dates. ' +
        'Highlight achievements with metrics where possible. ' +
        'Use bullet points if needed. ' +
        'Make the language more impactful while preserving all factual information.'
      );
    } else if (sectionType === 'skills') {
      // Organize skills properly and ensure industry-standard terms
      improvedContent = await generateOptimizedSection(
        'skills',
        content,
        'Reorganize the skills section, removing redundancy, ensuring proper industry-standard terms. ' +
        'Group similar skills into categories. ' +
        'Do not add new skills that are not mentioned in the original content. ' +
        'Maintain all the actual skills but improve the presentation and organization.'
      );
    } else if (sectionType === 'education') {
      // Minimal improvements to education section
      improvedContent = await generateOptimizedSection(
        'education',
        content,
        'Improve formatting and clarity without altering real credentials. ' +
        'Do not change any degrees, institutions, dates, or GPAs. ' +
        'Only enhance the presentation and structure of the information.'
      );
    } else {
      // Generic improvement for other section types
      improvedContent = await generateOptimizedSection(
        sectionTitle.toLowerCase(),
        content,
        'Improve this section while maintaining all factual information. ' +
        'Enhance clarity, conciseness, and impact. ' +
        'Do not add fictional details or change any personal information.'
      );
    }

    // Calculate improvement metrics
    const improvementMetrics = {
      originalLength: content.length,
      improvedLength: improvedContent.length,
      changePercentage: Math.round((improvedContent.length - content.length) / content.length * 100),
      improvementAreas: getImprovementAreas(sectionType),
      originalContent: content // Include the original content for comparison
    };

    res.status(200).json({
      success: true,
      data: {
        content: improvedContent,
        metrics: improvementMetrics
      }
    });
  } catch (error) {
    console.error('Error improving section:', error);
    res.status(500).json({
      success: false,
      message: 'Error improving section',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to get improvement areas based on section type
function getImprovementAreas(sectionType: string | undefined): string[] {
  switch (sectionType) {
    case 'summary':
      return ['clarity', 'conciseness', 'impact'];
    case 'experience':
      return ['action verbs', 'metrics', 'achievements'];
    case 'skills':
      return ['organization', 'relevance', 'specificity'];
    case 'education':
      return ['formatting', 'presentation'];
    case 'projects':
      return ['technical details', 'outcomes', 'impact'];
    default:
      return ['clarity', 'impact'];
  }
}