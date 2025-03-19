import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  userId: string;
  jobTitle: string;
  company: string;
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';
  dateApplied: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  nextStep?: string;
  lastContactDate?: string;
  resumeId?: string;
  coverLetterId?: string;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  jobTitle: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['saved', 'applied', 'interview', 'offer', 'rejected'],
    default: 'saved',
  },
  dateApplied: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  notes: String,
  nextStep: String,
  lastContactDate: String,
  resumeId: String,
  coverLetterId: String,
  url: String,
}, {
  timestamps: true,
});

// Only create the model if it doesn't exist and we're on the server
const ApplicationModel = mongoose.models.Application || mongoose.model<IApplication>('Application', applicationSchema);

export { ApplicationModel }; 