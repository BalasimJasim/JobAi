import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import debounce from 'lodash/debounce';
import { toast } from 'sonner';

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

interface UseCoverLetterProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
}

export function useCoverLetter({ initialContent = '', onSave }: UseCoverLetterProps) {
  const [content, setContent] = useState(initialContent);
  const [previousVersions, setPreviousVersions] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { data: session, status } = useSession();

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (newContent: string) => {
      if (!session) {
        toast.error('You must be logged in to save your cover letter');
        return;
      }

      if (onSave) {
        try {
          await onSave(newContent);
          toast.success('Cover letter saved');
        } catch (error) {
          toast.error('Failed to save cover letter');
          console.error('Error saving cover letter:', error);
        }
      }
    }, 1000),
    [onSave, session]
  );

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setIsEditing(true);
    debouncedSave(newContent);
  }, [debouncedSave]);

  const handleEnhance = useCallback(async (context: CoverLetterContext) => {
    try {
      if (status !== 'authenticated') {
        throw new Error('You must be logged in to enhance your cover letter');
      }

      setIsEnhancing(true);
      // Save current version to history before enhancing
      setPreviousVersions(prev => [content, ...(prev.slice(0, 1))]);
      
      // Call enhance API endpoint with context
      const response = await fetch('/api/cover-letter/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include credentials for session cookies
        body: JSON.stringify({
          content,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to enhance cover letter');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to enhance cover letter');
      }

      setContent(data.content);
      toast.success('Cover letter enhanced successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to enhance cover letter';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsEnhancing(false);
    }
  }, [content, status]);

  const handleUndo = useCallback(() => {
    if (previousVersions.length > 0) {
      const [lastVersion, ...remainingVersions] = previousVersions;
      setContent(lastVersion);
      setPreviousVersions(remainingVersions);
      debouncedSave(lastVersion);
      toast.info('Changes undone');
    }
  }, [previousVersions, debouncedSave]);

  // Cleanup debounced save on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    content,
    isEditing,
    isEnhancing,
    previousVersions,
    handleContentChange,
    handleEnhance,
    handleUndo,
    canUndo: previousVersions.length > 0,
    isAuthenticated: status === 'authenticated'
  };
} 