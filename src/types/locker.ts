
export type LockerSize = 'S' | 'M' | 'L';


export type DoorStatus = 'abierto' | 'cerrado';


export type OccupancyStatus = 'ocupado' | 'vacio';

export interface Locker {
  id: string;
  code: string;
  size: LockerSize;
  doorStatus: DoorStatus;
  occupancyStatus: OccupancyStatus;
  isMaintenance: boolean;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  lockerId: string;
  startTime: string;
  endTime: string;
  note?: string;
  createdAt?: string;
  lockerCode?: string;
  lockerSize?: LockerSize;
}
export interface StatusMeta {
  label: string;
  tone: 'available' | 'available-open' | 'occupied' | 'alert' | 'maintenance';
}


export function getStatusMeta(
  door: DoorStatus,
  occupancy: OccupancyStatus,
  isMaintenance = false,
): StatusMeta {
  if (isMaintenance) {
    return { label: 'En mantenimiento', tone: 'maintenance' };
  }
  if (occupancy === 'vacio' && door === 'cerrado') {
    return { label: 'Disponible', tone: 'available' };
  }
  if (occupancy === 'vacio' && door === 'abierto') {
    return { label: 'Disponible · puerta abierta', tone: 'available-open' };
  }
  if (occupancy === 'ocupado' && door === 'cerrado') {
    return { label: 'Ocupado', tone: 'occupied' };
  }
  return { label: 'Ocupado · puerta abierta', tone: 'alert' };
}
