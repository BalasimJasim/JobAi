'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  CheckCircle, AlertCircle, AlertTriangle, Download, XCircle, 
  Award, ChevronRight, Sparkles, Target, FileText
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { OptimizedResume } from './OptimizedResume';
import { CoverLetterSection } from '@/components/cover-letter/CoverLetterSection';
import { useCoverLetter } from '@/hooks/useCoverLetter';

// Define types for the analysis data
interface KeywordMatch {
  found: string[];
  missing: string[];
  score: number;
}

interface FeedbackItem {
  section: string;
  message: string;
  suggestion: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
}

interface AnalysisData {
  score: number;
  feedback: FeedbackItem[];
  aiSuggestions: string[];
  keywordMatch: KeywordMatch;
  resumeText: string;
  scoreBreakdown: {
    [key: string]: number;
    overall: number;
  };
}

interface ResumeAnalysisProps {
  data: AnalysisData;
}

// Import the CoverLetterContext type
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

export function ResumeAnalysis({ data }: ResumeAnalysisProps) {
  const [showOptimizedResume, setShowOptimizedResume] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback');
  const [coverLetterContext, setCoverLetterContext] = useState<CoverLetterContext | null>(null);
  const { toast } = useToast();
  const analysisRef = useRef<HTMLDivElement>(null);
  const optimizedResumeRef = useRef<HTMLDivElement>(null);
  const coverLetterRef = useRef<HTMLDivElement>(null);

  const {
    content: coverLetterContent,
    handleContentChange: handleCoverLetterChange,
    handleEnhance: handleEnhanceCoverLetter,
    isEnhancing: isEnhancingCoverLetter
  } = useCoverLetter({
    initialContent: '',
    onSave: async (content) => {
      // TODO: Implement save functionality
      console.log('Saving cover letter:', content);
    }
  });

  // Add animation styles
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeInScale {
        from { 
          opacity: 0; 
          transform: scale(0.95); 
        }
        to { 
          opacity: 1; 
          transform: scale(1); 
        }
      }
      .animate-fade-in-scale {
        animation: fadeInScale 0.5s ease-out forwards;
      }
      @keyframes pulseHighlight {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      .pulse-highlight {
        animation: pulseHighlight 2s ease-out forwards;
      }
      @keyframes slideDown {
        from { 
          opacity: 0;
          transform: translateY(-20px);
        }
        to { 
          opacity: 1;
          transform: translateY(0);
        }
      }
      .animate-slide-down {
        animation: slideDown 0.5s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Scroll to analysis when data changes
  useEffect(() => {
    if (data && data.score > 0) {
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        analysisRef.current?.classList.add('pulse-highlight');
      }, 100);
    }
  }, [data]);

  // Handle optimized resume generation
  const handleGenerateOptimizedResume = () => {
    setShowOptimizedResume(true);
    setTimeout(() => {
      optimizedResumeRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      optimizedResumeRef.current?.classList.add('animate-fade-in-scale');
    }, 100);
  };

  const handleCreateCoverLetter = () => {
    // Get job description and context from localStorage
    const jobDescription = localStorage.getItem('jobDescription') || undefined;
    const industryContext = localStorage.getItem('industryContext') || undefined;
    const careerLevel = localStorage.getItem('careerLevel') || undefined;
    const targetRole = localStorage.getItem('targetRole') || undefined;
    const targetCompany = localStorage.getItem('targetCompany') || undefined;

    // Create context object for cover letter generation
    const context: CoverLetterContext = {
      jobDescription,
      industryContext,
      careerLevel,
      targetRole,
      targetCompany,
      resumeScore: data.score,
      keywordMatch: data.keywordMatch
    };

    setCoverLetterContext(context);
    setShowCoverLetter(true);

    setTimeout(() => {
      coverLetterRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
  };

  if (!data || data.score === 0) {
    return null;
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'SUGGESTION':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'WARNING':
        return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      case 'SUGGESTION':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 dark:text-green-400';
    if (score >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  const downloadAnalysis = () => {
    // Create a formatted text version of the analysis
    let content = `Resume Analysis Report\n\n`;
    content += `Overall Score: ${data.score}/100\n\n`;
    
    content += `SECTION FEEDBACK:\n`;
    data.feedback.forEach(item => {
      content += `\n${item.section.toUpperCase()} - Message: ${item.message}\n`;
      content += `Suggestion: ${item.suggestion}\n`;
    });
    
    content += `\nKEYWORD ANALYSIS:\n`;
    content += `Found Keywords: ${data.keywordMatch.found.join(', ')}\n`;
    content += `Missing Keywords: ${data.keywordMatch.missing.join(', ')}\n`;
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume-analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Analysis downloaded',
      description: 'Your resume analysis has been downloaded as a text file',
    });
  };

  // Count issues by severity
  const criticalCount = data.feedback.filter(item => item.severity === 'CRITICAL').length;
  const warningCount = data.feedback.filter(item => item.severity === 'WARNING').length;
  const suggestionCount = data.feedback.filter(item => item.severity === 'SUGGESTION').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div ref={analysisRef} className="animate-fade-in-scale">
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardTitle className="text-2xl flex items-center">
              <Award className="h-6 w-6 mr-3" />
              Resume Analysis Results
            </CardTitle>
            <CardDescription className="text-blue-100">
              AI-powered insights to help improve your resume
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="col-span-1">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBackground(data.score)}`}>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(data.score)}`}>{data.score}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">out of 100</div>
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-medium">Overall Score</h3>
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-2">
                    {data.score >= 80 ? 'Excellent! Your resume is well-optimized.' : 
                     data.score >= 60 ? 'Good start, but there\'s room for improvement.' : 
                     'Your resume needs significant improvements.'}
                  </p>
                </div>
              </div>
              
              <div className="col-span-2">
                <h3 className="text-lg font-medium mb-4">Issue Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex-1">Critical Issues</div>
                    <div className="flex items-center">
                      <Badge variant="destructive" className="mr-2">{criticalCount}</Badge>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${criticalCount ? (criticalCount / data.feedback.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex-1">Warnings</div>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">{warningCount}</Badge>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 rounded-full" 
                          style={{ width: `${warningCount ? (warningCount / data.feedback.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 flex-1">Suggestions</div>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">{suggestionCount}</Badge>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${suggestionCount ? (suggestionCount / data.feedback.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={downloadAnalysis} className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download Report
                  </Button>
                  <Button 
                    onClick={handleGenerateOptimizedResume}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Optimized Resume
                  </Button>
                </div>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feedback">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Detailed Feedback
                </TabsTrigger>
                <TabsTrigger value="keywords">
                  <Target className="h-4 w-4 mr-2" />
                  Keyword Analysis
                </TabsTrigger>
                <TabsTrigger value="suggestions">
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Suggestions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="feedback">
                <div className="space-y-4">
                  {data.feedback.map((item, index) => (
                    <div 
                      key={index} 
                      className={`border rounded-lg p-4 transition-all duration-200 ${getSeverityClass(item.severity)}`}
                    >
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(item.severity)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{item.section}</h3>
                            <Badge 
                              variant={item.severity === 'CRITICAL' ? 'destructive' : undefined}
                              className={
                                item.severity === 'WARNING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100' :
                                item.severity === 'SUGGESTION' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''
                              }
                            >
                              {item.severity}
                            </Badge>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">{item.message}</p>
                          {item.suggestion && item.suggestion !== "None" && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                              <div className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">SUGGESTION</div>
                              <p className="text-blue-700 dark:text-blue-300 text-sm">
                                {item.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="keywords">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border border-green-200 dark:border-green-800">
                    <CardHeader className="bg-green-50 dark:bg-green-900/20 pb-3">
                      <CardTitle className="text-lg flex items-center text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                        Found Keywords ({data.keywordMatch.found.length})
                      </CardTitle>
                      <CardDescription>
                        Keywords found in your resume
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        {data.keywordMatch.found.length > 0 ? (
                          data.keywordMatch.found.map((keyword, index) => (
                            <Badge
                              key={index}
                              className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                            >
                              {keyword}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No matching keywords found</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-red-200 dark:border-red-800">
                    <CardHeader className="bg-red-50 dark:bg-red-900/20 pb-3">
                      <CardTitle className="text-lg flex items-center text-red-700 dark:text-red-300">
                        <XCircle className="h-5 w-5 mr-2 text-red-500" />
                        Missing Keywords ({data.keywordMatch.missing.length})
                      </CardTitle>
                      <CardDescription>
                        Keywords missing from your resume
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        {data.keywordMatch.missing.length > 0 ? (
                          data.keywordMatch.missing.map((keyword, index) => (
                            <Badge
                              key={index}
                              className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
                            >
                              {keyword}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">No missing keywords - great job!</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="md:col-span-2">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                      <h3 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-500" />
                        Keyword Match Score: {data.keywordMatch.score}%
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {data.keywordMatch.score >= 80 ? 
                          'Excellent keyword matching! Your resume is well-aligned with the job requirements.' : 
                          data.keywordMatch.score >= 60 ? 
                          'Good keyword matching. Consider adding some of the missing keywords to improve your chances.' : 
                          'Your resume needs more relevant keywords to match job requirements. Try incorporating the missing keywords.'}
                      </p>
                      <div className="h-2 mt-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            data.keywordMatch.score >= 80 ? "bg-green-500" : 
                            data.keywordMatch.score >= 60 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${data.keywordMatch.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="suggestions">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
                      AI-Powered Suggestions
                    </CardTitle>
                    <CardDescription>
                      Smart recommendations to improve your resume
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {data.aiSuggestions.map((suggestion, index) => (
                        <div 
                          key={index} 
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg border border-blue-100 dark:border-blue-800 flex"
                        >
                          <div className="mr-3 mt-0.5 text-blue-500">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-end">
                    <Button 
                      onClick={handleGenerateOptimizedResume}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Optimized Resume
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {showOptimizedResume && (
        <div ref={optimizedResumeRef} className="mt-8 animate-slide-down">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-0.5 bg-blue-200 dark:bg-blue-800"></div>
          </div>
          <OptimizedResume
            originalAnalysis={{
              ...data,
              resumeText: localStorage.getItem('originalResumeText') || '',
            }}
            onClose={() => {
              setShowOptimizedResume(false);
              setTimeout(() => {
                analysisRef.current?.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'start' 
                });
              }, 100);
            }}
            onCreateCoverLetter={handleCreateCoverLetter}
          />
        </div>
      )}

      {showCoverLetter && coverLetterContext && (
        <div ref={coverLetterRef} className="mt-8 animate-slide-down">
          <div className="flex items-center justify-center mb-6">
            <div className="h-12 w-0.5 bg-blue-200 dark:bg-blue-800"></div>
          </div>
          <CoverLetterSection
            content=""
            context={coverLetterContext}
            onSave={(content) => {
              // Save cover letter content to localStorage
              localStorage.setItem('coverLetterContent', content);
            }}
            onEnhance={async (context) => {
              try {
                const response = await fetch('/api/cover-letter/enhance', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(context),
                });

                if (!response.ok) {
                  throw new Error('Failed to enhance cover letter');
                }

                const data = await response.json();
                return data;
              } catch (error) {
                console.error('Error enhancing cover letter:', error);
                throw error;
              }
            }}
          />
        </div>
      )}
    </div>
  );
} 