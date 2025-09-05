import * as React from 'react';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  tooltipContent?: string;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, tooltipContent, ...props }, ref) => {
    const input = (
      <input
        type={type}
        className={cn(
          'flex min-h-[32px] md:min-h-[48px] w-full rounded-lg border-2 border-gray-400 bg-white px-4 py-3 text-lg font-medium ring-offset-background file:border-0 file:bg-transparent file:text-lg file:font-medium placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-600 hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 touch-manipulation transition-all duration-200 shadow-sm hover:shadow-md',
          className
        )}
        ref={ref}
        {...props}
      />
    );

    if (tooltipContent) {
      return <TooltipWrapper content={tooltipContent}>{input}</TooltipWrapper>;
    }

    return input;
  }
);
Input.displayName = 'Input';

export { Input };
