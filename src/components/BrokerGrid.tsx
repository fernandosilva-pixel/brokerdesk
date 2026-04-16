import React from 'react';
import { Broker } from '../types';
import { PRIORITY_LABELS } from '../data/mockData';

function getBrokerStats(b: Broker) {
  const d = b.demands;
  return {
    pendente:   d.filter(x => x.status === 'pendente').length,
    andamento:  d.filter(x => x.status === 'andamento').length,
    observacao: d.filter(x => x.status === 'observacao').length,
    semretorno: d.filter(x => x.status === 'semretorno').length,
    resolvida:  d.filter(x => x.status === 'resolvida').length,
    atrasada:   d.filter(x => x.isOverdue).length,
    critica:    d.filter(x => x.priority === 'critical' && x.status !== 'resolvida' && x.status !== 'cancelada').length,
    total:      d.filter(x => x.status !== 'resolvida' && x.status !== 'cancelada').length,
  };
}

interface CardProps {
  broker: Broker;
  onNewDemand: (id: string) => void;
  onOpenDrawer: (id: string) => void;
}

function BrokerCard({ broker: b, onNewDemand, onOpenDrawer }: CardProps) {
  const s = getBrokerStats(b);
  const hasCrit = s.critica > 0 || s.atrasada > 0;
  const hasWarn = !hasCrit && (s.semretorno > 0 || s.observacao > 0);
  const topDemand = b.demands.find(d => d.status !== 'resolvida' && d.status !== 'cancelada');

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hasCrit ? 'var(--red-border)' : hasWarn ? 'var(--yellow-border)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: 14,
        cursor: 'pointer',
        transition: 'all .18s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onClick={() => onOpenDrawer(b.id)}
    >
      {/* Top accent line */}
      {(hasCrit || hasWarn) && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: hasCrit ? 'var(--red)' : 'var(--yellow)',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)' }}>{b.name}</div>
        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
          <button
            className="btn btn-xs"
            style={{ background: 'var(--blue-bg)', borderColor: 'var(--blue-border)', color: 'var(--blue)' }}
            onClick={() => onNewDemand(b.id)}
          >
            + Demanda
          </button>
          <button className="btn btn-xs" onClick={() => onOpenDrawer(b.id)}>
            Detalhes
          </button>
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {s.pendente > 0   && <span className="badge badge-red"><span className="badge-dot" />{s.pendente} pendente{s.pendente > 1 ? 's' : ''}</span>}
        {s.semretorno > 0 && <span className="badge badge-red"><span className="badge-dot" />{s.semretorno} sem retorno</span>}
        {s.critica > 0    && <span className="badge badge-red"><span className="badge-dot" />{s.critica} crítica{s.critica > 1 ? 's' : ''}</span>}
        {s.observacao > 0 && <span className="badge badge-yellow"><span className="badge-dot" />{s.observacao} observação</span>}
        {s.atrasada > 0   && <span className="badge badge-yellow"><span className="badge-dot" />{s.atrasada} atrasada{s.atrasada > 1 ? 's' : ''}</span>}
        {s.andamento > 0  && <span className="badge badge-blue"><span className="badge-dot" />{s.andamento} andamento</span>}
        {s.resolvida > 0  && <span className="badge badge-green"><span className="badge-dot" />{s.resolvida} resolvida{s.resolvida > 1 ? 's' : ''}</span>}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 4, marginBottom: 10 }}>
        {[
          { val: s.total,    lbl: 'Abertas',   color: s.total > 0 ? 'var(--text1)' : 'var(--green)' },
          { val: s.atrasada, lbl: 'Atrasadas', color: s.atrasada > 0 ? 'var(--red)' : 'var(--text1)' },
          { val: s.resolvida,lbl: 'Resolvidas',color: s.resolvida > 0 ? 'var(--green)' : 'var(--text1)' },
        ].map(st => (
          <div key={st.lbl} style={{
            background: 'var(--bg1)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '6px 8px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 500, color: st.color }}>{st.val}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 1 }}>{st.lbl}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10, color: 'var(--text3)' }}>Operador</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%', background: 'var(--bg4)',
              border: '1px solid var(--border2)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600,
            }}>{b.operatorInitials}</span>
            {b.operator}
          </span>
        </div>

        {topDemand ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Última demanda</span>
              <span style={{ fontSize: 11, color: 'var(--text2)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {topDemand.title}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Prioridade</span>
              <span className={`priority-pill priority-${topDemand.priority}`}>
                {PRIORITY_LABELS[topDemand.priority]}
              </span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 10, color: 'var(--green)' }}>✓ Sem pendências</div>
        )}
      </div>
    </div>
  );
}

interface GridProps {
  brokers: Broker[];
  onNewDemand: (id: string) => void;
  onOpenDrawer: (id: string) => void;
}

export default function BrokerGrid({ brokers, onNewDemand, onOpenDrawer }: GridProps) {
  if (brokers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text3)', fontSize: 14 }}>
        Nenhum broker encontrado para esse filtro.
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 10,
    }}>
      {brokers.map(b => (
        <BrokerCard key={b.id} broker={b} onNewDemand={onNewDemand} onOpenDrawer={onOpenDrawer} />
      ))}
    </div>
  );
}
