'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { AppShell, Button, CommandBar, cn } from '@vesta/design-system';
import { getMessages, DEFAULT_LOCALE } from '@vesta/i18n';
import { useTenant } from '@/lib/tenant-context';

const t = getMessages(DEFAULT_LOCALE);

const NAV = [
  { href: '/plan', label: t['nav.roomrack'] },
  { href: '/dashboard', label: t['nav.dashboard'] },
  { href: '/reservations', label: t['nav.reservations'] },
  { href: '/properties', label: 'Properties' },
  { href: '/integrations', label: 'Integrationen' },
];

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const { ctx, ready, clear } = useTenant();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (ready && !ctx) router.replace('/login');
  }, [ready, ctx, router]);

  if (!ready || !ctx) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">
        Lädt…
      </div>
    );
  }

  const commandActions = NAV.map((n) => ({
    id: n.href,
    label: `Gehe zu: ${n.label}`,
    onSelect: () => router.push(n.href),
  }));

  return (
    <>
      <AppShell
        fluid={pathname === '/plan' || pathname.startsWith('/plan/')}
        brand={<span className="text-neutral-900">{t['app.name']}</span>}
        sidebar={
          <div className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm',
                    active
                      ? 'bg-neutral-100 font-medium text-neutral-900'
                      : 'text-neutral-700 hover:bg-neutral-50',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        }
        topbar={
          <>
            <div className="flex items-center gap-3 text-sm">
              <span className="font-medium text-neutral-900">{ctx.tenantName}</span>
              <kbd className="rounded border border-neutral-200 px-1.5 py-0.5 text-xs text-neutral-500">
                ⌘K
              </kbd>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clear();
                router.replace('/login');
              }}
            >
              Abmelden
            </Button>
          </>
        }
      >
        {children}
      </AppShell>
      <CommandBar actions={commandActions} />
    </>
  );
}
