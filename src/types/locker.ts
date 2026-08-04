// Tamaños físicos del casillero.
export type LockerSize = 'S' | 'M' | 'L';

// Estado de la puerta: independiente de si el casillero está ocupado.
export type DoorStatus = 'abierto' | 'cerrado';

// Estado de ocupación: independiente de si la puerta está abierta.
// Nota: se usa "vacio" sin tilde como valor de dominio (ver DECISIONES-FRONTEND.md).
export type OccupancyStatus = 'ocupado' | 'vacio';

export interface Locker {
  id: string;
  code: string;
  size: LockerSize;
  doorStatus: DoorStatus;
  occupancyStatus: OccupancyStatus;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  lockerId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  note?: string;
  createdAt?: string;
  // Campos opcionales por si el backend enriquece la reserva con datos del
  // casillero (evita tener que cruzar con /lockers en el cliente).
  lockerCode?: string;
  lockerSize?: LockerSize;
}

export interface StatusMeta {
  label: string;
  tone: 'available' | 'available-open' | 'occupied' | 'alert';
}

// Regla de negocio central de la vista: cruza puerta x ocupación en 4 estados
// visuales. El único estado de "alerta" real es casillero ocupado con la
// puerta abierta, porque implica un riesgo de seguridad para el contenido.
export function getStatusMeta(door: DoorStatus, occupancy: OccupancyStatus): StatusMeta {
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
