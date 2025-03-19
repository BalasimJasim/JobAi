import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom prop to differentiate from HTMLDivElement */
  asChild?: boolean;
}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className || ''}`}
      {...props}
    />
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom prop to differentiate from HTMLDivElement */
  asChild?: boolean;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      className={`p-6 ${className || ''}`}
      {...props}
    />
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /** Custom prop to differentiate from HTMLHeadingElement */
  asChild?: boolean;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={`text-xl font-semibold text-gray-900 dark:text-white ${className || ''}`}
      {...props}
    />
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Custom prop to differentiate from HTMLParagraphElement */
  asChild?: boolean;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p
      className={`text-sm text-gray-500 dark:text-gray-400 mt-1 ${className || ''}`}
      {...props}
    />
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom prop to differentiate from HTMLDivElement */
  asChild?: boolean;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      className={`p-6 pt-0 ${className || ''}`}
      {...props}
    />
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom prop to differentiate from HTMLDivElement */
  asChild?: boolean;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={`p-6 pt-0 ${className || ''}`}
      {...props}
    />
  );
} 