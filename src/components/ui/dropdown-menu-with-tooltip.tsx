import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';
import {
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuSubTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';

interface TooltipDropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuItem> {
  tooltip?: string;
  inset?: boolean;
}

const TooltipDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuItem>,
  TooltipDropdownMenuItemProps
>(({ className, tooltip, children, ...props }, ref) => {
  if (!tooltip) {
    return (
      <DropdownMenuItem ref={ref} className={className} {...props}>
        {children}
      </DropdownMenuItem>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuItem ref={ref} className={className} {...props}>
            {children}
          </DropdownMenuItem>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
TooltipDropdownMenuItem.displayName = 'TooltipDropdownMenuItem';

interface TooltipDropdownMenuCheckboxItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuCheckboxItem> {
  tooltip?: string;
}

const TooltipDropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuCheckboxItem>,
  TooltipDropdownMenuCheckboxItemProps
>(({ className, tooltip, children, ...props }, ref) => {
  if (!tooltip) {
    return (
      <DropdownMenuCheckboxItem ref={ref} className={className} {...props}>
        {children}
      </DropdownMenuCheckboxItem>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuCheckboxItem ref={ref} className={className} {...props}>
            {children}
          </DropdownMenuCheckboxItem>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});
TooltipDropdownMenuCheckboxItem.displayName = 'TooltipDropdownMenuCheckboxItem';

export { TooltipDropdownMenuItem, TooltipDropdownMenuCheckboxItem };
