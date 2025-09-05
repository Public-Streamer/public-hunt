import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ReportReason =
  | 'spam_scam'
  | 'hate_harassment'
  | 'sexual_nudity'
  | 'violence'
  | 'copyright_ip'
  | 'misleading'
  | 'other';

interface UseReportEventOptions {
  eventId: string;
  enabled?: boolean;
}

export function useReportEvent({
  eventId,
  enabled = true,
}: UseReportEventOptions) {
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    if (!enabled || !eventId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('report-event', {
        body: { action: 'status', eventId },
      });
      if (error) throw error;
      setAlreadyReported(!!data?.alreadyReported);
    } catch (e: any) {
      // Silent fail; don't block UI
      setError(e?.message || 'Failed to check report status');
    } finally {
      setLoading(false);
    }
  }, [enabled, eventId]);

  const submitReport = useCallback(
    async (reason: ReportReason, reasonText?: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke(
          'report-event',
          {
            body: {
              action: 'submit',
              eventId,
              reason_category: reason,
              reason_text: reasonText,
            },
          }
        );
        if (error) throw error;
        if (data?.alreadyReported || data?.success) {
          setAlreadyReported(true);
        }
        return { success: true, alreadyReported: !!data?.alreadyReported };
      } catch (e: any) {
        setError(e?.message || 'Failed to submit report');
        return { success: false, error: e?.message };
      } finally {
        setSubmitting(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    alreadyReported,
    loading,
    submitting,
    error,
    checkStatus,
    submitReport,
  };
}
