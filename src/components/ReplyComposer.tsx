import React, { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ReplyComposerProps {
  onSubmit: (content: string) => Promise<boolean>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ReplyComposer({ 
  onSubmit, 
  placeholder = "Write a reply...", 
  className,
  disabled = false 
}: ReplyComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting || disabled) return;

    setIsSubmitting(true);
    const success = await onSubmit(content.trim());
    if (success) {
      setContent("");
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("flex gap-2 items-start", className)}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 min-h-[32px] py-1 px-2 text-sm resize-none border-border/60 focus:border-border"
        rows={1}
        disabled={isSubmitting || disabled}
      />
      <Button
        type="submit"
        size="sm"
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting || disabled}
        className="h-8 px-2 text-xs"
      >
        <Send className="h-3 w-3" />
      </Button>
    </div>
  );
}