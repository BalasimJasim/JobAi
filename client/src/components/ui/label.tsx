import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /** Custom prop to differentiate from LabelHTMLAttributes */
  asChild?: boolean;
}

export function Label({ className = '', ...props }: LabelProps) {
  return (
    <label
      className={`text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
      {...props}
    />
  );
} 