import { useMemo, useState } from 'react';
import type { Locker, LockerSize } from '../types/locker';
import { useLockers } from '../hooks/useLockers';
import { useAuth } from '../context/AuthContext';
import { LockerTile } from '../components/LockerTile';
import { LockerDrawer } from '../components/LockerDrawer';
import { StatusLegend } from '../components/StatusLegend';
import { ErrorBanner } from '../components/ErrorBanner';
import { Modal } from '../components/Modal';
import { CreateLockerForm } from '../components/CreateLockerForm';

const SIZES: LockerSize[] = ['S', 'M', 'L'];
const SIZE_LABEL: Record<LockerSize, string> = {
  S: 'Pequeños (S)',
  M: 'Medianos (M)',
  L: 'Grandes (L)',
};

export function BoardPage() {
  const { isAdmin } = useAuth();
  const { lockers, loading, error, refresh } = useLockers();
  const [filter, setFilter] = useState<LockerSize | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Locker | null>(null);
  const [showCreateLocker, setShowCreateLocker] = useState(false);

  const grouped = useMemo(() => {
    const filtered = filter === 'ALL' ? lockers : lockers.filter((l) => l.size === filter);
    return SIZES.map((size) => ({
      size,
      items: filtered.filter((l) => l.size === size),
    })).filter((group) => group.items.length > 0);
  }, [lockers, filter]);

  function handleUpdated(updated: Locker) {
    setSelected(updated);
    refresh();
  }

  function handleLockerCreated(_locker: Locker) {
    setShowCreateLocker(false);
    refresh();
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Tablero de casilleros</h1>
          <p className="page-subtitle">
            Estado en vivo por tamaño. Selecciona un casillero para ver el detalle, el historial de reservas o cambiar
            su estado.
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateLocker(true)}>
            + Nuevo casillero
          </button>
        )}
      </div>

      <StatusLegend />

      <div className="filters" role="tablist" aria-label="Filtrar por tamaño">
        <button aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>
          Todos
        </button>
        {SIZES.map((size) => (
          <button key={size} aria-pressed={filter === size} onClick={() => setFilter(size)}>
            {SIZE_LABEL[size]}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="loader">Cargando casilleros…</div>
      ) : grouped.length === 0 ? (
        <div className="empty-state">No hay casilleros para mostrar con este filtro.</div>
      ) : (
        grouped.map((group) => (
          <section className="locker-section" key={group.size}>
            <div className="locker-section__title">{SIZE_LABEL[group.size]}</div>
            <div className="locker-grid">
              {group.items.map((locker) => (
                <LockerTile key={locker.id} locker={locker} onClick={() => setSelected(locker)} />
              ))}
            </div>
          </section>
        ))
      )}

      {selected && (
        <LockerDrawer locker={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}

      {showCreateLocker && (
        <Modal title="Nuevo casillero" onClose={() => setShowCreateLocker(false)}>
          <CreateLockerForm onCreated={handleLockerCreated} />
        </Modal>
      )}
    </div>
  );
}
