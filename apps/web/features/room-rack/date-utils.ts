import type { RackDay } from '@vesta/design-system';

const WEEKDAY = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

/** ISO YYYY-MM-DD for a Date in UTC (rack dates are date-only, UTC midnight). */
export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseIso(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function addDays(s: string, n: number): string {
  const d = parseIso(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}

export function todayIso(): string {
  return iso(new Date());
}

/** Whole days between two ISO dates (b - a). */
export function diffDays(a: string, b: string): number {
  return Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86_400_000);
}

/** Column metadata for [from, from+count). */
export function buildDays(from: string, count: number): RackDay[] {
  const today = todayIso();
  const out: RackDay[] = [];
  for (let i = 0; i < count; i++) {
    const isoDate = addDays(from, i);
    const d = parseIso(isoDate);
    const dow = d.getUTCDay();
    out.push({
      iso: isoDate,
      top: WEEKDAY[dow] ?? '',
      bottom: `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`,
      weekend: dow === 0 || dow === 6,
      isToday: isoDate === today,
    });
  }
  return out;
}
