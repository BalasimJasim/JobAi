import React from 'react';
import { Progress } from './progress';

interface LoadingOverlayProps {
  message: string;
  subMessage?: string;
  progress?: number;
  isVisible: boolean;
}

export function LoadingOverlay({ 
  message, 
  subMessage, 
  progress, 
  isVisible 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay animate-fade-in">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all animate-scale-in">
        <div className="flex items-center space-x-4 mb-4">
          <div className="loading-spinner">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{message}</h3>
            {subMessage && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{subMessage}</p>
            )}
          </div>
        </div>
        {typeof progress === 'number' && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 