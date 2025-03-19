import mongoose, { Document, Schema, Types, Model } from 'mongoose';

// Define feedback section types
export type FeedbackSection = 'OVERALL' | 'EXPERIENCE' | 'EDUCATION' | 'SKILLS' | 'ACHIEVEMENTS' | 'FORMATTING';
export type FeedbackSeverity = 'SUGGESTION' | 'WARNING' | 'CRITICAL';
export type FeedbackStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

// Interface for feedback item
export interface IFeedbackItem {
  section: FeedbackSection;
  severity: FeedbackSeverity;
  message: string;
  suggestion: string;
  lineNumber?: number;
}

// Interface for score breakdown
export interface IScoreBreakdown {
  overall: number;
  experience: number;
  education: number;
  skills: number;
  achievements: number;
  formatting: number;
}

// Interface for ResumeFeedback document
export interface IResumeFeedback extends Document {
  userId: Types.ObjectId;
  resumeId: string;
  version: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  error?: string;
  score: number;
  scoreBreakdown: {
    overall: number;
    [key: string]: number; // Allow any section name as a key
  };
  feedback: Array<{
    section: string;  // No longer restricted to enum
    severity: FeedbackSeverity;
    message: string;
    suggestion: string;
  }>;
  aiSuggestions: string[];
  keywordMatch: {
    found: string[];
    missing: string[];
    score: number;
  };
  metadata?: {
    extractedEntities?: any[];
    extractedSections?: Array<{
      id: string;
      type: string;
      title: string;
    }>;
    [key: string]: any;
  };
}

// Interface for ResumeFeedback model static methods
interface IResumeFeedbackModel extends Model<IResumeFeedback> {
  findLatestByResumeId(resumeId: string): Promise<IResumeFeedback | null>;
  findByUserIdAndVersion(userId: Types.ObjectId, version: number): Promise<IResumeFeedback[]>;
}

// Create the schema
export enum ResumeSection {
  SUMMARY = 'SUMMARY',
  EXPERIENCE = 'EXPERIENCE',
  EDUCATION = 'EDUCATION',
  SKILLS = 'SKILLS',
  TECHNICAL_SKILLS = 'TECHNICAL_SKILLS',
  LANGUAGES = 'LANGUAGES',
  PROJECTS = 'PROJECTS',
  CERTIFICATIONS = 'CERTIFICATIONS',
  OTHER = 'OTHER'
}

const resumeFeedbackSchema = new Schema<IResumeFeedback>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  resumeId: {
    type: String,
    required: [true, 'Resume ID is required']
  },
  version: {
    type: Number,
    required: true,
    min: [1, 'Version must be at least 1']
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  error: {
    type: String,
    trim: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    validate: {
      validator: function(this: IResumeFeedback, value: number) {
        // Skip validation for PENDING status
        if (this.status === 'PENDING') return true;
        
        // For COMPLETED status, ensure score is set
        return typeof value === 'number' && value >= 0 && value <= 100;
      },
      message: 'Score must be between 0 and 100'
    }
  },
  scoreBreakdown: {
    overall: { 
      type: Number,
      min: 0,
      max: 100,
      validate: {
        validator: function(this: any, value: number) {
          // Skip validation for PENDING status
          if (this.parent().parent().status === 'PENDING') return true;
          return typeof value === 'number' && value >= 0 && value <= 100;
        },
        message: 'Overall score must be between 0 and 100'
      }
    },
    type: Schema.Types.Mixed
  },
  feedback: [{
    section: { type: String, required: true },
    severity: {
      type: String,
      enum: ['CRITICAL', 'WARNING', 'SUGGESTION'],
      required: true
    },
    message: { type: String, required: true },
    suggestion: { type: String, required: true }
  }],
  aiSuggestions: [String],
  keywordMatch: {
    found: [String],
    missing: [String],
    score: {
      type: Number,
      min: 0,
      max: 100,
      validate: {
        validator: function(this: any) {
          // Skip validation for PENDING status
          if (this.parent().parent().status === 'PENDING') return true;
          return true;
        }
      }
    }
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret.__v;
      return ret;
    }
  }
});

// Add indexes
resumeFeedbackSchema.index({ userId: 1, resumeId: 1, version: 1 });
resumeFeedbackSchema.index({ score: -1 });

// Add instance methods
resumeFeedbackSchema.methods.compareWithVersion = async function(
  version: number
): Promise<{ scoreDiff: number; improvements: string[]; regressions: string[]; }> {
  const previousFeedback = await this.model('ResumeFeedback').findOne({
    resumeId: this.resumeId,
    version: version,
    status: 'COMPLETED'
  });

  if (!previousFeedback) {
    throw new Error(`No completed feedback found for version ${version}`);
  }

  const scoreDiff = this.score - previousFeedback.score;
  const improvements: string[] = [];
  const regressions: string[] = [];

  // Compare section scores
  Object.entries(this.scoreBreakdown).forEach(([section, score]) => {
    if (section === 'overall') return;
    const prevScore = previousFeedback.scoreBreakdown[section as keyof IScoreBreakdown] as number;
    const diff = (score as number) - prevScore;
    if (diff > 0) {
      improvements.push(`${section} score improved by ${diff} points`);
    } else if (diff < 0) {
      regressions.push(`${section} score decreased by ${Math.abs(diff)} points`);
    }
  });

  return { scoreDiff, improvements, regressions };
};

// Add pre-save hook to validate overall score
resumeFeedbackSchema.pre('save', function(next) {
  // Skip validation for PENDING or FAILED status
  if (this.status !== 'COMPLETED') {
    next();
    return;
  }

  // Calculate average of section scores
  const {
    experience,
    education,
    skills,
    achievements,
    formatting
  } = this.scoreBreakdown;

  const calculatedScore = Math.round(
    (experience + education + skills + achievements + formatting) / 5
  );

  // Update overall score and score field
  this.scoreBreakdown.overall = calculatedScore;
  this.score = calculatedScore;

  next();
});

// Static method to find the latest feedback for a resume
resumeFeedbackSchema.statics.findLatestByResumeId = function(resumeId: string) {
  return this.findOne({ resumeId }).sort({ version: -1 }).exec();
};

// Static method to find feedback by user ID and version
resumeFeedbackSchema.statics.findByUserIdAndVersion = function(userId: Types.ObjectId, version: number) {
  return this.find({ userId, version }).exec();
};

// Create and export the model
export const ResumeFeedback = mongoose.model<IResumeFeedback, IResumeFeedbackModel>(
  'ResumeFeedback',
  resumeFeedbackSchema
); 