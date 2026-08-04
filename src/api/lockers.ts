import { apiFetch } from './client';
import type { DoorStatus, Locker, OccupancyStatus } from '../types/locker';

export function getLockers(token?: string | null): Promise<Locker[]> {
  return apiFetch<Locker[]>('/lockers', { token });
}

export function getLocker(id: string, token?: string | null): Promise<Locker> {
  return apiFetch<Locker>(`/lockers/${id}`, { token });
}

export interface UpdateStatusPayload {
  doorStatus?: DoorStatus;
  occupancyStatus?: OccupancyStatus;
  isMaintenance?: boolean;
}

export function updateLockerStatus(
  id: string,
  payload: UpdateStatusPayload,
  token: string,
): Promise<Locker> {
  return apiFetch<Locker>(`/lockers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export interface CreateLockerPayload {
  code: string;
  size: Locker['size'];
}


export function createLocker(payload: CreateLockerPayload, token: string): Promise<Locker> {
  return apiFetch<Locker>('/lockers', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteLocker(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/lockers/${id}`, {
    method: 'DELETE',
    token,
  });
}
