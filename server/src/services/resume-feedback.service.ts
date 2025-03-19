import { Types } from 'mongoose';
import { IResumeFeedback, ResumeFeedback, FeedbackSection, FeedbackSeverity } from '../models/resume-feedback.model';
import { analyzeResume as analyzeResumeWithAI, AIAnalysisResponse } from '../utils/openai';
import { ResumeEntityService, ExtractedResumeData, ResumeEntity } from './resume-entity.service';

interface SectionFeedback {
  section: string;
  severity: FeedbackSeverity;
  message: string;
  suggestion: string;
}

export class ResumeFeedbackService {
  private static async getNextVersion(resumeId: string): Promise<number> {
    const lastFeedback = await ResumeFeedback.findOne({ resumeId })
      .sort({ version: -1 })
      .limit(1);
    
    return lastFeedback ? lastFeedback.version + 1 : 1;
  }

  static async analyzeAndStoreFeedback(
    userId: Types.ObjectId,
    resumeId: string,
    resumeText: string,
    jobDescription: string
  ): Promise<IResumeFeedback> {
    try {
      // Get the next version number
      const version = await this.getNextVersion(resumeId);
      
      // Extract structured entities from the resume text
      const extractedData = await ResumeEntityService.extractEntities(resumeText);
      
      // Create a new feedback document with PENDING status
      const feedback = new ResumeFeedback({
        userId,
        resumeId,
        version,
        status: 'PENDING',
        score: 0,
        scoreBreakdown: {
          overall: 0,
          experience: 0,
          education: 0,
          skills: 0,
          achievements: 0,
          formatting: 0
        },
        feedback: [],
        aiSuggestions: [],
        keywordMatch: {
          found: [],
          missing: [],
          score: 0
        },
        // Store extracted entities for later verification
        metadata: {
          extractedEntities: extractedData.entities,
          extractedSections: extractedData.sections.map(s => ({
            id: s.id,
            type: s.type,
            title: s.title
          }))
        }
      });

      // Save the initial feedback document
      await feedback.save();

      try {
        // Analyze the resume with AI
        const aiAnalysis = await analyzeResumeWithAI(resumeText, jobDescription);
        
        // Update the feedback with AI analysis results
        feedback.status = 'COMPLETED';
        feedback.score = aiAnalysis.score;
        feedback.feedback = aiAnalysis.feedback;
        feedback.aiSuggestions = aiAnalysis.suggestions;
        feedback.keywordMatch = aiAnalysis.keywordAnalysis;
        
        // Calculate section scores based on feedback
        const sectionFeedback: { [key: string]: SectionFeedback[] } = {};
        
        for (const item of aiAnalysis.feedback) {
          const section = item.section.toUpperCase();
          if (!sectionFeedback[section]) {
            sectionFeedback[section] = [];
          }
          sectionFeedback[section].push(item as SectionFeedback);
        }
        
        // Calculate scores for each section
        const scoreBreakdown: { [key: string]: number } = { overall: aiAnalysis.score };
        
        for (const section in sectionFeedback) {
          scoreBreakdown[section.toLowerCase()] = this.calculateSectionScore(sectionFeedback[section]);
        }
        
        // Ensure the scoreBreakdown has the required 'overall' property
        feedback.scoreBreakdown = scoreBreakdown as { [key: string]: number; overall: number };
        
        // Save the updated feedback
        await feedback.save();
        
        return feedback;
      } catch (error) {
        // Update the feedback with error status
        feedback.status = 'FAILED';
        feedback.error = error instanceof Error ? error.message : String(error);
        await feedback.save();
        throw error;
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  }

  private static calculateSectionScore(sectionFeedback: SectionFeedback[]): number {
    // Implement scoring logic based on feedback severity and count
    const severityWeights = {
      CRITICAL: 1,
      WARNING: 0.5,
      SUGGESTION: 0.25
    };

    let score = 100;
    for (const item of sectionFeedback) {
      score -= severityWeights[item.severity] * 10;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private static determineSeverity(section: string, score: number): FeedbackSeverity {
    if (score < 60) return 'CRITICAL';
    if (score < 80) return 'WARNING';
    return 'SUGGESTION';
  }

  static async getFeedbackHistory(userId: Types.ObjectId): Promise<IResumeFeedback[]> {
    return ResumeFeedback.find({ userId }).sort({ version: -1 }).exec();
  }

  /**
   * Verify that optimized content preserves all critical entities
   */
  static async verifyOptimizedContent(
    resumeId: string,
    optimizedText: string
  ): Promise<{
    isFactuallyAccurate: boolean;
    missingEntities: ResumeEntity[];
    modifiedEntities: { original: ResumeEntity; modified: string }[];
  }> {
    try {
      // Get the latest feedback for this resume
      const feedback = await ResumeFeedback.findLatestByResumeId(resumeId);
      
      if (!feedback || !feedback.metadata || !feedback.metadata.extractedEntities) {
        throw new Error('No entity data found for this resume');
      }
      
      // Get the original entities
      const originalEntities = feedback.metadata.extractedEntities as ResumeEntity[];
      
      // Verify entity preservation
      const verificationResult = ResumeEntityService.verifyEntityPreservation(
        originalEntities,
        optimizedText
      );
      
      return {
        isFactuallyAccurate: verificationResult.preserved,
        missingEntities: verificationResult.missingEntities,
        modifiedEntities: verificationResult.modifiedEntities
      };
    } catch (error) {
      console.error('Error verifying optimized content:', error);
      throw error;
    }
  }
} 