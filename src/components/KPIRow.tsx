import React from 'react';

interface KPIs {
  totalBrokers: number;
  pendentes: number;
  observacao: number;
  semRetorno: number;
  atrasadas: number;
  resolvidas: number;
  followupHoje: number;
  andamento: number;
}

interface Props { kpis: KPIs; }

export default function KPIRow({ kpis }: Props) {
  const items = [
    { label: 'Brokers',         value: kpis.totalBrokers, sub: 'ativos',          color: 'var(--text1)' },
    { label: 'Pendentes',       value: kpis.pendentes,    sub: 'aguardando ação', color: 'var(--red)'   },
    { label: 'Observação',      value: kpis.observacao,   sub: 'monitorando',     color: 'var(--yellow)'},
    { label: 'Sem retorno',     value: kpis.semRetorno,   sub: 'cliente não resp.',color:'var(--red)'   },
    { label: 'Atrasadas',       value: kpis.atrasadas,    sub: 'SLA vencido',     color: 'var(--yellow)'},
    { label: 'Resolvidas',      value: kpis.resolvidas,   sub: 'no período',      color: 'var(--green)' },
    { label: 'Follow-ups hoje', value: kpis.followupHoje, sub: 'agendados',       color: 'var(--blue)'  },
    { label: 'Em andamento',    value: kpis.andamento,    sub: 'em progresso',    color: 'var(--text1)' },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(8, 1fr)',
      gap: 8,
      marginBottom: 16,
    }}>
      {items.map(item => (
        <div key={item.label} className="kpi-card">
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>
            {item.label}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 500, color: item.color, lineHeight: 1 }}>
            {item.value}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
            {item.sub}
          </div>
        </div>
      ))}
    </div>
  );
}
