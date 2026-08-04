import { useState, type FormEvent } from 'react';
import { createLocker } from '../api/lockers';
import type { Locker, LockerSize } from '../types/locker';
import { useAuth } from '../context/AuthContext';

interface Props {
  onCreated: (locker: Locker) => void;
}

export function CreateLockerForm({ onCreated }: Props) {
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [size, setSize] = useState<LockerSize>('M');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Debes iniciar sesión como administrador.');
      return;
    }
    if (!code.trim()) {
      setError('El código del casillero es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const locker = await createLocker({ code: code.trim(), size }, token);
      onCreated(locker);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el casillero.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      {error && <div className="banner banner-error">{error}</div>}
      <div className="field">
        <label htmlFor="locker-code">Código</label>
        <input
          id="locker-code"
          type="text"
          placeholder="Ej: A-101"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="locker-size">Tamaño</label>
        <select id="locker-size" value={size} onChange={(e) => setSize(e.target.value as LockerSize)}>
          <option value="S">S — Pequeño</option>
          <option value="M">M — Mediano</option>
          <option value="L">L — Grande</option>
        </select>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        El casillero se crea con puerta cerrada y vacío por defecto.
      </p>
      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
        {submitting ? 'Creando…' : 'Crear casillero'}
      </button>
    </form>
  );
}
