'use client';

import * as React from 'react';
import { Card, CardBody } from '@vesta/design-system';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

export default function DashboardPage() {
  const { ctx } = useTenant();
  const [stats, setStats] = React.useState<{
    reservations: number;
    confirmed: number;
    properties: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ctx) return;
    const scope = { tenantId: ctx.tenantId, userId: ctx.userId };
    Promise.all([api.listReservations(scope), api.listProperties(scope)])
      .then(([res, props]) =>
        setStats({
          reservations: res.length,
          confirmed: res.filter((r) => r.status === 'confirmed').length,
          properties: props.length,
        }),
      )
      .catch((e) => setError((e as Error).message));
  }, [ctx]);

  const cards = [
    { label: 'Reservierungen', value: stats?.reservations },
    { label: 'Bestätigt', value: stats?.confirmed },
    { label: 'Properties', value: stats?.properties },
  ];

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500">Überblick für {ctx?.tenantName}</p>
      </header>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardBody className="pt-5">
              <p className="text-sm text-neutral-500">{c.label}</p>
              <p className="tabular mt-2 text-3xl font-semibold text-neutral-900">
                {c.value ?? '—'}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
