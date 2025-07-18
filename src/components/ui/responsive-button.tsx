import React from 'react';
import { Button, ButtonProps } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { cn } from '@/lib/utils';

interface ResponsiveButtonProps extends ButtonProps {
  children: React.ReactNode;
  tooltip?: string;
  enableMultiLine?: boolean;
  minTextSize?: string;
}

export const ResponsiveButton = React.forwardRef<HTMLButtonElement, ResponsiveButtonProps>(
  ({ children, tooltip, enableMultiLine = true, minTextSize = "text-xs", className, ...props }, ref) => {
    const buttonContent = (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden",
          enableMultiLine && "whitespace-normal",
          className
        )}
        {...props}
      >
        <span className={cn(
          "text-center w-full leading-tight",
          enableMultiLine && "break-words hyphens-auto",
          `${minTextSize} sm:text-sm md:text-base lg:text-lg`
        )}>
          {children}
        </span>
      </Button>
    );

    if (tooltip) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {buttonContent}
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return buttonContent;
  }
);

ResponsiveButton.displayName = "ResponsiveButton";