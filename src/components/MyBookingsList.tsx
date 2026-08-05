import type { Booking } from '../types/locker';
import { SizeGlyph } from './SizeGlyph';

function formatRange(startTime: string, endTime: string) {
  const opts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' };
  const start = new Date(startTime).toLocaleString('es-CO', opts);
  const end = new Date(endTime).toLocaleString('es-CO', opts);
  return `${start} → ${end}`;
}

export function MyBookingsList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <div className="empty-state">Todavía no tienes reservas. Selecciona un casillero para agendar una.</div>;
  }

  const sorted = [...bookings].sort((a, b) => a.startTime.localeCompare(b.startTime));

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
        </li>
      ))}
    </ul>
  );
}