'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button, Card, CardBody } from '@vesta/design-system';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

/**
 * Placeholder login (plan decision 7): one click establishes a request scope
 * from the seeded tenant via the DEV-only /dev/context endpoint. Real
 * email/password + RBAC lands behind AuthPort later (ADR-0006).
 */
export default function LoginPage() {
  const { setCtx } = useTenant();
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function demoLogin() {
    setLoading(true);
    setError(null);
    try {
      const c = await api.devContext();
      setCtx({ tenantId: c.tenantId, userId: c.userId, tenantName: c.tenantName });
      router.replace('/plan');
    } catch (e) {
      setError((e as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <Card className="w-full max-w-sm">
        <CardBody className="flex flex-col gap-5 pt-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Vesta</p>
            <h1 className="mt-1 text-xl font-semibold text-neutral-900">Anmelden</h1>
            <p className="mt-1 text-sm text-neutral-500">Platzhalter-Login für die Testumgebung.</p>
          </div>
          <Button onClick={demoLogin} disabled={loading}>
            {loading ? 'Anmelden…' : 'Demo-Login'}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardBody>
      </Card>
    </main>
  );
}
