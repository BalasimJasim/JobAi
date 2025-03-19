'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { CoverLetterSection } from '@/components/cover-letter/CoverLetterSection';
import { useCoverLetter } from '@/hooks/useCoverLetter';
import { Button } from '@/components/ui/Button';
import { Loader2, FileText, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'sonner';

interface CoverLetterContext {
  jobDescription?: string;
  industryContext?: string;
  careerLevel?: string;
  targetRole?: string;
  targetCompany?: string;
}

export default function CoverLettersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<any>(null);
  
  const { 
    content, 
    handleContentChange, 
    handleEnhance 
  } = useCoverLetter({
    initialContent: selectedCoverLetter?.content || '',
    onSave: async (content) => {
      // Implement save functionality
      if (selectedCoverLetter) {
        // Update existing cover letter
        await saveCoverLetter(selectedCoverLetter.id, content);
      }
    }
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard/cover-letters');
    } else if (status === 'authenticated') {
      fetchCoverLetters();
    }
  }, [status, router]);

  const fetchCoverLetters = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cover-letters', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cover letters');
      }
      
      const data = await response.json();
      setCoverLetters(data);
      
      // Select the first cover letter if available
      if (data.length > 0 && !selectedCoverLetter) {
        setSelectedCoverLetter(data[0]);
      }
    } catch (error) {
      console.error('Error fetching cover letters:', error);
      toast.error('Failed to load your cover letters');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCoverLetter = async (id: string, content: string) => {
    try {
      const response = await fetch(`/api/cover-letters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save cover letter');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving cover letter:', error);
      throw error;
    }
  };

  const createNewCoverLetter = async () => {
    try {
      const response = await fetch('/api/cover-letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          title: 'New Cover Letter',
          content: ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create new cover letter');
      }
      
      const newCoverLetter = await response.json();
      setCoverLetters(prev => [newCoverLetter, ...prev]);
      setSelectedCoverLetter(newCoverLetter);
      toast.success('New cover letter created');
    } catch (error) {
      console.error('Error creating cover letter:', error);
      toast.error('Failed to create new cover letter');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cover Letters</h1>
          <p className="text-gray-600 dark:text-gray-300">Generate and manage your AI-powered cover letters</p>
        </div>
        <Button onClick={createNewCoverLetter} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          New Cover Letter
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Cover Letters</CardTitle>
            </CardHeader>
            <CardContent>
              {coverLetters.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No cover letters yet</p>
                  <Button 
                    onClick={createNewCoverLetter} 
                    variant="outline" 
                    className="mt-4"
                  >
                    Create your first cover letter
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {coverLetters.map(letter => (
                    <div 
                      key={letter.id}
                      className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                        selectedCoverLetter?.id === letter.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedCoverLetter(letter)}
                    >
                      <h3 className="font-medium">{letter.title || 'Untitled Cover Letter'}</h3>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {letter.content ? letter.content.substring(0, 60) + '...' : 'No content'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedCoverLetter ? (
            <CoverLetterSection
              content={selectedCoverLetter.content || ''}
              context={{
                jobDescription: selectedCoverLetter.jobDescription,
                targetRole: selectedCoverLetter.targetRole,
                targetCompany: selectedCoverLetter.targetCompany,
              }}
              onSave={handleContentChange}
              onEnhance={handleEnhance}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">No Cover Letter Selected</h3>
                <p className="text-gray-500 mb-6">
                  Select a cover letter from the list or create a new one
                </p>
                <Button onClick={createNewCoverLetter}>
                  Create New Cover Letter
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 