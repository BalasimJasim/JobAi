import mongoose, { Document, Schema, Types, Model } from 'mongoose';

// Interface for Resume document
export interface IResume extends Document {
  userId: Types.ObjectId;
  originalText: string;
  optimizedText: string;
  sections: Array<{
    title: string;
    content: string;
    metadata: any;
  }>;
  metadata: {
    generationTime: string;
    improvementScore: number;
    keywordOptimization: string;
    readabilityScore: string;
    contextualMetadata?: {
      industryRelevance: number;
      careerLevelAppropriate: boolean;
      roleAlignment: number;
      companyFit?: number;
    };
  };
  jobDescription?: string;
  industryContext?: string;
  careerLevel?: string;
  targetRole?: string;
  targetCompany?: string;
  extractedEntities?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Resume schema
const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    originalText: {
      type: String,
      required: true
    },
    optimizedText: {
      type: String,
      required: true
    },
    sections: [{
      title: String,
      content: String,
      metadata: Schema.Types.Mixed
    }],
    metadata: {
      generationTime: String,
      improvementScore: Number,
      keywordOptimization: String,
      readabilityScore: String,
      contextualMetadata: {
        industryRelevance: Number,
        careerLevelAppropriate: Boolean,
        roleAlignment: Number,
        companyFit: Number
      }
    },
    jobDescription: String,
    industryContext: String,
    careerLevel: String,
    targetRole: String,
    targetCompany: String,
    extractedEntities: Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// Static methods
interface ResumeModel extends Model<IResume> {
  findLatestByUserId(userId: Types.ObjectId): Promise<IResume | null>;
}

ResumeSchema.statics.findLatestByUserId = async function(userId: Types.ObjectId): Promise<IResume | null> {
  return this.findOne({ userId }).sort({ createdAt: -1 }).exec();
};

// Create and export the model
export const Resume = mongoose.model<IResume, ResumeModel>('Resume', ResumeSchema); 