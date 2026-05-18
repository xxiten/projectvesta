/**
 * @vesta/api-contracts
 *
 * Contract-first API types shared between backend and frontend.
 * Generated types (from openapi.yaml) will live in `src/generated/` once the
 * surface grows; until then these hand-written shapes are the single source of
 * truth referenced by both apps/api and apps/web.
 */

export interface HealthStatus {
  status: 'ok' | 'degraded';
  version: string;
}

export const API_ROUTES = {
  health: '/health',
} as const;
