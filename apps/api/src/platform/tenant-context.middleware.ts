import { Inject, Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AUTH_PORT, type AuthPort } from './auth-port';
import { runWithContext } from './tenant-context';

/**
 * Resolves the authenticated principal and binds the tenant scope for the
 * lifetime of the request via AsyncLocalStorage. Routes that opt out of
 * tenant scope (e.g. /health) simply never call requireContext().
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(@Inject(AUTH_PORT) private readonly auth: AuthPort) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const headers = req.headers as Record<string, string | undefined>;
    const ctx = await this.auth.authenticate(headers);
    if (!ctx) {
      next();
      return;
    }
    runWithContext(ctx, () => next());
  }
}
