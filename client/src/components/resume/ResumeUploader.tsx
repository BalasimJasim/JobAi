'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText, CheckCircle, AlertTriangle, Info, FileUp, X, ArrowRight, Sparkles } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ProgressTracker } from '@/components/ui/ProgressTracker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSession } from 'next-auth/react';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
}

// Define a type for the analysis data
type AnalysisData = {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
  feedback: string;
};

interface ResumeUploaderProps {
  onAnalysisComplete: (data: AnalysisData) => void;
  selectedResumeId: string | null;
}

export function ResumeUploader({ onAnalysisComplete, selectedResumeId }: ResumeUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string>('');
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (selectedResumeId) {
      fetchResumeAnalysis(selectedResumeId);
    }
  }, [selectedResumeId]);

  const extractTextFromPDF = async (pdfFile: File): Promise<string> => {
    try {
      setIsExtracting(true);
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to extract text from PDF. Please try again or upload a different file.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchResumeAnalysis = async (resumeId: string) => {
    try {
      setIsAnalyzing(true);
      setActiveTab("analyzing");
      
      const response = await fetch(`/api/resumes/${resumeId}/analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.analysis) {
        onAnalysisComplete(data.analysis);
        setActiveTab("results");
      } else {
        throw new Error('Invalid analysis data received');
      }
    } catch (error) {
      console.error('Error fetching resume analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resume analysis. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) {
      return;
    }
    
    // Check file type
    if (selectedFile.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      return;
    }
    
    // Check file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit');
      return;
    }
    
    setFile(selectedFile);
    
    try {
      // Extract text from PDF
      const text = await extractTextFromPDF(selectedFile);
      setExtractedText(text);
      
      // Set preview text (first 300 characters)
      setTextPreview(text.substring(0, 300) + (text.length > 300 ? '...' : ''));
      
      // Auto-advance to job description tab
      setActiveTab("job-description");
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !extractedText) {
        toast({
        title: 'Missing Information',
        description: 'Please upload a resume first',
          variant: 'destructive',
        });
        return;
      }
      
    if (status !== 'authenticated') {
        toast({
        title: 'Authentication Required',
        description: 'Please log in to analyze your resume',
          variant: 'destructive',
        });
        return;
      }
      
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setActiveTab("analyzing");
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('extractedText', extractedText);
      
      if (jobDescription) {
        formData.append('jobDescription', jobDescription);
      }
      
      // Upload the file
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.resumeId) {
        // Now analyze the resume
        const analysisResponse = await fetch(`/api/resumes/${data.resumeId}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobDescription }),
          credentials: 'include',
        });
        
        if (!analysisResponse.ok) {
          throw new Error(`Analysis failed: ${analysisResponse.status}`);
        }
        
        const analysisData = await analysisResponse.json();
        
        if (analysisData && analysisData.analysis) {
          onAnalysisComplete(analysisData.analysis);
          setActiveTab("results");
        } else {
          throw new Error('Invalid analysis data received');
        }
      } else {
        throw new Error('Failed to get resume ID from upload');
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze resume. Please try again.',
        variant: 'destructive',
      });
      setActiveTab("upload");
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  const resetForm = () => {
    setFile(null);
    setExtractedText('');
    setJobDescription('');
    setTextPreview('');
    setUploadError(null);
    setActiveTab("upload");
    setPreviewExpanded(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePreview = () => {
    setPreviewExpanded(!previewExpanded);
  };

  // Render login prompt if not authenticated
  if (status === 'unauthenticated') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Resume Analyzer</CardTitle>
          <CardDescription>
            Please log in to analyze your resume
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Analyzer</CardTitle>
        <CardDescription>
          Upload your resume to get AI-powered feedback and optimization
            </CardDescription>
          </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <ProgressTracker 
              steps={[
                {
                  id: 'upload',
                  title: 'Upload',
                  description: 'Upload your resume',
                  icon: <FileUp className="h-5 w-5" />
                },
                {
                  id: 'job-description',
                  title: 'Job Description',
                  description: 'Add job details',
                  icon: <Info className="h-5 w-5" />
                },
                {
                  id: 'analyzing',
                  title: 'Analyzing',
                  description: 'AI processing',
                  icon: <Loader2 className="h-5 w-5" />
                },
                {
                  id: 'results',
                  title: 'Results',
                  description: 'View feedback',
                  icon: <Sparkles className="h-5 w-5" />
                }
              ]}
              currentStep={activeTab}
            />
          </div>
          
          <TabsContent value="upload" className="mt-0">
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  uploadError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                } transition-colors`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                  disabled={isExtracting}
                />
                
                {!file && !isExtracting && (
                  <div>
                    <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Upload your resume</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop your PDF file here, or click to browse
                    </p>
                    {uploadError && (
                      <div className="text-red-500 text-sm mb-4 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {uploadError}
                      </div>
                    )}
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="mx-auto"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select PDF File
                    </Button>
                  </div>
                )}
                
                {isExtracting && (
                  <div>
                    <Loader2 className="h-10 w-10 mx-auto text-blue-500 animate-spin mb-4" />
                    <h3 className="text-lg font-medium mb-2">Processing your resume</h3>
                    <p className="text-sm text-gray-500">
                      Extracting text from your PDF...
                    </p>
                </div>
              )}
              
                {file && !isExtracting && (
                  <div>
                    <CheckCircle className="h-10 w-10 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">Resume uploaded</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                    
                    {textPreview && (
                      <div className="mt-4 text-left">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Text Preview:</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={togglePreview}
                            className="text-xs"
                          >
                            {previewExpanded ? 'Show Less' : 'Show More'}
                          </Button>
                        </div>
                        <div className={`text-xs text-gray-600 bg-gray-50 p-3 rounded-md ${
                          previewExpanded ? 'max-h-60 overflow-y-auto' : 'max-h-20 overflow-hidden'
                        }`}>
                          {previewExpanded ? extractedText : textPreview}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center mt-4 space-x-2">
                        <Button
                        variant="outline"
                          size="sm"
                        onClick={resetForm}
                        >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                        </Button>
                          <Button 
                        onClick={() => setActiveTab("job-description")}
                            size="sm" 
                          >
                        Continue
                        <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                    </div>
                  )}
              </div>
                </div>
              </TabsContent>
              
          <TabsContent value="job-description" className="mt-0">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="jobDescription" className="text-base font-medium">
                    Job Description
                    </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Adding a job description helps us tailor our analysis to the specific role you're applying for.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                    <Textarea
                      id="jobDescription"
                  placeholder="Paste the job description here (optional)"
                  className="min-h-32"
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                    />
                <p className="text-xs text-gray-500 mt-1">
                  For best results, include the full job description
                    </p>
                  </div>
                  
              <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                  onClick={() => setActiveTab("upload")}
              >
                  Back
              </Button>
              <Button 
                  onClick={handleAnalyze}
                  disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                  </>
                ) : (
                  <>
                      <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Resume
                  </>
                )}
              </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analyzing" className="mt-0">
            <div className="py-8 text-center">
              <Loader2 className="h-12 w-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-xl font-medium mb-2">Analyzing your resume</h3>
              <p className="text-gray-500 mb-6">
                Our AI is reviewing your resume and preparing personalized feedback
              </p>
              <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
              <p className="text-sm text-gray-500 mt-2">
                This may take a minute...
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="results" className="mt-0">
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">Analysis Complete!</h3>
              <p className="text-gray-500 mb-6">
                Your resume analysis is ready to view
              </p>
              <Button
                onClick={resetForm}
                variant="outline"
                className="mx-auto"
              >
                Analyze Another Resume
              </Button>
      </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}