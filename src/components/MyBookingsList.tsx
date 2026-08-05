import { useState } from 'react';
import type { Booking } from '../types/locker';
import { SizeGlyph } from './SizeGlyph';

function formatRange(startTime: string, endTime: string) {
  const opts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' };
  const start = new Date(startTime).toLocaleString('es-CO', opts);
  const end = new Date(endTime).toLocaleString('es-CO', opts);
  return `${start} → ${end}`;
}

interface Props {
  bookings: Booking[];
  onEndBooking: (bookingId: number) => Promise<void>;
  onOpenDoor: (bookingId: number) => Promise<void>;
}

export function MyBookingsList({ bookings, onEndBooking, onOpenDoor }: Props) {
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [errorId, setErrorId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (bookings.length === 0) {
    return <div className="empty-state">Todavía no tienes reservas. Selecciona un casillero para agendar una.</div>;
  }

  const sorted = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));

  async function handleAction(bookingId: number, action: (id: number) => Promise<void>) {
    setPendingId(bookingId);
    setErrorId(null);
    try {
      await action(bookingId);
    } catch (err) {
      setErrorId(bookingId);
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo completar la acción.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <ul className="booking-list">
      {sorted.map((b) => (
        <li key={b.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SizeGlyph size={b.locker.size} />
            <strong>{b.codeLoker}</strong>
          </div>
          <div className="booking-list__range">{formatRange(b.startTime, b.endTime)}</div>
          {b.note && <div className="hint">{b.note}</div>}
          {errorId === b.id && <div className="banner banner-error">{errorMsg}</div>}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pendingId === b.id}
              onClick={() => handleAction(b.id, onOpenDoor)}
            >
              {pendingId === b.id ? 'Abriendo…' : 'Abrir puerta'}
            </button>
            <button
              className="btn btn-danger btn-sm"
              disabled={pendingId === b.id}
              onClick={() => handleAction(b.id, onEndBooking)}
            >
              {pendingId === b.id ? 'Terminando…' : 'Terminar reserva'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}