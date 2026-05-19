'use client';

import * as React from 'react';
import type { RoomRackDto } from '@vesta/api-contracts';
import { api, type Scope } from '@/lib/api-client';

interface State {
  data: RoomRackDto | null;
  error: string | null;
  loading: boolean;
}

/** Fetches the bounded rack for [from,to). `reload` re-pulls the same window
 *  (used after every mutation — optimistic UI is layered on top in the screen). */
export function useRoomRack(
  scope: Scope | null,
  propertyId: string | null,
  from: string,
  to: string,
): State & { reload: () => void } {
  const [state, setState] = React.useState<State>({
    data: null,
    error: null,
    loading: false,
  });
  const [nonce, setNonce] = React.useState(0);
  const reload = React.useCallback(() => setNonce((n) => n + 1), []);

  React.useEffect(() => {
    if (!scope || !propertyId) return;
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api
      .roomRack(scope, propertyId, from, to)
      .then((data) => live && setState({ data, error: null, loading: false }))
      .catch(
        (e) => live && setState((s) => ({ ...s, error: (e as Error).message, loading: false })),
      );
    return () => {
      live = false;
    };
    // Depend on primitive identity, not the scope object reference.
  }, [scope?.tenantId, scope?.userId, propertyId, from, to, nonce]);

  return { ...state, reload };
}
