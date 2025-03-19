'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ResumeUploader } from '@/components/resume/ResumeUploader';
import { ResumeAnalysis } from '@/components/resume/ResumeAnalysis';
import { ResumeHistory } from '@/components/resume/ResumeHistory';

// Define types for the analysis data
interface KeywordMatch {
  keyword: string;
  found: boolean;
}

interface FeedbackItem {
  text: string;
  severity: 'high' | 'medium' | 'low';
}

interface SectionFeedback {
  section: string;
  score: number;
  feedback: FeedbackItem[];
}

interface AiSuggestion {
  original?: string;
  suggestion: string;
  explanation: string;
}

interface AnalysisData {
  status: string;
  score: number;
  feedback: SectionFeedback[];
  suggestions: AiSuggestion[];
  keywordMatches: KeywordMatch[];
  [key: string]: unknown; // Allow for additional properties
}

export default function ResumePage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalysisComplete = (data: any) => {
    console.log('Analysis data received:', data);
    // Make sure we're passing the feedback data correctly
    setAnalysisData(data);
  };

  const handleSelectResume = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    setActiveTab('upload'); // Switch to upload tab to show analysis
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resume Builder</h1>
        <p className="text-gray-600 dark:text-gray-300">Create and optimize your resume with AI assistance</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Upload & Analyze
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Resume History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'upload' && (
          <div>
            <ResumeUploader onAnalysisComplete={handleAnalysisComplete} selectedResumeId={selectedResumeId} />
            {analysisData && <ResumeAnalysis data={analysisData} />}
          </div>
        )}
        {activeTab === 'history' && (
          <ResumeHistory onSelectResume={handleSelectResume} />
        )}
      </div>
    </DashboardLayout>
  );
} 