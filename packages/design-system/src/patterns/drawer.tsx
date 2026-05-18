'use client';

import * as React from 'react';
import { cn } from '../lib/cn';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** Sticky footer area (actions). */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Right-side slide-over for contextual detail (reservation, guest, actions).
 * Calm and quiet: dims the rack without hiding it, ESC / backdrop closes,
 * focus moves to the panel and is restored on close.
 */
export function Drawer({ open, onClose, title, footer, children, className }: DrawerProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true">
      <button
        aria-label="Schließen"
        className="absolute inset-0 cursor-default bg-neutral-900/20"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-full max-w-md flex-col border-l border-neutral-200',
          'bg-neutral-0 shadow-xl outline-none',
          'motion-safe:animate-[drawer-in_160ms_ease-out]',
          className,
        )}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-5">
          <div className="text-sm font-semibold text-neutral-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-neutral-500 hover:bg-neutral-100"
          >
            Schließen
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="shrink-0 border-t border-neutral-200 px-5 py-4">{footer}</footer>
        )}
      </div>
    </div>
  );
}
