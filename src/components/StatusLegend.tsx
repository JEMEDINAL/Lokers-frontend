const ITEMS = [
  { tone: 'available', label: 'Disponible' },
  { tone: 'available-open', label: 'Disponible · puerta abierta' },
  { tone: 'occupied', label: 'Ocupado' },
  { tone: 'alert', label: 'Ocupado · puerta abierta (alerta)' },
  { tone: 'maintenance', label: 'En mantenimiento' },
] as const;

export function StatusLegend() {
  return (
    <div className="legend">
      {ITEMS.map((item) => (
        <span className="legend__item" key={item.tone}>
          <span className={`legend__dot strip-${item.tone}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
