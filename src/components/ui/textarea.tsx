import * as React from "react"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { cn } from "@/lib/utils"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  tooltipContent?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, tooltipContent, ...props }, ref) => {
    const textarea = (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-lg border-2 border-gray-400 bg-white px-4 py-3 text-lg font-medium ring-offset-background placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-600 hover:border-gray-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100 transition-all duration-200 resize-none touch-manipulation shadow-sm hover:shadow-md",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (tooltipContent) {
      return (
        <TooltipWrapper content={tooltipContent}>
          {textarea}
        </TooltipWrapper>
      )
    }

    return textarea
  }
)
Textarea.displayName = "Textarea"

export { Textarea }