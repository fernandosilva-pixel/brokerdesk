import React from 'react';
import { DateRange } from '../types';

interface Props {
  dateRange: DateRange;
  onDateRangeChange: (r: DateRange) => void;
  search: string;
  onSearchChange: (v: string) => void;
}

export default function Header({ dateRange, onDateRangeChange, search, onSearchChange }: Props) {
  const tabs: { key: DateRange; label: string }[] = [
    { key: 'hoje',   label: 'Hoje' },
    { key: 'semana', label: '7 dias' },
    { key: 'mes',    label: '30 dias' },
  ];

  return (
    <header style={{
      background: 'var(--bg1)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      height: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 500 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', boxShadow: '0 0 8px var(--blue)' }} />
        BrokerDesk
        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 400 }}>v1.0</span>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Date Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => onDateRangeChange(t.key)}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: "'DM Sans', sans-serif",
                background: dateRange === t.key ? 'var(--bg4)' : 'transparent',
                color: dateRange === t.key ? 'var(--text1)' : 'var(--text2)',
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '0 12px', height: 32, width: 220,
        }}>
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>⌕</span>
          <input
            type="text"
            placeholder="Buscar broker..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: 'var(--text1)', fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, width: '100%',
            }}
          />
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>
          qui, 16 abr 2026
        </div>
      </div>
    </header>
  );
}
