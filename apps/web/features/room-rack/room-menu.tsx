'use client';

import * as React from 'react';
import {
  Button,
  Drawer,
  HousekeepingDot,
  Input,
  housekeepingLabel,
  type HousekeepingStatus,
} from '@vesta/design-system';
import type { RoomBlockReason } from '@vesta/api-contracts';
import { api, type Scope } from '@/lib/api-client';

const HK_STATUSES: HousekeepingStatus[] = ['clean', 'dirty', 'inspected', 'out_of_order'];
const REASONS: { value: RoomBlockReason; label: string }[] = [
  { value: 'maintenance', label: 'Wartung' },
  { value: 'out_of_order', label: 'Außer Betrieb' },
  { value: 'hold', label: 'Sperre' },
];

export interface RoomMenuTarget {
  roomId: string;
  x: number;
  y: number;
}

export function RoomMenu({
  target,
  scope,
  onClose,
  onChanged,
  onError,
  onBlock,
}: {
  target: RoomMenuTarget;
  scope: Scope;
  onClose: () => void;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
  onBlock: (roomId: string) => void;
}) {
  async function setHk(status: HousekeepingStatus) {
    try {
      await api.setHousekeeping(scope, target.roomId, { status });
      onChanged(`Status: ${housekeepingLabel[status]}`);
    } catch (e) {
      onError((e as Error).message);
    }
  }

  return (
    <>
      <button
        className="fixed inset-0 z-30 cursor-default"
        aria-label="Menü schließen"
        onClick={onClose}
      />
      <div
        className="fixed z-40 w-56 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-0 py-1 shadow-xl"
        style={{ top: target.y, left: target.x }}
      >
        <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Housekeeping
        </p>
        {HK_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              void setHk(s);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
          >
            <HousekeepingDot status={s} />
            {housekeepingLabel[s]}
          </button>
        ))}
        <div className="my-1 border-t border-neutral-100" />
        <button
          onClick={() => {
            onBlock(target.roomId);
            onClose();
          }}
          className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100"
        >
          Zimmer sperren…
        </button>
      </div>
    </>
  );
}

export function BlockDrawer({
  roomId,
  propertyId,
  scope,
  onClose,
  onChanged,
  onError,
}: {
  roomId: string;
  propertyId: string;
  scope: Scope;
  onClose: () => void;
  onChanged: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [startDate, setStart] = React.useState('');
  const [endDate, setEnd] = React.useState('');
  const [reason, setReason] = React.useState<RoomBlockReason>('maintenance');
  const [note, setNote] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.createRoomBlock(scope, propertyId, {
        roomId,
        startDate,
        endDate,
        reason,
        ...(note ? { note } : {}),
      });
      onChanged('Zimmer gesperrt');
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
      title="Zimmer sperren"
      footer={
        <Button disabled={busy || !startDate || !endDate} onClick={() => void submit()}>
          Sperren
        </Button>
      }
    >
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex gap-2">
          <Input
            label="Von"
            type="date"
            value={startDate}
            onChange={(e) => setStart(e.target.value)}
          />
          <Input label="Bis" type="date" value={endDate} onChange={(e) => setEnd(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">Grund</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as RoomBlockReason)}
            className="h-10 rounded-md border border-neutral-200 bg-neutral-0 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <Input label="Notiz" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Drawer>
  );
}
