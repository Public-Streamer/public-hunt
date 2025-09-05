import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { DogData } from './DogCard';
import type { TimerStatus } from '@/hooks/useCountdown';

export interface CastTimerBlock {
  key: string;
  label: string;
  status: TimerStatus;
  formatted: string;
}

interface DogTimerSnapshotUI {
  formatted: string;
  status: TimerStatus;
}

interface ScorecardSummaryProps {
  dogs: DogData[];
  timerOverview: Record<string, Record<string, DogTimerSnapshotUI>>;
  castTimers: CastTimerBlock[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  glowClassName?: string;
}

const statusCls = (s: TimerStatus) =>
  s === 'running'
    ? 'bg-primary/10 text-primary'
    : s === 'paused'
      ? 'bg-accent/10 text-accent-foreground'
      : s === 'finished'
        ? 'bg-destructive/10 text-destructive'
        : 'bg-muted text-muted-foreground';

const labelMap: Record<string, string> = {
  tree: 'Tree',
  treeBark2: 'Tree Bark',
  shine: 'Shine',
  trackBark: 'Track Bark',
  walk: 'Walk',
  babbling: 'Babbling 1 Minute',
  notHunting: 'Not Hunt',
  goneHunting: 'Gone Hunt',
  stationary: 'Stationary',
  noBark: 'No Bark',
};
const durationsMin: Record<string, number> = {
  tree: 3,
  treeBark2: 2,
  shine: 8,
  trackBark: 6,
  walk: 1,
  babbling: 1,
  notHunting: 15,
  goneHunting: 5,
  stationary: 5,
  noBark: 2,
};
const keys: string[] = [
  'tree',
  'treeBark2',
  'shine',
  'trackBark',
  'walk',
  'babbling',
  'notHunting',
  'goneHunting',
  'stationary',
  'noBark',
];

const calcTotals = (entries: DogData['entries']) => {
  let plus = 0;
  let minus = 0;
  let circle = 0;
  let pending = 0;
  for (const e of entries) {
    if (e.outcome === '+') plus += e.points;
    else if (e.outcome === '-') minus += e.points;
    else if (e.outcome === 'o') circle += e.points;
    else if (e.outcome === 'pending') pending += e.points;
  }
  const total = plus - minus; // circle and pending do not affect net total
  return { total, pending, plus, minus, circle };
};

export const ScorecardSummary: React.FC<ScorecardSummaryProps> = ({
  dogs,
  timerOverview,
  castTimers,
  open: controlledOpen,
  onOpenChange,
  glowClassName,
}) => {
  const activeCast = useMemo(
    () => castTimers.filter((c) => c.status === 'running'),
    [castTimers]
  );
  const [uncontrolledOpen, setUncontrolledOpen] = useState<boolean>(
    controlledOpen ?? false
  );
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(v);
    onOpenChange?.(v);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={`glow-surface ${glowClassName ?? ''}`}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Scorecard Summary</CardTitle>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle scorecard summary"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                Active Cast Timers
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeCast.length > 0 ? (
                  activeCast.map((b) => (
                    <div
                      key={b.key}
                      className={`rounded-md p-3 border-2 ${statusCls(b.status)} shadow-md`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold">{b.label}</span>
                        <span className="tabular-nums font-extrabold text-lg">
                          {b.formatted}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No active cast timers
                  </div>
                )}
              </div>
            </div>

            {/* Per-dog timers + totals */}
            <div className="space-y-3">
              {dogs
                .sort((a, b) => {
                  const totalA = calcTotals(a.entries).total;
                  const totalB = calcTotals(b.entries).total;
                  return totalB - totalA; // Sort by highest to lowest points
                })
                .map((d) => {
                  const snap = timerOverview[d.id];
                  const running = snap
                    ? keys
                        .map((k) => ({
                          key: k,
                          t: (snap as any)[k] as DogTimerSnapshotUI,
                        }))
                        .filter(
                          (x) =>
                            x.t &&
                            (x.t.status === 'running' ||
                              x.t.status === 'paused' ||
                              x.t.status === 'finished')
                        )
                    : [];
                  const { total, pending, plus, minus, circle } = calcTotals(
                    d.entries
                  );
                  return (
                    <div key={d.id} className="rounded-md border p-3">
                      {/* Names row - horizontal layout */}
                      <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ background: d.color }}
                          />
                          <span className="text-sm sm:text-base md:text-lg font-extrabold text-foreground min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {d.name}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-foreground space-y-1">
                          <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            Dog: {d.dogName || '—'}
                          </div>
                          <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            Handler: {d.handler || '—'}
                          </div>
                        </div>
                      </div>

                      {/* Score badges row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {plus > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-primary border-primary/40"
                          >
                            <span className="tabular-nums">{plus}</span>
                            <span className="ml-1">+</span>
                          </Badge>
                        )}
                        {minus > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/40"
                          >
                            <span className="tabular-nums">{minus}</span>
                            <span className="ml-1">-</span>
                          </Badge>
                        )}
                        {circle > 0 && (
                          <Badge
                            variant="warning"
                            className="rounded-full ring-1 ring-yellow-500/40"
                          >
                            <span className="tabular-nums rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
                              {circle}
                            </span>
                          </Badge>
                        )}
                        {pending > 0 && (
                          <Badge variant="outline" className="pulse">
                            Pending:{' '}
                            <span className="ml-1 tabular-nums">{pending}</span>
                          </Badge>
                        )}
                        {total === 0 && circle > 0 ? (
                          <Badge
                            variant="warning"
                            className="rounded-full ring-1 ring-yellow-500/40"
                          >
                            Total:{' '}
                            <span className="ml-1 tabular-nums rounded-full ring-2 ring-yellow-500 px-2 py-0.5 text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30">
                              {circle}
                            </span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className={`${total > 0 ? 'text-primary bg-primary/10 border-primary/40' : total < 0 ? 'text-destructive bg-destructive/10 border-destructive/40' : 'text-muted-foreground'} border`}
                          >
                            Total:{' '}
                            <span className="ml-1 tabular-nums">
                              {Math.abs(total)}
                            </span>
                            {total !== 0 && (
                              <span className="ml-1">
                                {total > 0 ? '+' : '-'}
                              </span>
                            )}
                          </Badge>
                        )}
                      </div>
                      {running.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
                          {running.map(({ key, t }) => (
                            <div
                              key={key}
                              className={`rounded-md p-2 border ${statusCls(t.status)} ${t.status === 'finished' ? 'animate-pulse' : ''}`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="capitalize">{`${labelMap[key] ?? key} ${durationsMin[key]} minutes`}</span>
                                <span
                                  className={`tabular-nums font-semibold ${t.status === 'finished' ? 'text-destructive font-bold' : ''}`}
                                >
                                  {t.formatted}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ScorecardSummary;
