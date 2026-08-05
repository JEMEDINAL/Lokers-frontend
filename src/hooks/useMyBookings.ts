import { useCallback, useEffect, useState } from 'react';
import { getUserBookings } from '../api/users';
import { endBooking, openBookingDoor } from '../api/bookings';
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

  const finishBooking = useCallback(
    async (bookingId: number) => {
      if (!token) return;
      await endBooking(bookingId, token);
      await refresh();
    },
    [token, refresh],
  );

  const openDoor = useCallback(
    async (bookingId: number) => {
      if (!token) return;
      await openBookingDoor(bookingId, token);
      await refresh();
    },
    [token, refresh],
  );

  return { bookings, loading, refresh, finishBooking, openDoor };
}