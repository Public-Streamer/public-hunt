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
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-sm">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default TooltipWrapper;
export { TooltipWrapper };