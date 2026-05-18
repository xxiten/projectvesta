'use client';

import * as React from 'react';

export interface VestaCtx {
  tenantId: string;
  userId: string;
  tenantName: string;
}

interface CtxState {
  ctx: VestaCtx | null;
  ready: boolean;
  setCtx: (c: VestaCtx) => void;
  clear: () => void;
}

const STORAGE_KEY = 'vesta.ctx';
const TenantContext = React.createContext<CtxState | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [ctx, setCtxState] = React.useState<VestaCtx | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCtxState(JSON.parse(raw) as VestaCtx);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  const setCtx = React.useCallback((c: VestaCtx) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    setCtxState(c);
  }, []);

  const clear = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setCtxState(null);
  }, []);

  return (
    <TenantContext.Provider value={{ ctx, ready, setCtx, clear }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): CtxState {
  const v = React.useContext(TenantContext);
  if (!v) throw new Error('useTenant must be used within <TenantProvider>');
  return v;
}
