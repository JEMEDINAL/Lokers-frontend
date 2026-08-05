import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUsers, getUserBookings } from '../api/users';
import { getLockers } from '../api/lockers';
import type { AppUser } from '../types/user';
import type { Booking, Locker } from '../types/locker';
import { ErrorBanner } from '../components/ErrorBanner';
import { Modal } from '../components/Modal';
import { CreateAdminForm } from '../components/CreateAdminForm';

function formatDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

export function AdminUsersPage() {
  const { token, isAdmin } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [lockersById, setLockersById] = useState<Record<string, Locker>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [bookingsByUser, setBookingsByUser] = useState<Record<string, Booking[]>>({});
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  useEffect(() => {
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([getUsers(token), getLockers(token)])
      .then(([userList, lockerList]) => {
        setUsers(userList);
        setLockersById(Object.fromEntries(lockerList.map((l) => [l.id, l])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la información.'))
      .finally(() => setLoading(false));
  }, [token, isAdmin]);

  async function toggleUser(user: AppUser) {
  if (expandedUserId === user.id) {
    setExpandedUserId(null);
    return;
  }
  setExpandedUserId(user.id);
  if (bookingsByUser[user.id] || !token) return;

  setBookingsLoading(true);
  setBookingsError(null);
  try {
    const data = await getUserBookings(user.username, token);
    setBookingsByUser((prev) => ({ ...prev, [user.id]: data }));
  } catch (err) {
    setBookingsError(err instanceof Error ? err.message : 'No se pudieron cargar las reservas de este usuario.');
  } finally {
    setBookingsLoading(false);
  }
}

  function lockerLabel(booking: Booking): string {
  if (booking.codeLoker) return booking.codeLoker;
  const locker = lockersById[String(booking.lockerId)];
  return locker ? locker.code : String(booking.lockerId);
}

  function handleAdminCreated(user: AppUser) {
    setUsers((prev) => [...prev, user]);
    setShowCreateAdmin(false);
  }

  if (!isAdmin) {
    return (
      <div className="page">
        <h1 className="page-title">Usuarios registrados</h1>
        <div className="empty-state">
          Esta sección es solo para administradores. <Link to="/login">Inicia sesión</Link> con una cuenta de admin
          para verla.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Usuarios registrados</h1>
          <p className="page-subtitle">
            Listado de usuarios y los casilleros que tienen reservados o han usado. Haz clic en un usuario para ver
            el detalle.
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreateAdmin(true)}>
          + Nuevo administrador
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="loader">Cargando usuarios…</div>
      ) : users.length === 0 ? (
        <div className="empty-state">Todavía no hay usuarios registrados.</div>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Registrado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                expanded={expandedUserId === u.id}
                onToggle={() => toggleUser(u)}
                bookings={bookingsByUser[u.id]}
                loading={bookingsLoading && expandedUserId === u.id && !bookingsByUser[u.id]}
                error={expandedUserId === u.id ? bookingsError : null}
                lockerLabel={lockerLabel}
              />
            ))}
          </tbody>
        </table>
      )}

      {showCreateAdmin && (
        <Modal title="Nuevo administrador" onClose={() => setShowCreateAdmin(false)}>
          <CreateAdminForm onCreated={handleAdminCreated} />
        </Modal>
      )}
    </div>
  );
}

interface RowProps {
  user: AppUser;
  expanded: boolean;
  onToggle: () => void;
  bookings?: Booking[];
  loading: boolean;
  error: string | null;
  lockerLabel: (booking: Booking) => string;
}

function UserRow({ user, expanded, onToggle, bookings, loading, error, lockerLabel }: RowProps) {
  const isAdminRole = user.role === 'admin';

  return (
    <>
      <tr onClick={onToggle}>
        <td>{user.username}</td>
        <td>
          <span className="role-pill" data-admin={isAdminRole}>
            {isAdminRole ? 'ADMIN' : 'USUARIO'}
          </span>
        </td>
        <td>{formatDate(user.createdAt)}</td>
      </tr>
      {expanded && (
        <tr className="user-bookings-row">
          <td colSpan={3}>
            {loading && <p className="hint">Cargando casilleros de este usuario…</p>}
            {error && <ErrorBanner message={error} />}
            {!loading && !error && bookings && bookings.length === 0 && (
              <p className="hint">Este usuario no tiene casilleros reservados ni en uso.</p>
            )}
            {!loading && bookings && bookings.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {bookings.map((b) => (
                  <span key={b.id} className="locker-chip" title={b.note ?? ''}>
                    {lockerLabel(b)} · {formatDate(b.startTime)} → {formatDate(b.endTime)}
                  </span>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
