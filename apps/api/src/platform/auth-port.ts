import { Injectable } from '@nestjs/common';
import type { RequestContext } from './tenant-context';

/**
 * AuthPort — the seam that keeps auth swappable. The MVP ships an internal
 * adapter; production can switch to Keycloak/WorkOS without touching callers
 * (see docs/adr/0006).
 */
export interface AuthPort {
  authenticate(headers: Record<string, string | undefined>): Promise<RequestContext | null>;
}

export const AUTH_PORT = Symbol('AUTH_PORT');

/**
 * Development-only adapter: trusts `x-tenant-id` / `x-user-id` / `x-roles`
 * headers so the stack is exercisable end-to-end before real auth lands.
 * MUST be replaced before any non-local deployment.
 */
@Injectable()
export class DevHeaderAuthAdapter implements AuthPort {
  async authenticate(
    headers: Record<string, string | undefined>,
  ): Promise<RequestContext | null> {
    const tenantId = headers['x-tenant-id'];
    const userId = headers['x-user-id'];
    if (!tenantId || !userId) return null;
    const roles = (headers['x-roles'] ?? '').split(',').filter(Boolean);
    return { tenantId, userId, roles };
  }
}
