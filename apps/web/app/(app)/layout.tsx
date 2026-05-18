import Link from 'next/link';
import type { ReactNode } from 'react';
import { getMessages, DEFAULT_LOCALE } from '@vesta/i18n';

const t = getMessages(DEFAULT_LOCALE);

const nav = [
  { href: '/dashboard', label: t['nav.dashboard'] },
  { href: '/calendar', label: t['nav.calendar'] },
  { href: '/reservations', label: t['nav.reservations'] },
  { href: '/guests', label: t['nav.guests'] },
  { href: '/frontdesk', label: t['nav.frontdesk'] },
  { href: '/housekeeping', label: t['nav.housekeeping'] },
  { href: '/billing', label: t['nav.billing'] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-neutral-200 bg-neutral-0 p-4">
        <p className="px-2 pb-4 text-sm font-semibold text-neutral-900">{t['app.name']}</p>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
