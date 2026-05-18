/**
 * @vesta/api-contracts
 *
 * Shared contract types — the single source of truth for BE↔FE DTO consistency.
 * The runnable OpenAPI document is generated code-first from the NestJS
 * controllers (ADR-0005 refined / ADR-0012) and published to openapi.json for
 * docs and future client generation; these hand-authored shapes are what both
 * apps/api and apps/web import directly.
 */

export interface HealthStatus {
  status: 'ok' | 'degraded';
  version: string;
}

export interface TenantDto {
  id: string;
  name: string;
}

export interface PropertyDto {
  id: string;
  name: string;
  timezone: string;
  currency: string;
}

export interface CreatePropertyInput {
  name: string;
  timezone?: string;
  currency?: string;
}

export interface RoomTypeDto {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  capacity: number;
  totalUnits: number;
}

export interface RatePlanDto {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  currency: string;
  baseAmountMinor: number;
}

export type ReservationStatus =
  | 'enquiry'
  | 'confirmed'
  | 'cancelled'
  | 'checked_in'
  | 'checked_out'
  | 'no_show';

export interface GuestInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  countryCode?: string;
}

export interface CreateReservationInput {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  /** ISO date YYYY-MM-DD */
  arrival: string;
  /** ISO date YYYY-MM-DD */
  departure: string;
  adults: number;
  children?: number;
  guest: GuestInput;
  notes?: string;
}

export interface ReservationDto {
  id: string;
  status: ReservationStatus;
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  arrival: string;
  departure: string;
  adults: number;
  children: number;
  totalAmountMinor: number;
  currency: string;
  source: string;
  guest: GuestInput & { id: string };
  createdAt: string;
}

export const API_ROUTES = {
  health: '/health',
  tenantMe: '/tenants/me',
  properties: '/properties',
  reservations: '/reservations',
  integrations: '/integrations',
} as const;
