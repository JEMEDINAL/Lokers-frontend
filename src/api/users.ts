import { apiFetch } from './client';
import type { AppUser } from '../types/user';
import type { Booking } from '../types/locker';


export function getUsers(token: string): Promise<AppUser[]> {
  return apiFetch<AppUser[]>('/users', { token });
}


export function getUserBookings(reservedBy: string, token: string): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/reservations/user/${encodeURIComponent(reservedBy)}`, { token });
}

export interface CreateUserPayload {
  username: string;
  password: string;
}

export function createUser(payload: CreateUserPayload, token: string): Promise<AppUser> {
  return apiFetch<AppUser>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}
