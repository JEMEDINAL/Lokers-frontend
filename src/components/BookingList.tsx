import type { Booking } from '../types/locker';

function formatRange(startTime: string, endTime: string) {
  const opts: Intl.DateTimeFormatOptions = { dateStyle: 'short', timeStyle: 'short' };
  const start = new Date(startTime).toLocaleString('es-CO', opts);
  const end = new Date(endTime).toLocaleString('es-CO', opts);
  return `${start} → ${end}`;
}

export function BookingList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="hint">Este casillero no tiene reservas próximas.</p>;
  }

  return (
    <ul className="booking-list">
      {bookings.map((b) => (
        <li key={b.id}>
          <div className="booking-list__range">{formatRange(b.startTime, b.endTime)}</div>
          {b.note && <div className="hint">{b.note}</div>}
        </li>
      ))}
    </ul>
  );
}
