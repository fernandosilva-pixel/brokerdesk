import React from 'react';
import { Broker, Operator } from '../types';

interface Props {
  open: boolean;
  brokers: Broker[];
  operators: Operator[];
  onClose: () => void;
}

export default function OperatorsModal({ open, brokers, operators, onClose }: Props) {
  if (!open) return null;
  const today = '2026-04-16';

  const getOpStats = (opName: string) => {
    const demands = brokers.filter(b => b.operator === opName).flatMap(b => b.demands);
    return {
      total:    demands.length,
      open:     demands.filter(d => d.status !== 'resolvida' && d.status !== 'cancelada').length,
      overdue:  demands.filter(d => d.isOverdue).length,
      noreply:  demands.filter(d => d.status === 'semretorno').length,
      resolved: demands.filter(d => d.status === 'resolvida').length,
      fu:       demands.filter(d => d.followup && d.followup.startsWith(today)).length,
    };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg1)', border: '1px solid var(--border2)', borderRadius: 12, width: '100%', maxWidth: 760, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Visão por Operador</div>
          <button className="btn btn-xs" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Operator cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {operators.map(op => {
              const st = getOpStats(op.name);
              return (
                <div key={op.name} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: op.color === 'blue' ? 'var(--blue-bg)' : 'var(--purple-bg)',
                      border: `1px solid ${op.color === 'blue' ? 'var(--blue-border)' : 'var(--purple-border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 600,
                      color: op.color === 'blue' ? 'var(--blue)' : 'var(--purple)',
                    }}>{op.initials}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{op.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{op.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                    {[
                      { val: st.open,     lbl: 'Abertas',    color: 'var(--text1)' },
                      { val: st.overdue,  lbl: 'Atrasadas',  color: st.overdue > 0  ? 'var(--red)'    : 'var(--text1)' },
                      { val: st.noreply,  lbl: 'Sem retorno',color: st.noreply > 0  ? 'var(--yellow)' : 'var(--text1)' },
                      { val: st.resolved, lbl: 'Resolvidas', color: st.resolved > 0 ? 'var(--green)'  : 'var(--text1)' },
                      { val: st.fu,       lbl: 'Follow-ups', color: 'var(--blue)' },
                      { val: '~2h',       lbl: 'T.M. resp.', color: 'var(--text1)' },
                    ].map(m => (
                      <div key={m.lbl} style={{ textAlign: 'center' }}>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 500, color: m.color }}>{m.val}</div>
                        <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.3px' }}>{m.lbl}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Broker table */}
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Distribuição por broker</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Broker','Operador','Abertas','Atrasadas','Sem retorno','Resolvidas'].map(h => (
                  <th key={h} style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brokers.map(b => {
                const open     = b.demands.filter(d => d.status !== 'resolvida' && d.status !== 'cancelada').length;
                const overdue  = b.demands.filter(d => d.isOverdue).length;
                const noreply  = b.demands.filter(d => d.status === 'semretorno').length;
                const resolved = b.demands.filter(d => d.status === 'resolvida').length;
                return (
                  <tr key={b.id}>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text1)', fontWeight: 500, fontSize: 12 }}>{b.name}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)' }}>{b.operator}</td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${open > 0 ? 'badge-blue' : 'badge-gray'}`}>{open}</span></td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${overdue > 0 ? 'badge-red' : 'badge-gray'}`}>{overdue}</span></td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${noreply > 0 ? 'badge-red' : 'badge-gray'}`}>{noreply}</span></td>
                    <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}><span className={`badge ${resolved > 0 ? 'badge-green' : 'badge-gray'}`}>{resolved}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
