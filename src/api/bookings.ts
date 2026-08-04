import { apiFetch } from './client';
import type { Booking } from '../types/locker';

export function getBookings(lockerId: string, token?: string | null): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/lockers/${lockerId}/bookings`, { token });
}

export interface CreateBookingPayload {
  startTime: string;
  endTime: string;
  note?: string;
}

export function createBooking(
  lockerId: string,
  payload: CreateBookingPayload,
  token: string,
): Promise<Booking> {
  return apiFetch<Booking>(`/lockers/${lockerId}/bookings`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}
