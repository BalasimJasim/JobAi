import { Schema, model, Document, Types } from 'mongoose';

export interface ICoverLetter extends Document<Types.ObjectId> {
  userId: Types.ObjectId;
  content: string;
  jobTitle?: string;
  company?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  isEnhanced: boolean;
}

const coverLetterSchema = new Schema<ICoverLetter>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    jobTitle: {
      type: String,
    },
    company: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
    },
    isEnhanced: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const CoverLetter = model<ICoverLetter>('CoverLetter', coverLetterSchema); 