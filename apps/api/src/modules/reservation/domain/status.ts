import type { ReservationStatus } from '@vesta/api-contracts';

/**
 * Reservation status machine (minimal for the vertical slice). The full
 * lifecycle (check-in/out, no-show automation, inventory holds) lands in
 * Epic E1/E2 — this only guards illegal transitions and date math.
 */
const TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  enquiry: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['checked_out'],
  checked_out: [],
  cancelled: [],
  no_show: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** Whole nights between two ISO dates (YYYY-MM-DD). Throws on invalid range. */
export function computeNights(arrival: string, departure: string): number {
  const a = Date.parse(`${arrival}T00:00:00Z`);
  const d = Date.parse(`${departure}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(d)) {
    throw new Error('Invalid arrival/departure date');
  }
  const nights = Math.round((d - a) / 86_400_000);
  if (nights < 1) {
    throw new Error('Departure must be at least one night after arrival');
  }
  return nights;
}

export function computeTotalMinor(baseAmountMinor: number, nights: number): number {
  return baseAmountMinor * nights;
}
