'use client';

import Link from 'next/link';
import * as React from 'react';
import { Button, StatusBadge, Table, TBody, TD, TH, THead, TR } from '@vesta/design-system';
import type { ReservationDto } from '@vesta/api-contracts';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

export default function ReservationsPage() {
  const { ctx } = useTenant();
  const [rows, setRows] = React.useState<ReservationDto[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ctx) return;
    api
      .listReservations({ tenantId: ctx.tenantId, userId: ctx.userId })
      .then(setRows)
      .catch((e) => setError((e as Error).message));
  }, [ctx]);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Reservierungen</h1>
          <p className="text-sm text-neutral-500">Alle Buchungen dieses Mandanten</p>
        </div>
        <Link href="/reservations/new">
          <Button>Neue Reservierung</Button>
        </Link>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <THead>
          <TR>
            <TH>Gast</TH>
            <TH>Anreise</TH>
            <TH>Abreise</TH>
            <TH>Status</TH>
            <TH className="text-right">Betrag</TH>
          </TR>
        </THead>
        <TBody>
          {rows?.map((r) => (
            <TR key={r.id} className="hover:bg-neutral-50">
              <TD>
                <Link href={`/reservations/${r.id}`} className="text-accent-600 hover:underline">
                  {r.guest.lastName}, {r.guest.firstName}
                </Link>
              </TD>
              <TD>{r.arrival}</TD>
              <TD>{r.departure}</TD>
              <TD>
                <StatusBadge status={r.status} />
              </TD>
              <TD className="tabular text-right">
                {(r.totalAmountMinor / 100).toFixed(2)} {r.currency}
              </TD>
            </TR>
          ))}
          {rows && rows.length === 0 && (
            <TR>
              <TD className="text-neutral-500" colSpan={5}>
                Noch keine Reservierungen.
              </TD>
            </TR>
          )}
        </TBody>
      </Table>
    </section>
  );
}
