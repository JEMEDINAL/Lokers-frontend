import { getStatusMeta, type Locker } from '../types/locker';
import { SizeGlyph } from './SizeGlyph';

export function LockerTile({ locker, onClick }: { locker: Locker; onClick: () => void }) {
  const status = getStatusMeta(locker.doorStatus, locker.occupancyStatus, locker.isMaintenance);

  return (
    <button className="locker-tile" onClick={onClick}>
      <span className={`locker-tile__strip strip-${status.tone}`} />
      <div className="locker-tile__meta">
        <SizeGlyph size={locker.size} />
        <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>{locker.size}</span>
      </div>
      <div className="locker-tile__code">{locker.code}</div>
      <span className={`locker-tile__status tone-${status.tone}`}>{status.label}</span>
    </button>
  );
}
