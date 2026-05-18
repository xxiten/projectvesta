import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { getContext, type RequestContext } from './tenant-context';

/**
 * Injects the authenticated request scope ({ tenantId, userId, roles }) bound
 * by TenantContextMiddleware. Endpoints that need tenant scope simply declare
 * `@Ctx() ctx: RequestContext`; missing context => 401 (placeholder auth still
 * requires the dev headers — see auth-port.ts).
 */
export const Ctx = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): RequestContext => {
    const ctx = getContext();
    if (!ctx) {
      throw new UnauthorizedException('Missing tenant context');
    }
    return ctx;
  },
);
