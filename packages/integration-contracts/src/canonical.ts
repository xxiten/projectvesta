/**
 * Canonical Data Model — the stable, provider-agnostic shapes the integrations
 * hub translates external payloads into and out of. Versioned independently of
 * any external API.
 */

export type IsoDate = string; // YYYY-MM-DD
export type IsoDateTime = string; // RFC 3339
export type CurrencyCode = string; // ISO 4217, e.g. "EUR"

export interface CanonicalMoney {
  /** Minor units (cents). Avoids floating point in money math. */
  amountMinor: number;
  currency: CurrencyCode;
}

export interface CanonicalGuest {
  externalId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  language?: string;
}

export interface CanonicalReservation {
  externalId: string;
  source: string; // connector key, e.g. "channelx.v2"
  status: 'confirmed' | 'cancelled' | 'modified';
  arrival: IsoDate;
  departure: IsoDate;
  roomTypeCode: string;
  ratePlanCode: string;
  occupancy: { adults: number; children: number };
  totalAmount: CanonicalMoney;
  primaryGuest: CanonicalGuest;
  notes?: string;
}

export interface CanonicalAvailability {
  roomTypeCode: string;
  date: IsoDate;
  available: number;
}

export interface CanonicalRate {
  ratePlanCode: string;
  roomTypeCode: string;
  date: IsoDate;
  amount: CanonicalMoney;
  minLengthOfStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

export interface CanonicalInvoice {
  externalId: string;
  number: string;
  issuedAt: IsoDateTime;
  lines: Array<{ description: string; quantity: number; unitAmount: CanonicalMoney }>;
  total: CanonicalMoney;
}
