'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button, Card, CardBody, Input } from '@vesta/design-system';
import type { PropertyDto, RatePlanDto, RoomTypeDto } from '@vesta/api-contracts';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';

const selectCls =
  'h-10 rounded-md border border-neutral-200 bg-neutral-0 px-3 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500';

export default function NewReservationPage() {
  const { ctx } = useTenant();
  const router = useRouter();
  const scope = ctx ? { tenantId: ctx.tenantId, userId: ctx.userId } : null;

  const [properties, setProperties] = React.useState<PropertyDto[]>([]);
  const [roomTypes, setRoomTypes] = React.useState<RoomTypeDto[]>([]);
  const [ratePlans, setRatePlans] = React.useState<RatePlanDto[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    propertyId: '',
    roomTypeId: '',
    ratePlanId: '',
    arrival: '',
    departure: '',
    adults: 2,
    children: 0,
    firstName: '',
    lastName: '',
    email: '',
    countryCode: 'IT',
    notes: '',
  });
  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  React.useEffect(() => {
    if (!scope) return;
    api
      .listProperties(scope)
      .then(setProperties)
      .catch((e) => setError(e.message));
  }, [ctx]);

  React.useEffect(() => {
    if (!scope || !form.propertyId) return;
    Promise.all([
      api.listRoomTypes(scope, form.propertyId),
      api.listRatePlans(scope, form.propertyId),
    ])
      .then(([rt, rp]) => {
        setRoomTypes(rt);
        setRatePlans(rp);
        setForm((f) => ({
          ...f,
          roomTypeId: rt[0]?.id ?? '',
          ratePlanId: rp[0]?.id ?? '',
        }));
      })
      .catch((e) => setError(e.message));
  }, [form.propertyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!scope) return;
    setSaving(true);
    setError(null);
    try {
      const created = await api.createReservation(scope, {
        propertyId: form.propertyId,
        roomTypeId: form.roomTypeId,
        ratePlanId: form.ratePlanId,
        arrival: form.arrival,
        departure: form.departure,
        adults: Number(form.adults),
        children: Number(form.children),
        guest: {
          firstName: form.firstName,
          lastName: form.lastName,
          ...(form.email ? { email: form.email } : {}),
          ...(form.countryCode ? { countryCode: form.countryCode } : {}),
        },
        ...(form.notes ? { notes: form.notes } : {}),
      });
      router.push(`/reservations/${created.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  return (
    <section className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Neue Reservierung
        </h1>
        <p className="text-sm text-neutral-500">Direktbuchung anlegen</p>
      </header>

      <Card>
        <CardBody className="pt-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">Property</label>
              <select
                required
                className={selectCls}
                value={form.propertyId}
                onChange={(e) => set('propertyId', e.target.value)}
              >
                <option value="">– wählen –</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">Zimmertyp</label>
                <select
                  required
                  className={selectCls}
                  value={form.roomTypeId}
                  onChange={(e) => set('roomTypeId', e.target.value)}
                >
                  {roomTypes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700">Rate</label>
                <select
                  required
                  className={selectCls}
                  value={form.ratePlanId}
                  onChange={(e) => set('ratePlanId', e.target.value)}
                >
                  {ratePlans.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Anreise"
                type="date"
                required
                value={form.arrival}
                onChange={(e) => set('arrival', e.target.value)}
              />
              <Input
                label="Abreise"
                type="date"
                required
                value={form.departure}
                onChange={(e) => set('departure', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Erwachsene"
                type="number"
                min={1}
                max={12}
                value={form.adults}
                onChange={(e) => set('adults', Number(e.target.value))}
              />
              <Input
                label="Kinder"
                type="number"
                min={0}
                max={12}
                value={form.children}
                onChange={(e) => set('children', Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vorname"
                required
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
              <Input
                label="Nachname"
                required
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="E-Mail"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
              <Input
                label="Land (ISO-2)"
                value={form.countryCode}
                onChange={(e) => set('countryCode', e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Speichern…' : 'Reservierung anlegen'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </section>
  );
}
