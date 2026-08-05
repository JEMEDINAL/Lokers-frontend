import { useCallback, useEffect, useState } from 'react';
import { getUserBookings } from '../api/users';
import type { Booking } from '../types/locker';
import { useAuth } from '../context/AuthContext';

export function useMyBookings() {
  const { token, claims, isAdmin } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!token || !claims || isAdmin) {
      setBookings([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getUserBookings(String(claims.username), token);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token, claims, isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bookings, loading, refresh };
}