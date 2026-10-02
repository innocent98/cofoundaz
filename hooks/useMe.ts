import { useState, useEffect } from 'react';
import { getMe, type MeResponse } from '@/lib/api/profile';
import { ApiError } from '@/lib/api/client';

/**
 * Reads the signed-in user from `GET /auth/me` (email, profile, memberships,
 * active workspace). Used by the sidebar profile menu and the account page.
 */
export function useMe() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getMe();
        if (!active) return;
        setMe(data);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          console.warn('Profile unauthorized:', err.message);
        } else {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { me, loading, error };
}
