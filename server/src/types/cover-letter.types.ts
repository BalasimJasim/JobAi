export interface GenerateCoverLetterRequest {
  jobDescription: string;
  keyPoints: string[];
  companyName?: string;
  position?: string;
}

export interface CoverLetterMetadata {
  jobDescription: string;
  keyPoints: string[];
  companyName: string;
  position: string;
  createdAt: string;
}

export interface CoverLetterResponse {
  id: string;
  content: string;
  metadata: CoverLetterMetadata;
}

export interface GenerateCoverLetterResponse {
  success: boolean;
  message: string;
  data: {
    coverLetter: CoverLetterResponse;
  };
} 