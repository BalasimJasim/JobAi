import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface NextStepButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  tooltipText?: string;
}

export function NextStepButton({
  onClick,
  disabled = false,
  label,
  tooltipText
}: NextStepButtonProps) {
  const button = (
    <Button
      onClick={onClick}
      disabled={disabled}
      className="next-step-button"
      size="lg"
    >
      <span>{label}</span>
      <ArrowRight className="h-5 w-5 ml-2" />
    </Button>
  );

  if (tooltipText && disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
} 