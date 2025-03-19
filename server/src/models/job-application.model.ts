import mongoose, { Document, Schema, Model, Types } from 'mongoose';
import { ApplicationStatus } from '../types/application.types';

// Interface for JobApplication document
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
  updateStatus(status: ApplicationStatus, notes?: string): Promise<IJobApplication>;
}

// Interface for JobApplication model static methods
interface IJobApplicationModel extends Model<IJobApplication> {
  findByUserId(userId: Types.ObjectId): Promise<IJobApplication[]>;
  findByStatus(status: ApplicationStatus): Promise<IJobApplication[]>;
}

// Create the schema
const jobApplicationSchema = new Schema<IJobApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true,
    minlength: [2, 'Position must be at least 2 characters long'],
    maxlength: [100, 'Position cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    minlength: [2, 'Company name must be at least 2 characters long'],
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  jobDescription: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [10, 'Job description must be at least 10 characters long']
  },
  status: {
    type: String,
    enum: {
      values: ['DRAFT', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      message: '{VALUE} is not a valid application status'
    },
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
  nextSteps: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  resumeId: {
    type: String
  },
  coverLetterId: {
    type: String
  },
  salary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3
    }
  },
  location: {
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    remote: {
      type: Boolean,
      default: false
    }
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
jobApplicationSchema.index({ userId: 1, status: 1 });
jobApplicationSchema.index({ company: 1 });
jobApplicationSchema.index({ appliedDate: -1 });

// Add instance methods
jobApplicationSchema.methods.updateStatus = async function(
  status: ApplicationStatus,
  notes?: string
): Promise<IJobApplication> {
  this.status = status;
  this.lastUpdated = new Date();
  if (notes) {
    this.notes = notes;
  }
  return this.save();
};

// Add static methods
jobApplicationSchema.statics.findByUserId = function(
  userId: Types.ObjectId
): Promise<IJobApplication[]> {
  return this.find({ userId }).sort({ appliedDate: -1 });
};

jobApplicationSchema.statics.findByStatus = function(
  status: ApplicationStatus
): Promise<IJobApplication[]> {
  return this.find({ status }).sort({ appliedDate: -1 });
};

// Add middleware
jobApplicationSchema.pre('save', function(next) {
  if (this.isModified('salary.min') || this.isModified('salary.max')) {
    const { min, max } = this.salary || {};
    if (min && max && min > max) {
      next(new Error('Minimum salary cannot be greater than maximum salary'));
    }
  }
  next();
});

// Create and export the model
export const JobApplication = mongoose.model<IJobApplication, IJobApplicationModel>(
  'JobApplication',
  jobApplicationSchema
); 