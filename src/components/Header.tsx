import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const { claims, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="app-header">
      <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="app-header__brand">
          Casilleros
          <small>PANEL DE CONTROL</small>
        </div>
      </Link>
      <div className="app-header__session">
        {claims ? (
          <>
            {isAdmin && (
              <Link to="/admin/usuarios" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                Usuarios
              </Link>
            )}
            <span className="app-header__badge">{isAdmin ? 'ADMIN' : 'USUARIO'} · {claims.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/register" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Crear cuenta
            </Link>
            <Link to="/login" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
