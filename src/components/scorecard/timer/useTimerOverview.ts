import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TeamData, ProcessedTimer } from './timerTypes';
import { processTimer } from './timerUtils';

export const useTimerOverview = (eventId: string) => {
  const [timerOverview, setTimerOverview] = useState<Record<string, Record<string, ProcessedTimer>>>({});
  const [finishedTimers, setFinishedTimers] = useState<Record<string, Record<string, number>>>({});

  const fetchTimerOverview = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scoreboard-operations', {
        body: { action: 'fetch', eventId, scoreboardType: 'coon_hunt' }
      });
      
      if (error) throw error;
      
      const teams = Array.isArray(data) ? data : data?.teams || [];
      const overview: Record<string, Record<string, ProcessedTimer>> = {};

      for (const team of teams) {
        const timers = team.custom_fields?.timers;
        if (timers) {
          const uiTimers: Record<string, ProcessedTimer> = {};
          for (const [key, timer] of Object.entries(timers)) {
            const processed = processTimer(
              timer as any,
              team.id,
              finishedTimers,
              setFinishedTimers
            );
            if (processed) {
              uiTimers[key] = processed;
            }
          }
          if (Object.keys(uiTimers).length > 0) {
            overview[team.id] = uiTimers;
          }
        }
      }

      setTimerOverview(overview);
    } catch (error) {
      console.error('Failed to fetch timer overview:', error);
    }
  }, [eventId, finishedTimers]);

  return { timerOverview, fetchTimerOverview, finishedTimers, setFinishedTimers };
};