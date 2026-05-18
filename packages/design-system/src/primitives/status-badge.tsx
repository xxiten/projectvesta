import * as React from 'react';
import { cn } from '../lib/cn';

type Tone = 'free' | 'occupied' | 'option' | 'conflict' | 'neutral';

const TONE: Record<Tone, string> = {
  free: 'bg-green-50 text-green-700 ring-green-600/20',
  occupied: 'bg-accent-500/10 text-accent-600 ring-accent-600/20',
  option: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  conflict: 'bg-red-50 text-red-700 ring-red-600/20',
  neutral: 'bg-neutral-100 text-neutral-700 ring-neutral-300',
};

/** Maps a reservation status to a calm, consistent tone. */
const RESERVATION_TONE: Record<string, Tone> = {
  enquiry: 'option',
  confirmed: 'occupied',
  checked_in: 'occupied',
  checked_out: 'neutral',
  cancelled: 'neutral',
  no_show: 'conflict',
};

export interface StatusBadgeProps {
  status: string;
  tone?: Tone;
  className?: string;
}

export function StatusBadge({ status, tone, className }: StatusBadgeProps) {
  const resolved = tone ?? RESERVATION_TONE[status] ?? 'neutral';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        'ring-1 ring-inset',
        TONE[resolved],
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
