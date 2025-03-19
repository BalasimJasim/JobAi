'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

interface CoverLetterContext {
  jobDescription?: string;
  industryContext?: string;
  careerLevel?: string;
  targetRole?: string;
  targetCompany?: string;
  resumeScore?: number;
  keywordMatch?: {
    found: string[];
    missing: string[];
    score: number;
  };
}

interface CoverLetterSectionProps {
  content: string;
  context?: CoverLetterContext;
  onSave: (content: string) => void;
  onEnhance: (context: CoverLetterContext) => Promise<void>;
}

export function CoverLetterSection({ content, context, onSave, onEnhance }: CoverLetterSectionProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const { data: session, status } = useSession();

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    onSave(value);
  };

  const handleEnhance = async () => {
    try {
      if (status !== 'authenticated') {
        throw new Error('You must be logged in to enhance your cover letter');
      }

      if (!context?.jobDescription) {
        throw new Error('Job description is required to enhance your cover letter');
      }
      
      setIsEnhancing(true);
      await onEnhance(context);
    } catch (error) {
      // Error will be handled by the toast in the parent component
      throw error;
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Cover Letter Content
          </h3>
          {context?.targetRole && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Optimized for {context.targetRole} {context.targetCompany ? `at ${context.targetCompany}` : ''}
            </p>
          )}
        </div>
        <Button
          onClick={handleEnhance}
          disabled={isEnhancing || !context?.jobDescription || status !== 'authenticated'}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isEnhancing ? (
            <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Enhance Cover Letter
        </Button>
      </div>

      {status !== 'authenticated' && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to enhance your cover letter.
          </AlertDescription>
        </Alert>
      )}

      {!context?.jobDescription && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            A job description is required to generate an optimized cover letter. Please provide one in the resume analysis step.
          </AlertDescription>
        </Alert>
      )}
      
      <Textarea
        value={localContent}
        onChange={(e) => handleContentChange(e.target.value)}
        className="min-h-[400px] w-full resize-y"
        placeholder={!session 
          ? "Please log in to generate and enhance your cover letter..."
          : context?.jobDescription 
          ? "Your cover letter will be optimized based on the provided job description and resume analysis..."
          : "Please provide a job description to generate an optimized cover letter..."
        }
        disabled={status !== 'authenticated'}
      />

      {context && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">Optimization Context</h4>
          <div className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
            {context.industryContext && <p>Industry: {context.industryContext}</p>}
            {context.careerLevel && <p>Career Level: {context.careerLevel}</p>}
            {context.keywordMatch && (
              <p>Keyword Match Score: {context.keywordMatch.score}%</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 