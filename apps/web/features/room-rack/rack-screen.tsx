'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Button, RoomRackGrid, cn } from '@vesta/design-system';
import type { PropertyDto, RoomRackDto, RoomRackSegmentDto } from '@vesta/api-contracts';
import { api } from '@/lib/api-client';
import { useTenant } from '@/lib/tenant-context';
import { addDays, buildDays, todayIso } from './date-utils';
import { RackBody } from './rack-body';
import { ReservationDrawer } from './reservation-drawer';
import { BlockDrawer, RoomMenu, type RoomMenuTarget } from './room-menu';
import { useRoomRack } from './use-room-rack';

const ZOOMS = [14, 21, 31];

type Toast = { kind: 'ok' | 'err'; msg: string } | null;

function filterRack(data: RoomRackDto, q: string): RoomRackDto {
  const needle = q.trim().toLowerCase();
  if (!needle) return data;
  const match = (s: string) => s.toLowerCase().includes(needle);
  const groups = data.groups
    .map((g) => ({
      ...g,
      rooms: g.rooms.filter(
        (r) =>
          match(r.number) ||
          r.segments.some((s) => match(`${s.guest.lastName} ${s.guest.firstName}`)),
      ),
    }))
    .filter((g) => g.rooms.length > 0);
  const unassigned = data.unassigned.filter((u) =>
    match(`${u.guest.lastName} ${u.guest.firstName}`),
  );
  return { ...data, groups, unassigned };
}

export function RackScreen() {
  const { ctx } = useTenant();
  const scope = ctx ? { tenantId: ctx.tenantId, userId: ctx.userId } : null;

  const [properties, setProperties] = React.useState<PropertyDto[]>([]);
  const [propertyId, setPropertyId] = React.useState<string | null>(null);
  const [anchor, setAnchor] = React.useState(todayIso());
  const [windowDays, setWindowDays] = React.useState(14);
  const [query, setQuery] = React.useState('');
  const [toast, setToast] = React.useState<Toast>(null);
  const [openSeg, setOpenSeg] = React.useState<RoomRackSegmentDto | null>(null);
  const [menu, setMenu] = React.useState<RoomMenuTarget | null>(null);
  const [blockRoom, setBlockRoom] = React.useState<string | null>(null);
  const [dragLabel, setDragLabel] = React.useState<string | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const from = anchor;
  const to = addDays(anchor, windowDays);
  const days = React.useMemo(() => buildDays(from, windowDays), [from, windowDays]);

  const { data, error, loading, reload } = useRoomRack(scope, propertyId, from, to);

  React.useEffect(() => {
    if (!scope) return;
    api
      .listProperties(scope)
      .then((p) => {
        setProperties(p);
        setPropertyId((id) => id ?? p[0]?.id ?? null);
      })
      .catch((e) => setToast({ kind: 'err', msg: (e as Error).message }));
  }, [ctx]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  function onDragStart(e: DragStartEvent) {
    setDragLabel((e.active.data.current?.label as string) ?? 'Reservierung');
  }

  async function onDragEnd(e: DragEndEvent) {
    setDragLabel(null);
    const overId = e.over?.id;
    const stayId = e.active.data.current?.stayId as string | undefined;
    if (!scope || !stayId || typeof overId !== 'string' || !overId.startsWith('room:')) return;
    const roomId = overId.slice('room:'.length);
    try {
      await api.assignStay(scope, stayId, { roomId });
      setToast({ kind: 'ok', msg: 'Zimmer zugewiesen' });
      reload();
    } catch (err) {
      setToast({ kind: 'err', msg: (err as Error).message });
      reload();
    }
  }

  const view = data ? filterRack(data, query) : null;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Zimmerplan</h1>
          <p className="text-sm text-neutral-500">Belegung, Zuweisung & Tagessteuerung</p>
        </div>
        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <select
              value={propertyId ?? ''}
              onChange={(e) => setPropertyId(e.target.value)}
              className="h-9 rounded-md border border-neutral-200 bg-neutral-0 px-2 text-sm"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zimmer oder Gast…"
            className="h-9 w-52 rounded-md border border-neutral-200 bg-neutral-0 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setAnchor(addDays(anchor, -7))}>
            ‹
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setAnchor(todayIso())}>
            Heute
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAnchor(addDays(anchor, 7))}>
            ›
          </Button>
          <input
            type="date"
            value={anchor}
            onChange={(e) => e.target.value && setAnchor(e.target.value)}
            className="ml-2 h-9 rounded-md border border-neutral-200 bg-neutral-0 px-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-1">
          {ZOOMS.map((z) => (
            <Button
              key={z}
              size="sm"
              variant={z === windowDays ? 'secondary' : 'ghost'}
              onClick={() => setWindowDays(z)}
            >
              {z} T
            </Button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {view && view.unassigned.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2">
            <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-amber-700">
              Nicht zugewiesen
            </span>
            {view.unassigned.map((u) => (
              <UnassignedChip
                key={u.stayId}
                stayId={u.stayId}
                label={`${u.guest.lastName}, ${u.guest.firstName}`}
                sub={`${u.arrival}→${u.departure}`}
              />
            ))}
          </div>
        )}

        <RoomRackGrid ref={scrollRef} days={days} corner="Zimmer">
          {view ? (
            <RackBody
              data={view}
              from={from}
              days={windowDays}
              scrollRef={scrollRef}
              onOpenSegment={setOpenSeg}
              onOpenRoomMenu={(roomId, el) => {
                const r = el.getBoundingClientRect();
                setMenu({ roomId, x: Math.min(r.left, window.innerWidth - 240), y: r.bottom + 4 });
              }}
            />
          ) : (
            <div className="p-8 text-sm text-neutral-500">{loading ? 'Lädt…' : 'Keine Daten'}</div>
          )}
        </RoomRackGrid>

        <DragOverlay>
          {dragLabel && (
            <div className="rounded-md bg-accent-500 px-2 py-1 text-xs font-medium text-white shadow-lg">
              {dragLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {scope && openSeg && (
        <ReservationDrawer
          seg={openSeg}
          scope={scope}
          onClose={() => setOpenSeg(null)}
          onChanged={(m) => {
            setOpenSeg(null);
            setToast({ kind: 'ok', msg: m });
            reload();
          }}
          onError={(m) => setToast({ kind: 'err', msg: m })}
        />
      )}

      {scope && menu && (
        <RoomMenu
          target={menu}
          scope={scope}
          onClose={() => setMenu(null)}
          onChanged={(m) => {
            setToast({ kind: 'ok', msg: m });
            reload();
          }}
          onError={(m) => setToast({ kind: 'err', msg: m })}
          onBlock={(roomId) => setBlockRoom(roomId)}
        />
      )}

      {scope && blockRoom && propertyId && (
        <BlockDrawer
          roomId={blockRoom}
          propertyId={propertyId}
          scope={scope}
          onClose={() => setBlockRoom(null)}
          onChanged={(m) => {
            setBlockRoom(null);
            setToast({ kind: 'ok', msg: m });
            reload();
          }}
          onError={(m) => setToast({ kind: 'err', msg: m })}
        />
      )}

      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 rounded-md px-4 py-2 text-sm shadow-lg',
            toast.kind === 'ok' ? 'bg-neutral-900 text-neutral-0' : 'bg-red-600 text-white',
          )}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function UnassignedChip({ stayId, label, sub }: { stayId: string; label: string; sub: string }) {
  const drag = useDraggable({ id: `stay:${stayId}`, data: { stayId, label } });
  return (
    <button
      ref={drag.setNodeRef}
      {...drag.attributes}
      {...drag.listeners}
      className="shrink-0 cursor-grab rounded-md border border-amber-300 bg-neutral-0 px-2 py-1 text-left text-xs hover:bg-amber-100"
      style={{ opacity: drag.isDragging ? 0.4 : 1 }}
    >
      <span className="block font-medium text-neutral-800">{label}</span>
      <span className="block tabular text-neutral-500">{sub}</span>
    </button>
  );
}
