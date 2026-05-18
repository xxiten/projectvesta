import * as React from 'react';
import { cn } from '../lib/cn';

export interface RackDay {
  iso: string;
  /** top line, e.g. weekday "Mo" */
  top: string;
  /** bottom line, e.g. "12.6." */
  bottom: string;
  weekend: boolean;
  isToday?: boolean;
}

export interface RoomRackGridProps {
  days: RackDay[];
  labelWidth?: number;
  dayWidth?: number;
  /** Top-left sticky corner (e.g. "Zimmer"). */
  corner?: React.ReactNode;
  /** The scrollable body — the host app renders virtualized rows here and
   *  owns the virtualizer (scrollElement = the forwarded ref). */
  children: React.ReactNode;
  className?: string;
}

/**
 * Presentational rack scaffold: a single scroll viewport with a sticky date
 * header and a sticky left gutter. Library-agnostic — virtualization and
 * drag-and-drop live in the app and operate on the forwarded scroll element
 * and the `--rack-*` CSS variables this sets.
 */
export const RoomRackGrid = React.forwardRef<HTMLDivElement, RoomRackGridProps>(
  ({ days, labelWidth = 184, dayWidth = 46, corner, children, className }, ref) => {
    const contentWidth = labelWidth + days.length * dayWidth;
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-[calc(100vh-8.5rem)] overflow-auto rounded-lg border border-neutral-200 bg-neutral-0',
          className,
        )}
        style={
          {
            '--rack-label-w': `${labelWidth}px`,
            '--rack-day-w': `${dayWidth}px`,
          } as React.CSSProperties
        }
      >
        <div style={{ width: contentWidth }}>
          <div className="sticky top-0 z-20 flex h-12 border-b border-neutral-200 bg-neutral-0">
            <div
              className="sticky left-0 z-30 flex items-center border-r border-neutral-200 bg-neutral-0 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500"
              style={{ width: labelWidth }}
            >
              {corner}
            </div>
            {days.map((d) => (
              <div
                key={d.iso}
                className={cn(
                  'flex flex-col items-center justify-center border-r border-neutral-100 text-center',
                  d.weekend && 'bg-neutral-50',
                  d.isToday && 'bg-accent-500/10',
                )}
                style={{ width: dayWidth }}
              >
                <span className="text-[10px] font-medium uppercase text-neutral-400">{d.top}</span>
                <span
                  className={cn(
                    'tabular text-xs',
                    d.isToday ? 'font-semibold text-accent-600' : 'text-neutral-700',
                  )}
                >
                  {d.bottom}
                </span>
              </div>
            ))}
          </div>
          {children}
        </div>
      </div>
    );
  },
);
RoomRackGrid.displayName = 'RoomRackGrid';
