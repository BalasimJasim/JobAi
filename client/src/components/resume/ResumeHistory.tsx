'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Calendar, BarChart, ArrowRight } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Resume {
  _id: string;
  fileName: string;
  uploadDate: string;
  score?: number;
  status: string;
}

interface ResumeHistoryProps {
  onSelectResume: (resumeId: string) => void;
}

export function ResumeHistory({ onSelectResume }: ResumeHistoryProps) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (status === 'authenticated') {
      fetchResumes();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  const fetchResumes = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching resumes...');
      
      const response = await fetch('/api/resumes', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Fetch resumes error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch resumes');
      }
      
      const data = await response.json();
      console.log('Fetch resumes successful:', data);
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your resume history. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resume History</CardTitle>
          <CardDescription>
            Please log in to view your resume history
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={() => window.location.href = '/login'}>
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resume History</CardTitle>
          <CardDescription>
            You haven't uploaded any resumes yet
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-gray-500">
            Upload a resume to get started with AI-powered optimization
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume History</CardTitle>
        <CardDescription>
          Your previously uploaded resumes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {resumes.map((resume) => (
            <div
              key={resume._id}
              className="border rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
              onClick={() => onSelectResume(resume._id)}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-medium">{resume.fileName}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(resume.uploadDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {resume.score !== undefined && (
                    <div className="flex items-center">
                      <BarChart className="h-4 w-4 mr-1" />
                      <span className={`font-medium ${getScoreColor(resume.score)}`}>
                        {resume.score}%
                      </span>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-500 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectResume(resume._id);
                    }}
                  >
                    <span className="mr-1">View</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  resume.status === 'optimized' 
                    ? 'bg-green-100 text-green-800' 
                    : resume.status === 'processing' 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {resume.status === 'optimized' 
                    ? 'Optimized' 
                    : resume.status === 'processing' 
                    ? 'Processing'
                    : 'Uploaded'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 