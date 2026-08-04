import { useState, type FormEvent } from 'react';
import { createUser } from '../api/users';
import type { AppUser } from '../types/user';
import { useAuth } from '../context/AuthContext';

interface Props {
  onCreated: (user: AppUser) => void;
}

export function CreateAdminForm({ onCreated }: Props) {
  const { token } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Debes iniciar sesión como administrador.');
      return;
    }
    if (!username.trim()) {
      setError('El usuario es obligatorio.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await createUser({ username: username.trim(), password}, token);
      onCreated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el administrador.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      {error && <div className="banner banner-error">{error}</div>}
      <div className="field">
        <label htmlFor="admin-username">Usuario</label>
        <input
          id="admin-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="admin-password">Contraseña</label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <div className="field">
        <label htmlFor="admin-confirm">Confirmar contraseña</label>
        <input
          id="admin-confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
        {submitting ? 'Creando…' : 'Crear administrador'}
      </button>
    </form>
  );
}
