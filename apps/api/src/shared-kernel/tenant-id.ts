/**
 * Branded TenantId — prevents accidentally passing an arbitrary string where a
 * tenant scope is required (a class of multi-tenant data-leak bugs).
 */
declare const brand: unique symbol;
export type TenantId = string & { readonly [brand]: 'TenantId' };

export function makeTenantId(value: string): TenantId {
  if (!value || value.trim().length === 0) {
    throw new Error('TenantId must be a non-empty string');
  }
  return value as TenantId;
}

export function isTenantId(value: unknown): value is TenantId {
  return typeof value === 'string' && value.trim().length > 0;
}
