import { useState, type FormEvent } from 'react';

interface Props {
  lockerId: string | number;
  lockerCode: string;
  userName?: string | number;
  onSubmit: (payload: {
    lockerId: number;
    reservedBy: string; 
    lockerCode: string;
    startTime: string;
    endTime: string;
    note?: string;
  }) => Promise<void>;
}

export function BookingForm({lockerId,lockerCode,userName, onSubmit }: Props) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!start || !end) {
      setError('Selecciona la fecha/hora de inicio y de fin.');
      return;
    }
    if (new Date(end) <= new Date(start)) {
      setError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
   const payload = {
      lockerId: Number(lockerId),
      reservedBy: userName ? String(userName) : 'Usuario anónimo',
      lockerCode,
      startTime: new Date(start).toISOString(),
      endTime: new Date(end).toISOString(),
      note: note || undefined,
    };


    setSubmitting(true);
    try {
      await onSubmit(payload);
      setStart('');
      setEnd('');
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la reserva.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      {error && <ErrorInline message={error} />}
      <div className="field">
        <label htmlFor="booking-start">Inicio</label>
        <input
          id="booking-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="booking-end">Fin</label>
        <input id="booking-end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="booking-note">Nota (opcional)</label>
        <input
          id="booking-note"
          type="text"
          placeholder="Ej: mantenimiento programado"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
        {submitting ? 'Agendando…' : 'Agendar casillero'}
      </button>
    </form>
  );
}

function ErrorInline({ message }: { message: string }) {
  return <div className="banner banner-error">{message}</div>;
}
