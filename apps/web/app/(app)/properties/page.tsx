'use client';

import * as React from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from '@vesta/design-system';
import type { PropertyDto } from '@vesta/api-contracts';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

export default function PropertiesPage() {
  const { ctx } = useTenant();
  const scope = ctx ? { tenantId: ctx.tenantId, userId: ctx.userId } : null;
  const [rows, setRows] = React.useState<PropertyDto[] | null>(null);
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    if (!scope) return;
    api
      .listProperties(scope)
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [ctx]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!scope || !name) return;
    setSaving(true);
    setError(null);
    try {
      await api.createProperty(scope, { name });
      setName('');
      load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Properties</h1>
        <p className="text-sm text-neutral-500">Häuser dieses Mandanten</p>
      </header>

      <Card>
        <CardBody className="pt-6">
          <form onSubmit={create} className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Neue Property"
                placeholder="z. B. Hotel Vesta Demo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving || !name}>
              Anlegen
            </Button>
          </form>
        </CardBody>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Table>
        <THead>
          <TR>
            <TH>Name</TH>
            <TH>Zeitzone</TH>
            <TH>Währung</TH>
          </TR>
        </THead>
        <TBody>
          {rows?.map((p) => (
            <TR key={p.id}>
              <TD>{p.name}</TD>
              <TD>{p.timezone}</TD>
              <TD>{p.currency}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </section>
  );
}
