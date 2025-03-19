import { Types } from 'mongoose';

export type ApplicationStatus = 
  | 'DRAFT'
  | 'APPLIED'
  | 'INTERVIEWING'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface JobApplication {
  id: string;
  userId: Types.ObjectId;
  position: string;
  company: string;
  jobDescription: string;
  status: ApplicationStatus;
  appliedDate: string;
  lastUpdated: string;
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

export interface CreateApplicationRequest {
  userId: Types.ObjectId;
  position: string;
  company: string;
  jobDescription: string;
  status?: ApplicationStatus;
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

export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  notes?: string;
  nextSteps?: string;
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  data: {
    application: JobApplication;
  };
}

export interface ApplicationsListResponse {
  success: boolean;
  message: string;
  data: {
    applications: JobApplication[];
    total: number;
    page?: number;
    limit?: number;
  };
} 