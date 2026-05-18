import * as React from 'react';
import { cn } from '../lib/cn';

export interface AppShellProps {
  brand?: React.ReactNode;
  /** Sidebar content (the host app composes its own nav/links). */
  sidebar: React.ReactNode;
  /** Top bar content (tenant/property switch, search trigger, profile). */
  topbar?: React.ReactNode;
  /** Data-dense screens (e.g. the room rack) want the full width and tighter
   *  padding instead of the centered reading column. */
  fluid?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Operative app shell — calm, desktop-first, framework-agnostic (no router
 * coupling; the host app injects its own links). Quiet surfaces, generous
 * whitespace, one clear content column.
 */
export function AppShell({ brand, sidebar, topbar, fluid, children, className }: AppShellProps) {
  return (
    <div className={cn('flex min-h-screen bg-neutral-50 text-neutral-900', className)}>
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-0">
        <div className="flex h-14 items-center px-5 text-sm font-semibold tracking-tight">
          {brand}
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">{sidebar}</nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-neutral-200 bg-neutral-0/80 px-6 backdrop-blur">
          {topbar}
        </header>
        <main className={cn('flex-1 overflow-y-auto', fluid ? 'px-6 py-5' : 'px-8 py-8')}>
          <div className={cn(!fluid && 'mx-auto max-w-6xl')}>{children}</div>
        </main>
      </div>
    </div>
  );
}
