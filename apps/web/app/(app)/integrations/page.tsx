'use client';

import * as React from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, StatusBadge } from '@vesta/design-system';
import { api, type IntegrationsOverview } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

export default function IntegrationsPage() {
  const { ctx } = useTenant();
  const scope = ctx ? { tenantId: ctx.tenantId, userId: ctx.userId } : null;
  const [data, setData] = React.useState<IntegrationsOverview | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    if (!scope) return;
    api
      .integrations(scope)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [ctx]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function connect(key: string) {
    if (!scope) return;
    setError(null);
    try {
      await api.createConnection(scope, key);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function simulate(key: string) {
    if (!scope) return;
    setError(null);
    setMsg(null);
    try {
      const res = await api.simulateWebhook(scope, key, {
        ref: `DEMO-${Date.now()}`,
        from: '2026-07-01',
        to: '2026-07-04',
        roomType: 'STD',
        ratePlan: 'BAR',
        adults: 2,
        firstName: 'Web',
        lastName: 'Gast',
        email: 'web@example.com',
        totalMinor: 43500,
      });
      setMsg(`Webhook verarbeitet: ${JSON.stringify(res)}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const connected = new Set(data?.connections.map((c) => c.connectorKey));

  return (
    <section className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Integrationen</h1>
        <p className="text-sm text-neutral-500">
          Connector-Skelett (Anti-Corruption Layer) — Dummy-Adapter
        </p>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-neutral-600">{msg}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Verfügbare Connectoren</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-3">
          {data?.connectors.map((c) => {
            const isConnected = connected.has(c.key);
            return (
              <div
                key={c.key}
                className="flex items-center justify-between rounded-md border border-neutral-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">{c.displayName}</p>
                  <p className="text-xs text-neutral-500">{c.key}</p>
                </div>
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <>
                      <StatusBadge status="connected" tone="free" />
                      <Button size="sm" variant="secondary" onClick={() => simulate(c.key)}>
                        Inbound simulieren
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => connect(c.key)}>
                      Verbinden
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>
    </section>
  );
}
