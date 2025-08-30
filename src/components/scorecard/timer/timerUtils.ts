import { TeamData, TimerData, ProcessedTimer, TIMER_STATUS } from './timerTypes';

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const processTimer = (
  timer: TimerData,
  teamId: string,
  finishedTimers: Record<string, Record<string, number>>,
  setFinishedTimers: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>
): ProcessedTimer | null => {
  const { status } = timer;
  const remaining = Math.max(0, Math.floor(timer.remaining || 0));
  
  if (status === TIMER_STATUS.RUNNING || status === TIMER_STATUS.PAUSED) {
    return {
      formatted: formatTime(remaining),
      status,
      remaining
    };
  }

  if (status === TIMER_STATUS.FINISHED && remaining === 0) {
    const now = Date.now();
    const finishedAt = finishedTimers[teamId]?.[timer.id];

    if (!finishedAt) {
      setFinishedTimers(prev => ({
        ...prev,
        [teamId]: {
          ...prev[teamId],
          [timer.id ?? '']: now
        }
      }));
      return {
        formatted: '00:00',
        status,
        remaining: 0
      };
    }

    if (now - finishedAt < 60000) { // 1 minute in ms
      return {
        formatted: '00:00',
        status,
        remaining: 0
      };
    }
  }

  return null;
};