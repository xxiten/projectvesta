import {
  API_ROUTES,
  type AssignStayInput,
  type CreatePropertyInput,
  type CreateReservationInput,
  type CreateRoomBlockInput,
  type CreateRoomInput,
  type HealthStatus,
  type PropertyDto,
  type RatePlanDto,
  type ReservationDto,
  type ResizeStayInput,
  type RoomBlockDto,
  type RoomDto,
  type RoomRackDto,
  type RoomTypeDto,
  type StayMutationResultDto,
  type TenantDto,
  type UpdateHousekeepingInput,
} from '@vesta/api-contracts';

// Same-origin: a Next route handler proxies /api/* to the API service at
// request time → the web image is portable across environments.
const BASE_URL = '/api';

/** Dev-header scope (placeholder auth — see api auth-port.ts / plan decision 7). */
export interface Scope {
  tenantId: string;
  userId: string;
}

interface ApiError {
  message?: string | string[];
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; scope?: Scope } = {},
): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.scope) {
    headers['x-tenant-id'] = opts.scope.tenantId;
    headers['x-user-id'] = opts.scope.userId;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    cache: 'no-store',
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const e = (await res.json()) as ApiError;
      if (e.message) msg = Array.isArray(e.message) ? e.message.join(', ') : e.message;
    } catch {
      /* non-JSON error */
    }
    throw new Error(msg);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export interface DevContext {
  tenantId: string;
  tenantName: string;
  userId: string;
  email: string;
}

export interface IntegrationsOverview {
  connectors: { key: string; displayName: string }[];
  connections: { id: string; connectorKey: string; displayName: string; status: string }[];
}

export const api = {
  health: () => request<HealthStatus>(API_ROUTES.health),
  devContext: () => request<DevContext>('/dev/context'),

  tenantMe: (scope: Scope) => request<TenantDto>(API_ROUTES.tenantMe, { scope }),

  listProperties: (scope: Scope) => request<PropertyDto[]>(API_ROUTES.properties, { scope }),
  createProperty: (scope: Scope, body: CreatePropertyInput) =>
    request<PropertyDto>(API_ROUTES.properties, { method: 'POST', body, scope }),
  listRoomTypes: (scope: Scope, propertyId: string) =>
    request<RoomTypeDto[]>(`${API_ROUTES.properties}/${propertyId}/room-types`, { scope }),
  listRatePlans: (scope: Scope, propertyId: string) =>
    request<RatePlanDto[]>(`${API_ROUTES.properties}/${propertyId}/rate-plans`, { scope }),

  listReservations: (scope: Scope) => request<ReservationDto[]>(API_ROUTES.reservations, { scope }),
  getReservation: (scope: Scope, id: string) =>
    request<ReservationDto>(`${API_ROUTES.reservations}/${id}`, { scope }),
  createReservation: (scope: Scope, body: CreateReservationInput) =>
    request<ReservationDto>(API_ROUTES.reservations, { method: 'POST', body, scope }),

  integrations: (scope: Scope) => request<IntegrationsOverview>(API_ROUTES.integrations, { scope }),
  createConnection: (scope: Scope, connectorKey: string) =>
    request<unknown>(`${API_ROUTES.integrations}/connections`, {
      method: 'POST',
      body: { connectorKey },
      scope,
    }),
  simulateWebhook: (scope: Scope, connectorKey: string, payload: unknown) =>
    request<unknown>(`${API_ROUTES.integrations}/webhooks/${connectorKey}`, {
      method: 'POST',
      body: payload,
      scope,
    }),

  // ── Room rack ──
  roomRack: (scope: Scope, propertyId: string, from: string, to: string) =>
    request<RoomRackDto>(`${API_ROUTES.roomRack(propertyId)}?from=${from}&to=${to}`, { scope }),
  listRooms: (scope: Scope, propertyId: string) =>
    request<RoomDto[]>(API_ROUTES.rooms(propertyId), { scope }),
  createRoom: (scope: Scope, propertyId: string, body: CreateRoomInput) =>
    request<RoomDto>(API_ROUTES.rooms(propertyId), { method: 'POST', body, scope }),
  assignStay: (scope: Scope, stayId: string, body: AssignStayInput) =>
    request<StayMutationResultDto>(API_ROUTES.stayAssignment(stayId), {
      method: 'PATCH',
      body,
      scope,
    }),
  resizeStay: (scope: Scope, stayId: string, body: ResizeStayInput) =>
    request<StayMutationResultDto>(API_ROUTES.stayResize(stayId), {
      method: 'PATCH',
      body,
      scope,
    }),
  checkIn: (scope: Scope, reservationId: string, stayId: string) =>
    request<StayMutationResultDto>(API_ROUTES.reservationCheckIn(reservationId), {
      method: 'POST',
      body: { stayId },
      scope,
    }),
  checkOut: (scope: Scope, reservationId: string, stayId: string) =>
    request<StayMutationResultDto>(API_ROUTES.reservationCheckOut(reservationId), {
      method: 'POST',
      body: { stayId },
      scope,
    }),
  createRoomBlock: (scope: Scope, propertyId: string, body: CreateRoomBlockInput) =>
    request<RoomBlockDto>(API_ROUTES.roomBlocks(propertyId), {
      method: 'POST',
      body,
      scope,
    }),
  deleteRoomBlock: (scope: Scope, id: string) =>
    request<void>(API_ROUTES.roomBlock(id), { method: 'DELETE', scope }),
  setHousekeeping: (scope: Scope, roomId: string, body: UpdateHousekeepingInput) =>
    request<RoomDto>(API_ROUTES.roomHousekeeping(roomId), {
      method: 'PATCH',
      body,
      scope,
    }),
};
