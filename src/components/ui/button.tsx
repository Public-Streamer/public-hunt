import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-lg font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900 border-2 border-blue-800',
        destructive:
          'bg-gradient-to-r from-red-600 to-red-800 text-white hover:from-red-700 hover:to-red-900 border-2 border-red-800',
        outline:
          'border-2 border-gray-800 bg-white text-gray-900 hover:bg-gray-100 hover:border-gray-900',
        secondary:
          'bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900 border-2 border-gray-800',
        ghost:
          'bg-transparent text-gray-900 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300',
        link: 'text-blue-700 underline-offset-4 hover:underline font-bold text-lg',
      },
      size: {
        default: 'min-h-[48px] px-6 py-3',
        xs: 'min-h-[24px] px-2 py-1 text-xs',
        sm: 'min-h-[40px] px-4 py-2 text-base',
        lg: 'min-h-[56px] px-8 py-4 text-xl',
        icon: 'min-h-[48px] min-w-[48px] p-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
