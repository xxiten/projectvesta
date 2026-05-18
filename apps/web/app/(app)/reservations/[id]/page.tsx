'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle, StatusBadge } from '@vesta/design-system';
import type { ReservationDto } from '@vesta/api-contracts';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 py-2 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-900">{value}</span>
    </div>
  );
}

export default function ReservationDetailPage() {
  const { ctx } = useTenant();
  const params = useParams<{ id: string }>();
  const [r, setR] = React.useState<ReservationDto | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ctx) return;
    api
      .getReservation({ tenantId: ctx.tenantId, userId: ctx.userId }, params.id)
      .then(setR)
      .catch((e) => setError((e as Error).message));
  }, [ctx, params.id]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!r) return <p className="text-sm text-neutral-500">Lädt…</p>;

  return (
    <section className="flex max-w-xl flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {r.guest.firstName} {r.guest.lastName}
          </h1>
          <Link href="/reservations" className="text-sm text-accent-600 hover:underline">
            ← Zurück zur Liste
          </Link>
        </div>
        <StatusBadge status={r.status} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Reservierung</CardTitle>
        </CardHeader>
        <CardBody>
          <Row label="Anreise" value={r.arrival} />
          <Row label="Abreise" value={r.departure} />
          <Row label="Erwachsene / Kinder" value={`${r.adults} / ${r.children}`} />
          <Row label="Betrag" value={`${(r.totalAmountMinor / 100).toFixed(2)} ${r.currency}`} />
          <Row label="Quelle" value={r.source} />
          <Row label="Gast-E-Mail" value={r.guest.email ?? '—'} />
          <Row label="Angelegt" value={new Date(r.createdAt).toLocaleString()} />
        </CardBody>
      </Card>
    </section>
  );
}
