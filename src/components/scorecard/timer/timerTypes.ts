export const TIMER_STATUS = {
    RUNNING: 'running',
    PAUSED: 'paused',
    FINISHED: 'finished',
    IDLE: 'idle'
  } as const;
  
  export type TimerVariant = 'success' | 'danger' | 'warning' | 'info' | 'pending';
  
  export interface TimerData {
    status: typeof TIMER_STATUS[keyof typeof TIMER_STATUS];
    remaining: number;
    [key: string]: any;
  }
  
  export interface ProcessedTimer {
    formatted: string;
    status: string;
    remaining: number;
  }
  
  export interface TeamData {
    id: string;
    custom_fields?: {
      timers?: Record<string, TimerData>;
    };
    [key: string]: any;
  }
  
  export interface TimerGlowEffect {
    variant: TimerVariant;
    until: number;
  }