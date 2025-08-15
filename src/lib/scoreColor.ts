// Centralized color coding utilities for strikes and trees

export interface ScoreState {
  status: 'pending' | 'final' | null;
}

export function strikeColor(s: ScoreState): string {
  switch (s.status) {
    case 'pending':
      return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-200';
    case 'final':
      return 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800/40 dark:text-blue-200';
    default:
      return 'bg-muted/20 border-muted/40 text-muted-foreground';
  }
}

export function treeColor(s: ScoreState): string {
  switch (s.status) {
    case 'pending':
      return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-200';
    case 'final':
      return 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/20 dark:border-purple-800/40 dark:text-purple-200';
    default:
      return 'bg-muted/20 border-muted/40 text-muted-foreground';
  }
}

export function getStatusBadgeClass(status: 'pending' | 'final' | null): string {
  switch (status) {
    case 'pending':
      return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-800 animate-pulse';
    case 'final':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/50 dark:text-green-200 dark:border-green-800';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
}