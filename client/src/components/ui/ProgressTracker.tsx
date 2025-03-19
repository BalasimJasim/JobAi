import React from 'react';
import { FileText, Info, Sparkles, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string | number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const defaultSteps: Step[] = [
  {
    id: 1,
    title: "Upload",
    description: "Upload your resume",
    icon: <FileText className="h-5 w-5" />
  },
  {
    id: 2,
    title: "Analysis",
    description: "AI-powered analysis",
    icon: <Info className="h-5 w-5" />
  },
  {
    id: 3,
    title: "Optimize",
    description: "Enhance your resume",
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: 4,
    title: "Cover Letter",
    description: "Create matching cover letter",
    icon: <FileEdit className="h-5 w-5" />
  }
];

interface ProgressTrackerProps {
  currentStep: string | number;
  steps?: Step[];
  className?: string;
}

export function ProgressTracker({ 
  currentStep, 
  steps = defaultSteps,
  className 
}: ProgressTrackerProps) {
  return (
    <div className={cn("w-full mb-8", className)}>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 relative">
            <div className={`flex flex-col items-center ${index === steps.length - 1 ? '' : 'relative'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200 ${
                currentStep === step.id ? 'bg-blue-600' : 
                index < steps.findIndex(s => s.id === currentStep) ? 'bg-green-500' : 
                'bg-gray-200 dark:bg-gray-700'
              }`}>
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
                  index < steps.findIndex(s => s.id === currentStep) ? 'bg-green-500' : 
                  'bg-gray-200 dark:bg-gray-700'
                } transition-colors duration-200`} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 