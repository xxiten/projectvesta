import * as React from 'react';
import { cn } from '../lib/cn';

export type HousekeepingStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order';

const DOT: Record<HousekeepingStatus, string> = {
  clean: 'bg-state-free',
  dirty: 'bg-state-option',
  inspected: 'bg-accent-500',
  out_of_order: 'bg-state-conflict',
};

const LABEL: Record<HousekeepingStatus, string> = {
  clean: 'Sauber',
  dirty: 'Schmutzig',
  inspected: 'Kontrolliert',
  out_of_order: 'Außer Betrieb',
};

export interface HousekeepingDotProps {
  status: HousekeepingStatus;
  className?: string;
}

/** Tiny, calm status indicator for a room's housekeeping state. */
export function HousekeepingDot({ status, className }: HousekeepingDotProps) {
  return (
    <span
      title={LABEL[status]}
      aria-label={LABEL[status]}
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', DOT[status], className)}
    />
  );
}

export { LABEL as housekeepingLabel };
