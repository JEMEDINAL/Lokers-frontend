import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justRegistered, setJustRegistered] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      const loggedIn = await register(username, password);
      if (loggedIn) {
        navigate('/');
      } else {
        setJustRegistered(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Crear cuenta</h1>
        <p>Regístrate para poder agendar el uso de los casilleros.</p>

        {justRegistered ? (
          <>
            <div className="banner banner-success">Cuenta creada. Ahora inicia sesión.</div>
            <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Ir a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            {error && <div className="banner banner-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="reg-username">Usuario</label>
                <input
                  id="reg-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="field">
                <label htmlFor="reg-password">Contraseña</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="field">
                <label htmlFor="reg-confirm">Confirmar contraseña</label>
                <input
                  id="reg-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creando cuenta…' : 'Registrarme'}
              </button>
            </form>
            <p className="hint" style={{ marginTop: '1rem', textAlign: 'center' }}>
              ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
