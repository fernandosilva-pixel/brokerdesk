import React from 'react';
import { FilterType } from '../types';

interface Props {
  filter: FilterType;
  counts: Record<string, number>;
  onFilterChange: (f: FilterType) => void;
  onOpenOperators: () => void;
}

export default function FilterRow({ filter, counts, onFilterChange, onOpenOperators }: Props) {
  const filters: { key: FilterType; label: string; dotColor?: string }[] = [
    { key: 'todos',      label: 'Todos' },
    { key: 'pendente',   label: 'Pendentes',       dotColor: 'var(--red)' },
    { key: 'observacao', label: 'Observação',       dotColor: 'var(--yellow)' },
    { key: 'semretorno', label: 'Sem retorno',      dotColor: '#ff6b81' },
    { key: 'critica',    label: 'Críticas',         dotColor: 'var(--red)' },
    { key: 'atrasada',   label: 'Atrasadas',        dotColor: 'var(--yellow)' },
    { key: 'followup',   label: 'Follow-up hoje',   dotColor: 'var(--blue)' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
        Filtros:
      </span>

      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 6,
            border: `1px solid ${filter === f.key ? 'var(--border3)' : 'var(--border)'}`,
            background: filter === f.key ? 'var(--bg3)' : 'var(--bg2)',
            color: filter === f.key ? 'var(--text1)' : 'var(--text2)',
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: 'pointer',
            transition: 'all .15s',
          }}
        >
          {f.dotColor && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.dotColor, display: 'inline-block' }} />
          )}
          {f.label}
          <span style={{
            background: 'var(--bg4)', borderRadius: 3, padding: '1px 5px',
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            color: 'var(--text2)',
          }}>
            {counts[f.key] ?? 0}
          </span>
        </button>
      ))}

      <div style={{ marginLeft: 'auto' }}>
        <button
          onClick={onOpenOperators}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg2)',
            color: 'var(--text2)', fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, cursor: 'pointer', transition: 'all .15s',
          }}
        >
          👥 Operadores
        </button>
      </div>
    </div>
  );
}
