'use client';

import * as React from 'react';
import { cn } from '../lib/cn';

export interface CommandAction {
  id: string;
  label: string;
  onSelect: () => void;
}

export interface CommandBarProps {
  actions: CommandAction[];
}

/**
 * ⌘K / Ctrl+K command bar — keyboard-first quick actions. SKELETON: simple
 * label filter only; fuzzy search, recents and grouped results land later.
 */
export function CommandBar({ actions }: CommandBarProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const filtered = actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-neutral-900/20 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-neutral-200 bg-neutral-0 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen oder Aktion…"
          className="h-12 w-full border-b border-neutral-100 px-4 text-sm outline-none"
        />
        <ul className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-neutral-500">Keine Treffer</li>
          )}
          {filtered.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => {
                  a.onSelect();
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center rounded-md px-3 py-2 text-left text-sm',
                  'text-neutral-700 hover:bg-neutral-100',
                )}
              >
                {a.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
