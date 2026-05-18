'use client';

import * as React from 'react';
import { Button, Drawer, Input, StatusBadge } from '@vesta/design-system';
import type { ReservationDto, RoomRackSegmentDto } from '@vesta/api-contracts';
import { api, type Scope } from '@/lib/api-client';

export function ReservationDrawer({
  seg,
  scope,
  onClose,
  onChanged,
  onError,
}: {
  seg: RoomRackSegmentDto | null;
  scope: Scope;
  onClose: () => void;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [res, setRes] = React.useState<ReservationDto | null>(null);
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!seg) return;
    setRes(null);
    api
      .getReservation(scope, seg.reservationId)
      .then((r) => {
        setRes(r);
        setCheckIn(r.arrival);
        setCheckOut(r.departure);
      })
      .catch((e) => onError((e as Error).message));
  }, [seg, scope, onError]);

  if (!seg) return null;
  const status = res?.status ?? seg.reservationStatus;

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      onChanged(label);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={`${seg.guest.lastName}, ${seg.guest.firstName}`}
      footer={
        <div className="flex flex-wrap gap-2">
          {status === 'confirmed' && (
            <Button
              disabled={busy}
              onClick={() =>
                run('Eingecheckt', () => api.checkIn(scope, seg.reservationId, seg.stayId))
              }
            >
              Check-in
            </Button>
          )}
          {status === 'checked_in' && (
            <Button
              disabled={busy}
              onClick={() =>
                run('Ausgecheckt', () => api.checkOut(scope, seg.reservationId, seg.stayId))
              }
            >
              Check-out
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              run('Zuweisung aufgehoben', () => api.assignStay(scope, seg.stayId, { roomId: null }))
            }
          >
            Zuweisung aufheben
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 text-sm">
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          <span className="text-neutral-500">
            {seg.adults} Erw.{seg.children ? ` · ${seg.children} Ki.` : ''}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <span className="text-neutral-500">Gast</span>
          <span className="col-span-2 text-neutral-900">
            {seg.guest.lastName}, {seg.guest.firstName}
          </span>
          {res && (
            <>
              <span className="text-neutral-500">Betrag</span>
              <span className="col-span-2 tabular text-neutral-900">
                {(res.totalAmountMinor / 100).toFixed(2)} {res.currency}
              </span>
              <span className="text-neutral-500">Quelle</span>
              <span className="col-span-2 text-neutral-900">{res.source}</span>
            </>
          )}
        </div>

        {seg.notes && (
          <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-inset ring-amber-600/20">
            {seg.notes}
          </div>
        )}

        <div className="border-t border-neutral-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Aufenthalt anpassen
          </p>
          <div className="flex items-end gap-2">
            <Input
              label="Anreise"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input
              label="Abreise"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={busy || !checkIn || !checkOut}
              onClick={() =>
                run('Aufenthalt aktualisiert', () =>
                  api.resizeStay(scope, seg.stayId, { checkIn, checkOut }),
                )
              }
            >
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
