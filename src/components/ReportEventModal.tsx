import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useReportEvent, ReportReason } from "@/hooks/useReportEvent";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "spam_scam", label: "Spam / Scam" },
  { value: "hate_harassment", label: "Hate / Harassment" },
  { value: "sexual_nudity", label: "Sexual / Nudity" },
  { value: "violence", label: "Violence" },
  { value: "copyright_ip", label: "Copyright / IP" },
  { value: "misleading", label: "Misleading" },
  { value: "other", label: "Other" },
];

interface ReportEventModalProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onReported?: () => void;
}

export const ReportEventModal: React.FC<ReportEventModalProps> = ({
  eventId,
  open,
  onOpenChange,
  disabled,
  onReported,
}) => {
  const { toast } = useToast();
  const { alreadyReported, loading, submitting, submitReport, checkStatus } = useReportEvent({ eventId, enabled: open });

  const [reason, setReason] = useState<ReportReason | "">("");
  const [otherText, setOtherText] = useState("");

  const requiresText = reason === "other";
  const remaining = useMemo(() => 500 - otherText.length, [otherText]);

  useEffect(() => {
    if (!open) {
      setReason("");
      setOtherText("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (disabled || submitting) return;

    if (!reason) {
      toast({ title: "Select a reason", description: "Please choose a report reason.", variant: "destructive" });
      return;
    }
    if (requiresText) {
      const text = otherText.trim();
      if (!text) {
        toast({ title: "Details required", description: "Please describe the issue (max 500 characters).", variant: "destructive" });
        return;
      }
      if (text.length > 500) {
        toast({ title: "Too long", description: "Please keep your description under 500 characters.", variant: "destructive" });
        return;
      }
    }

    const { success, alreadyReported: wasAlready } = await submitReport(reason as ReportReason, requiresText ? otherText.trim() : undefined);

    if (success) {
      toast({ title: wasAlready ? "Already reported" : "Report submitted", description: wasAlready ? "You have already reported this event." : "Thank you. Our team will review.", });
      onReported?.();
      onOpenChange(false);
    } else {
      toast({ title: "Error", description: "Could not submit your report. Please try again.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Event</DialogTitle>
          <DialogDescription>Select a reason and provide details if needed.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
            {REASONS.map((r) => (
              <label key={r.value} className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
                <Label htmlFor={`reason-${r.value}`}>{r.label}</Label>
              </label>
            ))}
          </RadioGroup>

          {requiresText && (
            <div className="space-y-2">
              <Label htmlFor="report-details">Details (required)</Label>
              <Textarea
                id="report-details"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value.slice(0, 500))}
                placeholder="Describe the issue (max 500 characters)"
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">{remaining} characters left</div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || alreadyReported || disabled}>
              {alreadyReported ? "Already reported" : submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
