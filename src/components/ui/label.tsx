import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-lg font-bold leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900",
  {
    variants: {
      variant: {
        default: "text-gray-900",
        muted: "text-gray-700",
        accent: "text-blue-800",
      },
      size: {
        default: "text-lg",
        xs: "text-base",
        sm: "text-lg",
        lg: "text-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, variant, size, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants({ variant, size }), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }