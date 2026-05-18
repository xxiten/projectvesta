'use client';

import * as React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  cn,
  HousekeepingDot,
  Segment,
  type HousekeepingStatus,
  type SegmentTone,
} from '@vesta/design-system';
import type {
  ReservationStatus,
  RoomRackDto,
  RoomRackRoomDto,
  RoomRackSegmentDto,
} from '@vesta/api-contracts';
import { diffDays } from './date-utils';

export const LABEL_W = 200;
export const DAY_W = 46;
const ROW_H = 44;
const GROUP_H = 34;

const STATUS_TONE: Record<ReservationStatus, SegmentTone> = {
  enquiry: 'option',
  confirmed: 'occupied',
  checked_in: 'occupied',
  checked_out: 'neutral',
  cancelled: 'neutral',
  no_show: 'conflict',
};

type Row =
  | { kind: 'group'; key: string; code: string; name: string }
  | { kind: 'room'; key: string; roomTypeId: string; room: RoomRackRoomDto };

function flatten(data: RoomRackDto): Row[] {
  const rows: Row[] = [];
  for (const g of data.groups) {
    rows.push({ kind: 'group', key: `g:${g.roomTypeId}`, code: g.code, name: g.name });
    for (const room of g.rooms) {
      rows.push({ kind: 'room', key: `r:${room.id}`, roomTypeId: g.roomTypeId, room });
    }
  }
  return rows;
}

function SegmentBlock({
  seg,
  from,
  onOpen,
}: {
  seg: RoomRackSegmentDto;
  from: string;
  onOpen: (s: RoomRackSegmentDto) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `stay:${seg.stayId}`,
    data: {
      stayId: seg.stayId,
      reservationId: seg.reservationId,
      label: `${seg.guest.lastName}, ${seg.guest.firstName}`,
    },
  });
  const left = diffDays(from, seg.checkIn) * DAY_W;
  const width = Math.max(diffDays(seg.checkIn, seg.checkOut), 1) * DAY_W;
  return (
    <div
      className="absolute py-1"
      style={{ left, width, top: 0, height: ROW_H, opacity: isDragging ? 0.4 : 1 }}
    >
      <Segment
        ref={setNodeRef}
        tone={STATUS_TONE[seg.reservationStatus]}
        onClick={() => onOpen(seg)}
        title={`${seg.guest.lastName}, ${seg.guest.firstName}`}
        {...attributes}
        {...listeners}
      >
        {seg.notes ? '• ' : ''}
        {seg.guest.lastName}, {seg.guest.firstName}
      </Segment>
    </div>
  );
}

function RoomRow({
  row,
  from,
  dayCount,
  onOpenSegment,
  onOpenRoomMenu,
}: {
  row: Extract<Row, { kind: 'room' }>;
  from: string;
  dayCount: number;
  onOpenSegment: (s: RoomRackSegmentDto) => void;
  onOpenRoomMenu: (roomId: string, anchor: HTMLElement) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `room:${row.room.id}`,
    data: { roomId: row.room.id },
  });
  const trackW = dayCount * DAY_W;
  return (
    <div className="flex border-b border-neutral-100" style={{ height: ROW_H }}>
      <div
        className="sticky left-0 z-10 flex items-center justify-between gap-2 border-r border-neutral-200 bg-neutral-0 px-4"
        style={{ width: LABEL_W }}
      >
        <span className="flex items-center gap-2 text-sm text-neutral-800">
          <HousekeepingDot status={row.room.housekeepingStatus as HousekeepingStatus} />
          {row.room.number}
        </span>
        <button
          aria-label="Zimmer-Aktionen"
          onClick={(e) => onOpenRoomMenu(row.room.id, e.currentTarget)}
          className="rounded px-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
        >
          ⋯
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn('relative', isOver && 'bg-accent-500/5')}
        style={{ width: trackW }}
      >
        {Array.from({ length: dayCount }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full border-r border-neutral-100"
            style={{ left: i * DAY_W, width: DAY_W }}
          />
        ))}
        {row.room.blocks.map((b) => {
          const left = Math.max(diffDays(from, b.startDate), 0) * DAY_W;
          const width = Math.max(diffDays(b.startDate, b.endDate), 1) * DAY_W;
          return (
            <div
              key={b.id}
              className="absolute py-1"
              style={{ left, width, top: 0, height: ROW_H }}
            >
              <Segment tone="neutral" hatched title={b.note ?? b.reason}>
                {b.reason === 'maintenance'
                  ? 'Wartung'
                  : b.reason === 'hold'
                    ? 'Sperre'
                    : 'Außer Betrieb'}
              </Segment>
            </div>
          );
        })}
        {row.room.segments.map((s) => (
          <SegmentBlock key={s.stayId} seg={s} from={from} onOpen={onOpenSegment} />
        ))}
      </div>
    </div>
  );
}

export function RackBody({
  data,
  from,
  days,
  scrollRef,
  onOpenSegment,
  onOpenRoomMenu,
}: {
  data: RoomRackDto;
  from: string;
  days: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onOpenSegment: (s: RoomRackSegmentDto) => void;
  onOpenRoomMenu: (roomId: string, anchor: HTMLElement) => void;
}) {
  const rows = React.useMemo(() => flatten(data), [data]);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (rows[i]?.kind === 'group' ? GROUP_H : ROW_H),
    overscan: 8,
  });
  const contentW = LABEL_W + days * DAY_W;

  return (
    <div className="relative" style={{ height: virtualizer.getTotalSize(), width: contentW }}>
      {virtualizer.getVirtualItems().map((vi) => {
        const row = rows[vi.index];
        if (!row) return null;
        const common = {
          position: 'absolute' as const,
          top: vi.start,
          left: 0,
          width: contentW,
        };
        if (row.kind === 'group') {
          return (
            <div
              key={row.key}
              style={{ ...common, height: GROUP_H }}
              className="flex items-center border-b border-neutral-200 bg-neutral-50"
            >
              <div
                className="sticky left-0 z-10 bg-neutral-50 px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500"
                style={{ width: LABEL_W }}
              >
                {row.code} · {row.name}
              </div>
            </div>
          );
        }
        return (
          <div key={row.key} style={{ ...common, height: ROW_H }}>
            <RoomRow
              row={row}
              from={from}
              dayCount={days}
              onOpenSegment={onOpenSegment}
              onOpenRoomMenu={onOpenRoomMenu}
            />
          </div>
        );
      })}
    </div>
  );
}
