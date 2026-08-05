import { useEffect, useState } from 'react';
import { getStatusMeta, type DoorStatus, type Locker, type OccupancyStatus } from '../types/locker';
import { updateLockerStatus, deleteLocker } from '../api/lockers';
import { createBooking, getBookings } from '../api/bookings';
import type { Booking } from '../types/locker';
import { useAuth } from '../context/AuthContext';
import { SizeGlyph } from './SizeGlyph';
import { BookingList } from './BookingList';
import { BookingForm } from './BookingForm';

interface Props {
  locker: Locker;
  onClose: () => void;
  onUpdated: (locker: Locker) => void;
  onDeleted: (lockerId: string) => void;
}

export function LockerDrawer({ locker, onClose, onUpdated, onDeleted }: Props) {
  const { token, isAdmin, claims } = useAuth();
  const [current, setCurrent] = useState(locker);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    setCurrent(locker);
  }, [locker]);

  useEffect(() => {
    let cancelled = false;
    setBookingsLoading(true);
    getBookings(locker.id, token)
      .then((data) => {
        if (!cancelled) setBookings(data);
      })
      .catch(() => {
        if (!cancelled) setBookings([]);
      })
      .finally(() => {
        if (!cancelled) setBookingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locker.id, token]);

  const status = getStatusMeta(current.doorStatus, current.occupancyStatus, current.isMaintenance);

  async function handleStatusChange(patch: {
    doorStatus?: DoorStatus;
    occupancyStatus?: OccupancyStatus;
    isMaintenance?: boolean;
  }) {
    if (!token) return;
    setStatusUpdating(true);
    setStatusError(null);
    try {
      const updated = await updateLockerStatus(current.id, patch, token);
      setCurrent(updated);
      onUpdated(updated);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleCreateBooking(payload: {
  lockerId: number;
  reservedBy: string;
  lockerCode: string;
  startTime: string;
  endTime: string;
  note?: string;
}) {
    if (!token) throw new Error('Debes iniciar sesión para agendar.');
    const booking = await createBooking(current.id, payload, token);
    setBookings((prev) => [...prev, booking].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    onUpdated(current);
  }

  async function handleDelete() {
    if (!token) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteLocker(current.id, token);
      onDeleted(current.id);
      onClose();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'No se pudo eliminar el casillero.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <div>
            <div className="drawer__code">{current.code}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
              <SizeGlyph size={current.size} />
              <span className="hint">Tamaño {current.size}</span>
            </div>
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <span className={`locker-tile__status tone-${status.tone}`}>{status.label}</span>

        <div className="drawer__section">
          <h3>Estado del casillero</h3>
          {isAdmin ? (
            <>
              <p className="hint" style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                Mantenimiento
              </p>
              <div className="toggle-group">
                <button
                  aria-pressed={!current.isMaintenance}
                  disabled={statusUpdating || !current.isMaintenance}
                  onClick={() => handleStatusChange({ isMaintenance: false })}
                >
                  Operativo
                </button>
                <button
                  aria-pressed={current.isMaintenance}
                  disabled={statusUpdating || current.isMaintenance}
                  onClick={() => handleStatusChange({ isMaintenance: true })}
                >
                  En mantenimiento
                </button>
              </div>

              <p className="hint" style={{ marginBottom: '0.5rem' }}>
                Puerta
              </p>
              <div className="toggle-group">
                {(['cerrado', 'abierto'] as DoorStatus[]).map((d) => (
                  <button
                    key={d}
                    aria-pressed={current.doorStatus === d}
                    disabled={statusUpdating || current.doorStatus === d || current.isMaintenance}
                    onClick={() => handleStatusChange({ doorStatus: d })}
                  >
                    {d === 'cerrado' ? 'Cerrada' : 'Abierta'}
                  </button>
                ))}
              </div>

              <p className="hint" style={{ marginBottom: '0.5rem' }}>
                Ocupación
              </p>
              <div className="toggle-group">
                {(['vacio', 'ocupado'] as OccupancyStatus[]).map((o) => (
                  <button
                    key={o}
                    aria-pressed={current.occupancyStatus === o}
                    disabled={statusUpdating || current.occupancyStatus === o || current.isMaintenance}
                    onClick={() => handleStatusChange({ occupancyStatus: o })}
                  >
                    {o === 'vacio' ? 'Vacío' : 'Ocupado'}
                  </button>
                ))}
              </div>

              {current.isMaintenance && (
                <p className="hint">
                  Mientras esté en mantenimiento no se puede cambiar puerta ni ocupación. Vuelve a "Operativo"
                  primero.
                </p>
              )}

              {statusError && <div className="banner banner-error" style={{ marginTop: '0.7rem' }}>{statusError}</div>}
            </>
          ) : (
            <p className="hint">Inicia sesión como administrador para cambiar el estado de este casillero.</p>
          )}
        </div>

        <div className="drawer__section">
          <h3>Agendamiento</h3>
          {bookingsLoading ? (
            <p className="hint">Cargando reservas…</p>
          ) : (
            <BookingList bookings={bookings} />
          )}
          {token ? (
            <BookingForm lockerCode={current.code} lockerId={current.id}userName={claims?.username ? String(claims.username) : claims?.sub ? String(claims.sub) : undefined} onSubmit={handleCreateBooking} />
          ) : (
            <p className="hint">Inicia sesión para agendar este casillero.</p>
          )}
        </div>

        {isAdmin && (
          <div className="drawer__section">
            <h3>Zona de peligro</h3>
            {deleteError && <div className="banner banner-error">{deleteError}</div>}
            {!confirmingDelete ? (
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmingDelete(true)}>
                Eliminar casillero
              </button>
            ) : (
              <div>
                <p className="hint" style={{ marginTop: 0 }}>
                  Esta acción no se puede deshacer. ¿Eliminar {current.code} definitivamente?
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
