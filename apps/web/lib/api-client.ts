import { API_ROUTES, type HealthStatus } from '@vesta/api-contracts';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Thin typed client over the contract-first API surface. */
export const apiClient = {
  health: () => get<HealthStatus>(API_ROUTES.health),
};
