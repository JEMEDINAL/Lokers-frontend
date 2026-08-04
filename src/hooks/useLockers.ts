import { useCallback, useEffect, useState } from 'react';
import { getLockers } from '../api/lockers';
import type { Locker } from '../types/locker';
import { useAuth } from '../context/AuthContext';

export function useLockers() {
  const { token } = useAuth();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLockers(token);
      setLockers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los casilleros');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { lockers, loading, error, refresh };
}
