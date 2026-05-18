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

// ── Room rack (occupancy timeline) ──

export type RoomHousekeepingStatus = 'clean' | 'dirty' | 'inspected' | 'out_of_order';
export type RoomBlockReason = 'maintenance' | 'out_of_order' | 'hold';

export interface RoomDto {
  id: string;
  propertyId: string;
  roomTypeId: string;
  number: string;
  status: RoomHousekeepingStatus;
}

export interface CreateRoomInput {
  roomTypeId: string;
  number: string;
}

/** A stay placed on a room within the requested window. `clipped` = the stay
 *  extends beyond [from,to] and was cut to the window for rendering. */
export interface RoomRackSegmentDto {
  stayId: string;
  reservationId: string;
  roomId: string;
  /** ISO date YYYY-MM-DD (clipped to the window) */
  checkIn: string;
  /** ISO date YYYY-MM-DD (clipped to the window) */
  checkOut: string;
  clipped: boolean;
  reservationStatus: ReservationStatus;
  guest: { id: string; firstName: string; lastName: string };
  adults: number;
  children: number;
  notes?: string;
}

export interface RoomBlockDto {
  id: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason: RoomBlockReason;
  note?: string;
}

export interface RoomRackRoomDto {
  id: string;
  number: string;
  housekeepingStatus: RoomHousekeepingStatus;
  segments: RoomRackSegmentDto[];
  blocks: RoomBlockDto[];
}

export interface RoomRackRoomTypeGroupDto {
  roomTypeId: string;
  code: string;
  name: string;
  capacity: number;
  rooms: RoomRackRoomDto[];
}

/** A confirmed stay with no room assigned yet — shown in the unassigned rail. */
export interface UnassignedReservationDto {
  reservationId: string;
  stayId: string;
  roomTypeId: string;
  arrival: string;
  departure: string;
  status: ReservationStatus;
  guest: { id: string; firstName: string; lastName: string };
}

export interface RoomRackDto {
  propertyId: string;
  /** ISO date YYYY-MM-DD (inclusive) */
  from: string;
  /** ISO date YYYY-MM-DD (exclusive) */
  to: string;
  groups: RoomRackRoomTypeGroupDto[];
  unassigned: UnassignedReservationDto[];
}

export interface AssignStayInput {
  /** null = unassign (move back to the rail) */
  roomId: string | null;
}

export interface ResizeStayInput {
  /** ISO date YYYY-MM-DD */
  checkIn: string;
  /** ISO date YYYY-MM-DD */
  checkOut: string;
}

export interface CreateRoomBlockInput {
  roomId: string;
  startDate: string;
  endDate: string;
  reason: RoomBlockReason;
  note?: string;
}

export interface UpdateHousekeepingInput {
  status: RoomHousekeepingStatus;
}

/** Returned by assign / resize / check-in / check-out so the client can patch
 *  its local rack optimistically before (or instead of) a full refetch. */
export interface StayMutationResultDto {
  stayId: string;
  reservationId: string;
  roomId: string | null;
  checkIn: string;
  checkOut: string;
  reservationStatus: ReservationStatus;
}

export const API_ROUTES = {
  health: '/health',
  tenantMe: '/tenants/me',
  properties: '/properties',
  reservations: '/reservations',
  integrations: '/integrations',
  roomRack: (propertyId: string) => `/properties/${propertyId}/room-rack`,
  rooms: (propertyId: string) => `/properties/${propertyId}/rooms`,
  roomBlocks: (propertyId: string) => `/properties/${propertyId}/room-blocks`,
  roomBlock: (id: string) => `/room-blocks/${id}`,
  roomHousekeeping: (roomId: string) => `/rooms/${roomId}/housekeeping`,
  stayAssignment: (stayId: string) => `/stays/${stayId}/assignment`,
  stayResize: (stayId: string) => `/stays/${stayId}`,
  reservationCheckIn: (id: string) => `/reservations/${id}/check-in`,
  reservationCheckOut: (id: string) => `/reservations/${id}/check-out`,
} as const;
