import * as React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  animated?: boolean;
}

const Skeleton = ({ className, animated = true, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'rounded-md bg-muted/70',
        animated && 'animate-pulse',
        className
      )}
      {...props}
    />
  );
};

export { Skeleton };
