import React, { ReactNode, forwardRef } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TooltipWrapperProps {
  children: ReactNode;
  content: string;
  disabled?: boolean;
}

const TooltipWrapper = forwardRef<any, TooltipWrapperProps>(
  ({ children, content, disabled = false }, ref) => {
    if (disabled) {
      return <>{children}</>;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild ref={ref}>
          {children}
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={5}>
          <p className="max-w-xs text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
);

TooltipWrapper.displayName = 'TooltipWrapper';

export default TooltipWrapper;
export { TooltipWrapper };
