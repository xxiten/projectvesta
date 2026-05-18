/**
 * Frontend auth seam. The MVP backend uses an internal auth adapter behind
 * AuthPort; this module will hold the session/token plumbing and is the single
 * place to swap when Keycloak/WorkOS lands (see docs/adr/0006).
 */
export interface Session {
  userId: string;
  tenantId: string;
  roles: string[];
}

export async function getSession(): Promise<Session | null> {
  // Placeholder: wired in Epic E9 (Tenant/Access).
  return null;
}
