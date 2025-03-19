import { Schema, model, Document, Model, Types } from 'mongoose';
import { ApplicationStatus } from '../types/application.types';

export interface IJobApplication extends Document {
  userId: Types.ObjectId;
  position: string;
  company: string;
  jobDescription: string;
  status: ApplicationStatus;
  appliedDate: Date;
  lastUpdated: Date;
  nextSteps?: string;
  notes?: string;
  resumeId?: string;
  coverLetterId?: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  location?: {
    city?: string;
    state?: string;
    country?: string;
    remote?: boolean;
  };
}

interface IJobApplicationModel extends Model<IJobApplication> {
  findByUserId(userId: Types.ObjectId): Promise<IJobApplication[]>;
  findByStatus(status: ApplicationStatus): Promise<IJobApplication[]>;
}

const applicationSchema = new Schema<IJobApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  position: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
    default: 'DRAFT'
  },
  appliedDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  nextSteps: String,
  notes: String,
  resumeId: String,
  coverLetterId: String,
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  location: {
    city: String,
    state: String,
    country: String,
    remote: Boolean
  }
}, {
  timestamps: true
});

// Add indexes
applicationSchema.index({ userId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ company: 1 });

// Static methods
applicationSchema.statics.findByUserId = function(userId: Types.ObjectId): Promise<IJobApplication[]> {
  return this.find({ userId }).sort({ lastUpdated: -1 });
};

applicationSchema.statics.findByStatus = function(status: ApplicationStatus): Promise<IJobApplication[]> {
  return this.find({ status });
};

export const ApplicationModel = model<IJobApplication, IJobApplicationModel>('Application', applicationSchema); 