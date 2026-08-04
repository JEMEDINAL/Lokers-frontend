import { apiFetch } from './client';
import type { AppUser } from '../types/user';
import type { Booking } from '../types/locker';

// GET /users (protegido, solo admin) — lista de usuarios registrados.
export function getUsers(token: string): Promise<AppUser[]> {
  return apiFetch<AppUser[]>('/users', { token });
}

// GET /users/:id/bookings (protegido, solo admin) — casilleros que ese
// usuario tiene o ha tenido reservados/en uso.
export function getUserBookings(userId: string, token: string): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/users/${userId}/bookings`, { token });
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
