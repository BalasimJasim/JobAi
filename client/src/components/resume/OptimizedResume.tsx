/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  Download, Copy, Edit2, X, FileText, Award, Wand2, RotateCcw, 
  Save, CheckCircle, AlertCircle, ArrowRight, Sparkles, ChevronRight,
  Info, Shield, ShieldAlert, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EditableResumeSection } from './EditableResumeSection';

// Define types for the resume data structure
interface ResumeSection {
  id: string;
  title: string;
  content: string;
  type?: string;
  metadata?: {
    [key: string]: unknown;
    improvementAreas?: string[];
    factualWarning?: boolean;
  };
  isEditing?: boolean;
  isImproving?: boolean;
  originalContent?: string;
  aiImproved?: boolean;
  lastEditTime?: number;
}

interface ResumeMetadata {
  generationTime: string;
  improvementScore: number;
  keywordOptimization: string;
  readabilityScore: string;
  contextualMetadata?: {
    industryRelevance: number;
    careerLevelAppropriate: boolean;
    roleAlignment: number;
    companyFit?: number;
  };
}

interface FactualAccuracy {
  isFactuallyAccurate: boolean;
  modifiedEntityCount: number;
  missingEntityCount: number;
}

interface OptimizedResume {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    type?: string;
  }>;
  optimizedText: string;
}

interface ContextualInfo {
  industryContext?: string;
  careerLevel?: string;
  targetRole?: string;
  targetCompany?: string;
}

interface OptimizedResumeProps {
  originalAnalysis: {
    score: number;
    feedback: Array<{
      section: string;
      message: string;
      suggestion: string;
      severity: string;
    }>;
    aiSuggestions: string[];
    keywordMatch: {
      found: string[];
      missing: string[];
      score: number;
    };
    resumeText: string;
  };
  onClose: () => void;
}

// Add new interfaces for step tracking
interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function OptimizedResume({ originalAnalysis, onClose }: OptimizedResumeProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [resumeSections, setResumeSections] = useState<ResumeSection[]>([]);
  const [optimizedResume, setOptimizedResume] = useState<OptimizedResume | null>(null);
  const [resumeMetadata, setResumeMetadata] = useState<ResumeMetadata | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("preview");
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationAreaRef = useRef<HTMLDivElement>(null);
  const resultAreaRef = useRef<HTMLDivElement>(null);
  const editSectionRef = useRef<HTMLDivElement>(null);
  const [factualAccuracy, setFactualAccuracy] = useState<FactualAccuracy | null>(null);
  const [contextualInfo, setContextualInfo] = useState<ContextualInfo>({});
  const [showContextForm, setShowContextForm] = useState(false);
  const [contextForm, setContextForm] = useState({
    industryContext: '',
    careerLevel: '',
    targetRole: '',
    targetCompany: '',
    jobDescription: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<number>(1);
  
  // Define steps
  const steps: Step[] = [
    {
      id: 1,
      title: "Analysis",
      description: "Analyzing your resume",
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 2,
      title: "Context",
      description: "Providing job context",
      icon: <Info className="h-5 w-5" />
    },
    {
      id: 3,
      title: "Optimization",
      description: "Enhancing your resume",
      icon: <Sparkles className="h-5 w-5" />
    }
  ];

  useEffect(() => {
    if (originalAnalysis.resumeText) {
      localStorage.setItem('resumeText', originalAnalysis.resumeText);
    }
  }, [originalAnalysis.resumeText]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current);
      }
    };
  }, []);

  // Add animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideInUp {
        from { 
          opacity: 0;
          transform: translateY(30px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes shimmer {
        0% { background-position: -1000px 0; }
        100% { background-position: 1000px 0; }
      }

      .loading-shimmer {
        background: linear-gradient(to right, #f6f7f8 8%, #edeef1 18%, #f6f7f8 33%);
        background-size: 2000px 100%;
        animation: shimmer 2s infinite linear;
      }

      .animate-slide-in-up {
        animation: slideInUp 0.6s ease-out forwards;
      }

      .animate-fade-in {
        animation: fadeIn 0.4s ease-out forwards;
      }

      @media (max-width: 768px) {
        .resume-container {
          padding: 1rem;
        }
        
        .section-title {
          font-size: 1.25rem;
        }
        
        .section-content {
          font-size: 0.875rem;
        }
      }

      @media (max-width: 480px) {
        .resume-container {
          padding: 0.5rem;
        }
        
        .section-title {
          font-size: 1.125rem;
        }
        
        .section-content {
          font-size: 0.75rem;
        }
      }

      .progress-bar {
        height: 4px;
        background-color: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
      }

      .progress-bar-fill {
        height: 100%;
        background-color: #3b82f6;
        transition: width 0.3s ease-in-out;
      }

      .section-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .section-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }

      .button-primary {
        transition: all 0.2s ease;
      }

      .button-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .button-primary:active {
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add loading states
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + 10;
          return next > 90 ? 90 : next;
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
    }
  }, [isLoading]);

  // Add useEffect for syncing optimizedResume to resumeSections
  useEffect(() => {
    if (optimizedResume?.sections) {
      setResumeSections(optimizedResume.sections.map(s => ({
        ...s,
        id: s.id || `section-${Math.random().toString(36).substr(2, 9)}`,
        isEditing: false,
        originalContent: s.content,
        type: s.type || 'default'
      })));
    }
  }, [optimizedResume]);

  // Add step progress component
  const StepProgress = () => (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 relative">
            <div className={`flex flex-col items-center ${index === steps.length - 1 ? '' : 'relative'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep > step.id ? 'bg-green-500' : 
                currentStep === step.id ? 'bg-blue-600' : 'bg-gray-200'
              } transition-colors duration-200`}>
                <div className="text-white">{step.icon}</div>
              </div>
              <div className="text-xs mt-2 text-center font-medium">
                {step.title}
              </div>
              <div className="text-xs text-gray-500 text-center hidden sm:block">
                {step.description}
              </div>
              {index < steps.length - 1 && (
                <div className={`absolute top-5 left-1/2 w-full h-0.5 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                } transition-colors duration-200`} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Enhanced loading overlay with better visual feedback
  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="flex items-center space-x-4 mb-4">
          <div className="animate-spin">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{progressMessage || "Optimizing Your Resume"}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we enhance your resume...</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
          <div className="text-right text-sm text-gray-600 dark:text-gray-400">
            {loadingProgress}%
          </div>
        </div>
      </div>
    </div>
  );

  const generateOptimizedResume = async () => {
    try {
      setGenerationProgress(10);
      
      // Get the resume text from localStorage
      const resumeText = localStorage.getItem('resumeText') || '';
      
      // Get job description from localStorage
      const jobDescription = localStorage.getItem('jobDescription') || '';
      
      // Show toast for starting generation
      toast({
        title: 'Preparing to optimize your resume',
        description: 'Please provide some context for better results',
        duration: 3000,
      });
      
      setGenerationProgress(20);
      
      // Show context collection form
      setShowContextForm(true);
      
      // Wait for context collection to complete
      // This will be handled by the submitContext function
      
    } catch (error) {
      console.error('Error preparing for resume optimization:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to prepare for resume optimization',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const submitContext = async () => {
    try {
      console.log('=== DEBUG: Starting submitContext ===');
      setIsSubmitting(true);
      setError(null);

      // Get all cookies for debugging
      const allCookies = document.cookie.split(';');
      console.log('All cookies:', allCookies.join(', '));

      // Check authentication status
      console.log('Checking authentication status...');
      let isAuthenticated = await checkAuthStatus();
      console.log('Initial authentication status:', isAuthenticated);

      if (!isAuthenticated) {
        console.log('Not authenticated, attempting to refresh token...');
        isAuthenticated = await refreshAuthToken();
        console.log('Authentication status after refresh:', isAuthenticated);
        
        if (!isAuthenticated) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to optimize your resume.',
            variant: 'destructive',
            duration: 5000
          });
          throw new Error('Authentication failed. Please log in again.');
        }
      }

      // Get fresh CSRF token after authentication
      const csrfToken = getCsrfToken();
      console.log('CSRF Token:', csrfToken);

      // Log form data for debugging
      console.log('Context form data:', contextForm);

      // Validate form data
      if (!contextForm.industryContext || !contextForm.careerLevel || !contextForm.targetRole) {
        throw new Error('Please fill in all required fields');
      }

      // Ensure we have the resume text
      if (!originalAnalysis.resumeText) {
        throw new Error('Resume text is missing');
      }

      // Get access token from cookies
      const accessToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      console.log('Sending optimization request...');
      const response = await fetch('/api/resumes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken || '',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          resumeText: originalAnalysis.resumeText,
          jobDescription: contextForm.jobDescription,
          industryContext: contextForm.industryContext,
          careerLevel: contextForm.careerLevel,
          targetRole: contextForm.targetRole,
          targetCompany: contextForm.targetCompany || ''
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error response data:', errorData);
        
        if (response.status === 401) {
          // Try one more time with token refresh
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            // Retry the request with new token
            return submitContext();
          }
          
          // If refresh failed, show login required toast
          toast({
            title: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            variant: 'destructive',
            duration: 5000
          });
          
          throw new Error('Authentication failed. Please log in again.');
        }
        
        throw new Error(errorData.error || 'Failed to generate optimized resume');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to optimize resume');
      }

      setOptimizedResume(data.resume);
      setShowContextForm(false);
      
      // Show success toast
      toast({
        title: 'Success',
        description: 'Your resume has been optimized successfully!',
        duration: 3000
      });

    } catch (error) {
      console.error('Error generating optimized resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to optimize resume');
      
      // Show error toast
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to optimize resume',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken || ''
        }
      });

      console.log('Auth check response:', response.status);
      const data = await response.json();
      console.log('Auth check data:', data);

      return response.ok && data.authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  };

  const refreshAuthToken = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh auth token...');
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', errorText);
        return false;
      }

      const data = await response.json();
      console.log('Token refresh response:', data);

      return data.success === true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const getCsrfToken = (): string | null => {
    const cookies = document.cookie.split(';');
    const xsrfCookie = cookies.find(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
    if (xsrfCookie) {
      return decodeURIComponent(xsrfCookie.split('=')[1]);
    }
    return null;
  };

  // Add a function to handle context form input changes
  const handleContextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContextForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCopyFull = async () => {
    try {
      await navigator.clipboard.writeText(optimizedResume?.optimizedText || '');
      toast({
        title: 'Success',
        description: 'Resume copied to clipboard',
        variant: 'default',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to copy resume: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      if (!optimizedResume) {
        console.error('PDF Download - Error: No optimized resume data available');
        throw new Error('No optimized resume available');
      }

      // Log the structure of optimizedResume
      console.log('PDF Download - Resume Structure:', {
        hasSections: !!optimizedResume.sections,
        sectionsCount: optimizedResume.sections?.length,
        sectionIds: optimizedResume.sections?.map(s => s.id),
        hasOptimizedText: !!optimizedResume.optimizedText,
        optimizedTextLength: optimizedResume.optimizedText?.length
      });

      setIsDownloading(true);
      
      const csrfToken = getCsrfToken();
      console.log('PDF Download - CSRF Token:', csrfToken ? 'Present' : 'Missing');
      
      // Show loading toast
      toast({
        title: 'Preparing PDF',
        description: 'Your resume is being prepared for download...',
        duration: 3000,
      });

      const downloadEndpoint = '/api/resumes/download';
      console.log('PDF Download - Endpoint URL:', downloadEndpoint);
      console.log('PDF Download - Request payload:', {
        sections: optimizedResume.sections.length,
        resumeLength: optimizedResume.optimizedText.length
      });

      console.log('PDF Download - Sending request to server...');
      const response = await fetch(downloadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          sections: optimizedResume.sections,
          resume: optimizedResume.optimizedText
        })
      });

      console.log('PDF Download - Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        // Try to get error details
        const errorText = await response.text();
        console.error('PDF Download - Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error('Failed to generate PDF');
      }

      // Log blob details
      const blob = await response.blob();
      console.log('PDF Download - Blob:', {
        size: blob.size,
        type: blob.type
      });
      
      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-resume.pdf';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success toast
      toast({
        title: 'Success',
        description: 'Your resume has been downloaded successfully!',
        duration: 3000,
      });
    } catch (error) {
      console.error('PDF Download - Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download resume. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleSectionEdit = (index: number) => {
    setResumeSections(sections =>
      sections.map((section, i) =>
        i === index ? { 
          ...section, 
          isEditing: !section.isEditing,
          originalContent: !section.isEditing ? section.content : section.originalContent
        } : section
      )
    );

    // Scroll to the edit section after a brief delay
    if (!resumeSections[index].isEditing) {
      setTimeout(() => {
        editSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 100);
    }
  };

  const handleSectionChange = (index: number, content: string) => {
    // Update the section content immediately for responsive UI
    setResumeSections(sections =>
      sections.map((section, i) =>
        i === index ? { ...section, content } : section
      )
    );
    
    // Clear any existing timeout
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current);
    }
    
    // Set a new timeout for auto-save
    editTimeoutRef.current = setTimeout(() => {
      updateSection(index, content);
    }, 3000); // Auto-save after 3 seconds of inactivity
  };

  const updateSection = (index: number, content: string) => {
    setResumeSections(sections =>
      sections.map((section, i) =>
        i === index ? { 
          ...section, 
          content, 
          isEditing: false,
          lastEditTime: Date.now()
        } : section
      )
    );
    
    // Update the full resume text
    setOptimizedResume(prevResume => {
      if (!prevResume) return null;
      
      const updatedSections = prevResume.sections.map((section, i) => 
        i === index ? { ...section, content } : section
      );
      
      return {
        sections: updatedSections,
        optimizedText: updatedSections
          .map(section => `${section.title}\n\n${section.content}`)
          .join('\n\n')
      };
    });
    
    toast({
      title: 'Saved',
      description: 'Your changes have been saved',
      duration: 2000,
    });
  };

  const improveSectionWithAI = async (index: number) => {
    try {
      const section = resumeSections[index];
      if (!section || !section.id || !section.content) {
        toast({
          title: 'Error',
          description: 'Invalid section data. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Don't improve if it's a personal information section
      if (section.title.toLowerCase() === 'resume') {
        toast({
          title: 'Cannot Improve',
          description: 'Personal information section cannot be modified by AI',
          variant: 'destructive',
        });
        return;
      }
      
      setResumeSections(sections =>
        sections.map((s, i) =>
          i === index ? { ...s, isImproving: true } : s
        )
      );
      
      // Get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf', {
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      
      const { csrfToken } = await csrfResponse.json();

      // Create request payload with required fields
      const requestPayload = {
        sectionId: section.id,
        sectionType: section.type || 'default',
        sectionTitle: section.title,
        content: section.content,
        context: {
          industryContext: contextForm.industryContext || '',
          careerLevel: contextForm.careerLevel || '',
          targetRole: contextForm.targetRole || '',
          targetCompany: contextForm.targetCompany || ''
        },
        analysis: originalAnalysis
      };
      
      console.log('Improve section payload:', requestPayload);
      
      // Call the API to improve the section
      const response = await fetch('/api/resumes/improve-section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken })
        },
        credentials: 'include',
        body: JSON.stringify(requestPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Improve section error:', errorData);
        throw new Error(errorData.message || 'Failed to improve section');
      }
      
      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to improve section');
      }
      
      // Get the improved content and metrics from the response
      const improvedContent = responseData.data?.content || '';
      const metrics = responseData.data?.metrics || {};
      
      // If the content is the same or empty, show an error
      if (!improvedContent || improvedContent === section.content) {
        throw new Error('AI could not improve this section. Please try again.');
      }
      
      // Update the section with improved content
      setResumeSections(sections =>
        sections.map((s, i) =>
          i === index ? { 
            ...s, 
            content: improvedContent, 
            isImproving: false,
            aiImproved: true,
            originalContent: section.content, // Store original content for revert
            lastEditTime: Date.now(),
            improvementMetrics: metrics
          } : s
        )
      );
      
      // Update the full resume text
      updateFullResumeText();
      
      toast({
        title: 'Section Improved',
        description: `AI has enhanced this section with focus on ${metrics.improvementAreas?.join(', ') || 'clarity and impact'}`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Improve section error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to improve section: ${errorMessage}`,
        variant: 'destructive',
      });
      
      // Reset the improving state
      setResumeSections(sections =>
        sections.map((s, i) =>
          i === index ? { ...s, isImproving: false } : s
        )
      );
    }
  };
  
  const revertAIChanges = (index: number) => {
    const section = resumeSections[index];
    if (!section.originalContent) return;
    
    setResumeSections(sections =>
      sections.map((s, i) =>
        i === index ? { 
          ...s, 
          content: s.originalContent || s.content, 
          aiImproved: false,
          lastEditTime: Date.now()
        } : s
      )
    );
    
    // Update the full resume text
    updateFullResumeText();
    
    toast({
      title: 'Changes Reverted',
      description: 'Section has been restored to its previous state',
      variant: 'default',
    });
  };
  
  const updateFullResumeText = () => {
    if (!optimizedResume || !resumeSections.length) return;

    const updatedResume: OptimizedResume = {
      sections: resumeSections.map(section => ({
        id: section.id,
        title: section.title,
        content: section.content
      })),
      optimizedText: resumeSections
        .map(section => `${section.title}\n\n${section.content}`)
        .join('\n\n')
    };

    setOptimizedResume(updatedResume);

    toast({
      title: 'Saved',
      description: 'Resume content has been updated',
      duration: 3000,
    });
  };

  // Helper function to render improvement areas as badges
  const renderImprovementAreas = (areas?: string[]) => {
    if (!areas || areas.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {areas.map((area, index) => (
          <Badge key={index} variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            {area}
          </Badge>
        ))}
      </div>
    );
  };

  // Render factual accuracy information
  const renderFactualAccuracyInfo = () => {
    if (!factualAccuracy) return null;
    
    const { isFactuallyAccurate, modifiedEntityCount, missingEntityCount } = factualAccuracy;
    
    let icon = <ShieldCheck className="h-5 w-5 text-green-500" />;
    let label = "High Factual Accuracy";
    let description = "All critical information has been preserved.";
    let color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    
    if (missingEntityCount > 0) {
      icon = <ShieldAlert className="h-5 w-5 text-red-500" />;
      label = "Low Factual Accuracy";
      description = `${missingEntityCount} critical details may have been lost.`;
      color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    } else if (modifiedEntityCount > 0) {
      icon = <Shield className="h-5 w-5 text-yellow-500" />;
      label = "Medium Factual Accuracy";
      description = `${modifiedEntityCount} details may have been modified.`;
      color = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    
    return (
      <div className={`rounded-lg p-3 mb-4 ${color} flex items-start gap-3`}>
        {icon}
        <div>
          <h4 className="font-medium">{label}</h4>
          <p className="text-sm">{description}</p>
          {(modifiedEntityCount > 0 || missingEntityCount > 0) && (
            <p className="text-sm mt-1">
              Please review the optimized content carefully and make any necessary corrections.
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render before/after comparison with factual accuracy indicators
  const renderBeforeAfter = (section: ResumeSection) => {
    if (!section.originalContent) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 mb-6">
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Original</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">This is the original content from your resume.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="whitespace-pre-wrap text-sm">{section.originalContent}</div>
        </div>
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400">Optimized</h4>
            <div className="flex items-center gap-2">
              {section.aiImproved && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">AI Enhanced</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">This content has been enhanced by AI while preserving factual information.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {section.metadata?.factualWarning && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-xs text-yellow-600 dark:text-yellow-400">Review Facts</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Some factual details may have been modified. Please review carefully.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
          <div className="whitespace-pre-wrap text-sm">{section.content}</div>
        </div>
      </div>
    );
  };

  // Add a new function to render contextual information
  const renderContextualInfo = () => {
    if (!resumeMetadata?.contextualMetadata) return null;
    
    const { industryRelevance, careerLevelAppropriate, roleAlignment, companyFit } = resumeMetadata.contextualMetadata;
    
    return (
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Contextual Optimization</h3>
        
        <div className="space-y-3">
          {contextualInfo.industryContext && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">Industry Relevance</div>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${industryRelevance * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{Math.round(industryRelevance * 100)}%</span>
              </div>
            </div>
          )}
          
          {contextualInfo.careerLevel && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">Career Level Appropriate</div>
              <div className="flex items-center">
                {careerLevelAppropriate ? (
                  <span className="text-green-500 flex items-center">
                    <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Appropriate for {contextualInfo.careerLevel} level
                  </span>
                ) : (
                  <span className="text-yellow-500 flex items-center">
                    <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    May need adjustment for {contextualInfo.careerLevel} level
                  </span>
                )}
              </div>
            </div>
          )}
          
          {contextualInfo.targetRole && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">Role Alignment</div>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${roleAlignment * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{Math.round(roleAlignment * 100)}%</span>
              </div>
            </div>
          )}
          
          {contextualInfo.targetCompany && companyFit !== undefined && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">Company Fit</div>
              <div className="flex items-center">
                <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ width: `${companyFit * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{Math.round(companyFit * 100)}%</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
          <p>This resume has been optimized specifically for your target context.</p>
          {contextualInfo.targetRole && <p>• Tailored for: <span className="font-medium">{contextualInfo.targetRole}</span></p>}
          {contextualInfo.industryContext && <p>• Industry: <span className="font-medium">{contextualInfo.industryContext}</span></p>}
          {contextualInfo.careerLevel && <p>• Career level: <span className="font-medium">{contextualInfo.careerLevel}</span></p>}
          {contextualInfo.targetCompany && <p>• Target company: <span className="font-medium">{contextualInfo.targetCompany}</span></p>}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-lg border-0">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Optimized Resume</CardTitle>
            <CardDescription className="text-blue-100">AI-enhanced for maximum impact</CardDescription>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-white/10 rounded-full text-sm mt-2 sm:mt-0">
            <CheckCircle className="h-4 w-4 text-green-300" />
            <span className="hidden sm:inline">Analysis Complete</span>
            <ChevronRight className="h-4 w-4" />
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span>Optimization {optimizedResume ? 'Complete' : 'In Progress'}</span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 text-white hover:bg-blue-700"
        >
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <StepProgress />
        <div className="space-y-6">
          {!optimizedResume && (
            <div ref={generationAreaRef} className="animate-fade-in">
              {showContextForm ? (
                <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                    Provide Context for Optimization
                  </h3>
                  
                  {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded animate-fade-in">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    setCurrentStep(3);
                    submitContext(); 
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="industryContext" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Industry
                      </label>
                      <select
                        id="industryContext"
                        name="industryContext"
                        value={contextForm.industryContext}
                        onChange={handleContextInputChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      >
                        <option value="">Select an industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Finance">Finance</option>
                        <option value="Education">Education</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Retail">Retail</option>
                        <option value="Marketing">Marketing & Advertising</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Entertainment">Entertainment & Media</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Construction">Construction</option>
                        <option value="Transportation">Transportation & Logistics</option>
                        <option value="Energy">Energy & Utilities</option>
                        <option value="Hospitality">Hospitality & Tourism</option>
                        <option value="Legal">Legal Services</option>
                        <option value="Government">Government</option>
                        <option value="Nonprofit">Nonprofit</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Telecommunications">Telecommunications</option>
                        <option value="Automotive">Automotive</option>
                        <option value="Aerospace">Aerospace & Defense</option>
                        <option value="Pharmaceutical">Pharmaceutical</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="careerLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Career Level
                      </label>
                      <select
                        id="careerLevel"
                        name="careerLevel"
                        value={contextForm.careerLevel}
                        onChange={handleContextInputChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                      >
                        <option value="">Select a career level</option>
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid Level">Mid Level</option>
                        <option value="Senior Level">Senior Level</option>
                        <option value="Executive">Executive</option>
                      </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="targetRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Role
                      </label>
                      <input
                        type="text"
                        id="targetRole"
                        name="targetRole"
                        value={contextForm.targetRole}
                        onChange={handleContextInputChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                          placeholder="e.g., Software Engineer"
                      />
                    </div>

                    <div>
                      <label htmlFor="targetCompany" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Company (Optional)
                      </label>
                      <input
                        type="text"
                        id="targetCompany"
                        name="targetCompany"
                        value={contextForm.targetCompany}
                        onChange={handleContextInputChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                          placeholder="e.g., Google"
                      />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Job Description (Optional)
                      </label>
                      <textarea
                        id="jobDescription"
                        name="jobDescription"
                        value={contextForm.jobDescription}
                        onChange={handleContextInputChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 min-h-[100px]"
                        placeholder="Paste the job description here"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowContextForm(false);
                          setCurrentStep(1);
                        }}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Optimizing...
                          </div>
                        ) : (
                          'Optimize Resume'
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    setCurrentStep(2);
                    generateOptimizedResume();
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </div>
                  ) : (
                    'Start Resume Optimization'
                  )}
                </Button>
              )}
            </div>
          )}
          
          {optimizedResume && (
            <div ref={resultAreaRef} className="p-4 sm:p-6 animate-fade-in">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Why optimize your resume?</h3>
                <ul className="list-disc pl-5 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>Improve your chances of getting past AI resume scanners</li>
                  <li>Highlight your most relevant skills and experiences</li>
                  <li>Ensure your resume is tailored to specific job opportunities</li>
                  <li>Enhance readability and professional presentation</li>
                </ul>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-2">Resume Analysis Score</h3>
                <div className="flex items-center mb-2">
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-full rounded-full ${getScoreColorClass(originalAnalysis.score)}`}
                      style={{ width: `${originalAnalysis.score}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                  {originalAnalysis.score.toFixed(0)}%
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
                {!resumeSections.length ? (
                  <div className="text-center py-8">
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Your optimized resume will appear here</p>
                  </div>
                ) : (
                  resumeSections.map((section, index) => (
                    <EditableResumeSection
                      key={section.id}
                      section={section}
                      index={index}
                      onEdit={handleSectionChange}
                      onImprove={improveSectionWithAI}
                      onRevert={revertAIChanges}
                      onToggleEdit={toggleSectionEdit}
                    />
                  ))
                )}
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button 
                  variant="outline"
                  onClick={handleDownloadPDF}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get score color class
function getScoreColorClass(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
} 