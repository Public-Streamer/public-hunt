import React, { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TooltipWrapperProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
}

const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ 
  children, 
  content, 
  disabled = false 
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger 
        asChild
        onFocus={(e) => e.stopPropagation()} // Prevent focus stealing
        tabIndex={-1} // Remove from tab order to prevent focus issues
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={5}>
        <p className="max-w-xs text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default TooltipWrapper;
export { TooltipWrapper };