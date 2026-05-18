import * as React from 'react';
import { cn } from '../lib/cn';

export type SegmentTone = 'free' | 'occupied' | 'option' | 'conflict' | 'neutral';

const TONE: Record<SegmentTone, string> = {
  free: 'bg-green-50 text-green-800 ring-green-600/30 hover:bg-green-100',
  occupied: 'bg-accent-500/12 text-accent-600 ring-accent-600/25 hover:bg-accent-500/20',
  option: 'bg-amber-50 text-amber-800 ring-amber-600/30 hover:bg-amber-100',
  conflict: 'bg-red-50 text-red-800 ring-red-600/30 hover:bg-red-100',
  neutral: 'bg-neutral-100 text-neutral-700 ring-neutral-300 hover:bg-neutral-200',
};

export interface SegmentProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: SegmentTone;
  selected?: boolean;
  /** out-of-order / hold blocks: a quiet hatched neutral surface. */
  hatched?: boolean;
}

/**
 * A bar on the room rack — a stay or a block. Purely presentational: the
 * grid positions it (absolute), dnd-kit (in the app) attaches drag handlers
 * via the forwarded ref + spread props.
 */
export const Segment = React.forwardRef<HTMLDivElement, SegmentProps>(
  ({ tone = 'occupied', selected, hatched, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-full items-center gap-1 overflow-hidden rounded-md px-2',
        'text-xs font-medium ring-1 ring-inset transition-colors',
        'cursor-pointer select-none whitespace-nowrap',
        TONE[tone],
        hatched &&
          'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(0,0,0,0.06)_5px,rgba(0,0,0,0.06)_10px)]',
        selected && 'outline-none ring-2 ring-accent-500',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Segment.displayName = 'Segment';
