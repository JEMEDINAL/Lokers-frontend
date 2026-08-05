import { apiFetch } from './client';
import type { Booking } from '../types/locker';

export function getBookings(lockerId: string, token?: string | null): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/lockers/${lockerId}/bookings`, { token });
}

export function getMyBookings(
  reservedBy: string,
  token: string,
): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/reservations?reservedBy=${encodeURIComponent(reservedBy)}`, {
    method: 'GET',
    token,
  });
}


export interface CreateBookingPayload {
  lockerId: number;
  reservedBy: string;
  lockerCode: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export function createBooking(
  lockerId: string | number,
  payload: CreateBookingPayload,
  token: string,
): Promise<Booking> {
  return apiFetch<Booking>(`/reservations`, {
    method: 'POST',
    body: JSON.stringify(payload), 
    token,
  });
}