import { AsyncLocalStorage } from 'node:async_hooks';

/** The authenticated principal scope carried through a request. */
export interface RequestContext {
  tenantId: string;
  userId: string;
  roles: string[];
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithContext<T>(ctx: RequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getContext(): RequestContext | undefined {
  return storage.getStore();
}

export function requireContext(): RequestContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error('No request context — tenant scope is required for this operation');
  }
  return ctx;
}
