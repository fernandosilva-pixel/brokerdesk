import React, { useState } from 'react';
import { Broker, Demand, DemandStatus } from '../types';
import { STATUS_LABELS, PRIORITY_LABELS } from '../data/mockData';

type DrawerTab = 'lista' | 'criticas' | 'followup' | 'operador';

interface Props {
  broker: Broker | null;
  allBrokers: Broker[];
  open: boolean;
  onClose: () => void;
  onNewDemand: () => void;
  onChangeStatus: (brokerId: string, demandId: number, status: DemandStatus) => void;
  onToggleChecklist: (brokerId: string, demandId: number, checkId: string) => void;
}

function getBrokerStats(b: Broker) {
  const d = b.demands;
  return {
    pendente:   d.filter(x => x.status === 'pendente').length,
    semretorno: d.filter(x => x.status === 'semretorno').length,
    atrasada:   d.filter(x => x.isOverdue).length,
    resolvida:  d.filter(x => x.status === 'resolvida').length,
  };
}

export default function BrokerDrawer({ broker, open, onClose, onNewDemand, onChangeStatus, onToggleChecklist }: Props) {
  const [tab, setTab] = useState<DrawerTab>('lista');
  const [activeDemandId, setActiveDemandId] = useState<number | null>(null);

  if (!broker) return null;
  const s = getBrokerStats(broker);
  const today = '2026-04-16';

  const demandsForTab = (): Demand[] => {
    if (tab === 'criticas') return broker.demands.filter(d => d.priority === 'critical' || d.isOverdue || d.status === 'semretorno');
    if (tab === 'followup')  return broker.demands.filter(d => d.followup && d.followup.startsWith(today));
    return broker.demands;
  };

  const activeDemand = broker.demands.find(d => d.id === activeDemandId) || null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          display: open ? 'block' : 'none',
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 150,
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0,
        width: 780, maxWidth: '95vw', height: '100vh',
        background: 'var(--bg1)', borderLeft: '1px solid var(--border2)',
        zIndex: 151, overflowY: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 10,
        }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{broker.name}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={onNewDemand}>+ Demanda</button>
            <button className="btn btn-xs" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { val: s.pendente,   lbl: 'Pendentes',   color: s.pendente > 0 ? 'var(--red)' : 'var(--text1)' },
              { val: s.semretorno, lbl: 'Sem retorno',  color: s.semretorno > 0 ? 'var(--red)' : 'var(--text1)' },
              { val: s.atrasada,   lbl: 'Atrasadas',   color: s.atrasada > 0 ? 'var(--yellow)' : 'var(--text1)' },
              { val: s.resolvida,  lbl: 'Resolvidas',  color: s.resolvida > 0 ? 'var(--green)' : 'var(--text1)' },
            ].map(st => (
              <div key={st.lbl} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 500, color: st.color }}>{st.val}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 2 }}>{st.lbl}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          {!activeDemand && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
              {(['lista','criticas','followup','operador'] as DrawerTab[]).map(t => {
                const labels: Record<DrawerTab, string> = { lista: 'Demandas', criticas: 'Críticas', followup: 'Follow-ups', operador: 'Operador' };
                return (
                  <div
                    key={t}
                    onClick={() => { setTab(t); setActiveDemandId(null); }}
                    style={{
                      padding: '8px 14px', fontSize: 12, cursor: 'pointer',
                      borderBottom: `2px solid ${tab === t ? 'var(--blue)' : 'transparent'}`,
                      color: tab === t ? 'var(--blue)' : 'var(--text2)',
                      marginBottom: -1, transition: 'all .15s',
                    }}
                  >
                    {labels[t]}
                  </div>
                );
              })}
            </div>
          )}

          {/* Content */}
          {activeDemand
            ? <DemandDetail
                demand={activeDemand}
                brokerId={broker.id}
                onBack={() => setActiveDemandId(null)}
                onChangeStatus={onChangeStatus}
                onToggleChecklist={onToggleChecklist}
              />
            : tab === 'operador'
              ? <OperatorTab broker={broker} />
              : <DemandTable
                  demands={demandsForTab()}
                  onSelect={id => setActiveDemandId(id)}
                />
          }
        </div>
      </div>
    </>
  );
}

function DemandTable({ demands, onSelect }: { demands: Demand[]; onSelect: (id: number) => void }) {
  if (demands.length === 0) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)', fontSize: 13 }}>Nenhuma demanda nessa categoria.</div>;
  }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {['Título','Status','Prio.','Categoria','Abertura','Contato'].map(h => (
            <th key={h} style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {demands.map(d => (
          <tr key={d.id} onClick={() => onSelect(d.id)} style={{ cursor: 'pointer' }}>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', color: 'var(--text1)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.isOverdue && <span style={{ color: 'var(--red)', marginRight: 4 }}>⚠</span>}
              {d.title}
            </td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
              <span className={`status-badge status-${d.status}`}>{STATUS_LABELS[d.status]}</span>
            </td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
              <span className={`priority-pill priority-${d.priority}`}>{PRIORITY_LABELS[d.priority]}</span>
            </td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>{d.category}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)' }}>{d.opened}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text2)' }}>{d.contact}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DemandDetail({
  demand: d, brokerId, onBack, onChangeStatus, onToggleChecklist,
}: {
  demand: Demand;
  brokerId: string;
  onBack: () => void;
  onChangeStatus: (brokerId: string, demandId: number, status: DemandStatus) => void;
  onToggleChecklist: (brokerId: string, demandId: number, checkId: string) => void;
}) {
  return (
    <div>
      {/* Back + status row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={onBack}>← Voltar</button>
        <span className={`status-badge status-${d.status}`}>{STATUS_LABELS[d.status]}</span>
        <span className={`priority-pill priority-${d.priority}`}>{PRIORITY_LABELS[d.priority]}</span>
        {d.isOverdue && <span className="badge badge-red">⚠ Atrasada</span>}
      </div>

      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text1)', marginBottom: 4 }}>{d.title}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>
        {d.category} · Aberta em {d.opened} · Responsável: {d.operator}
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>Contato</div>
          <div style={{ fontSize: 13, color: 'var(--text1)' }}>{d.contact}</div>
          <div style={{ fontSize: 11, color: 'var(--blue)' }}>{d.whatsapp}</div>
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: 4 }}>Prazos</div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>
            Limite: <span style={{ color: d.isOverdue ? 'var(--red)' : 'var(--text1)' }}>{d.deadline}</span>
          </div>
          {d.followup
            ? <div style={{ fontSize: 11, color: 'var(--text2)' }}>Follow-up: <span style={{ color: 'var(--blue)' }}>{d.followup.replace('T', ' ')}</span></div>
            : <div style={{ fontSize: 11, color: 'var(--text3)' }}>Follow-up: não agendado</div>
          }
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>Descrição</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: 10 }}>
          {d.description}
        </div>
      </div>

      {/* Internal notes */}
      {d.internalNotes && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--yellow)', fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.3px' }}>⚑ Observações internas</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', background: 'rgba(245,166,35,0.04)', border: '1px solid var(--yellow-border)', borderRadius: 6, padding: 10 }}>
            {d.internalNotes}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.3px' }}>Checklist</div>
        <ul style={{ listStyle: 'none' }}>
          {d.checklist.map(c => (
            <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text2)' }}>
              <div
                onClick={() => onToggleChecklist(brokerId, d.id, c.id)}
                style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: `1px solid ${c.done ? 'var(--green)' : 'var(--border2)'}`,
                  background: c.done ? 'var(--green)' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#000', flexShrink: 0, transition: 'all .15s',
                }}
              >{c.done ? '✓' : ''}</div>
              <span style={{ textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.5 : 1 }}>{c.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Timeline */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.3px' }}>Histórico</div>
        <ul className="timeline">
          {d.history.map((h, i) => (
            <li key={i}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 2, fontFamily: "'JetBrains Mono', monospace" }}>{h.time}{h.author ? ` · ${h.author}` : ''}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{h.text}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick actions */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => onChangeStatus(brokerId, d.id, 'andamento')}>▶ Em andamento</button>
        <button className="btn btn-sm" onClick={() => onChangeStatus(brokerId, d.id, 'observacao')}>👁 Observação</button>
        <button className="btn btn-sm" onClick={() => onChangeStatus(brokerId, d.id, 'aguardando')}>⏳ Aguardando</button>
        <button className="btn btn-sm" onClick={() => onChangeStatus(brokerId, d.id, 'semretorno')} style={{ color: 'var(--yellow)', borderColor: 'var(--yellow-border)' }}>
          ⚠ Sem retorno
        </button>
        <button className="btn btn-sm" onClick={() => onChangeStatus(brokerId, d.id, 'resolvida')} style={{ color: 'var(--green)', borderColor: 'var(--green-border)' }}>
          ✓ Resolver
        </button>
      </div>
    </div>
  );
}

function OperatorTab({ broker: b }: { broker: Broker }) {
  const today = '2026-04-16';
  const resolved  = b.demands.filter(d => d.status === 'resolvida').length;
  const overdue   = b.demands.filter(d => d.isOverdue).length;
  const noreply   = b.demands.filter(d => d.status === 'semretorno').length;
  const fu        = b.demands.filter(d => d.followup && d.followup.startsWith(today)).length;
  const open      = b.demands.filter(d => d.status !== 'resolvida' && d.status !== 'cancelada').length;

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--blue-bg)', border: '1px solid var(--blue-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 600, color: 'var(--blue)',
        }}>{b.operatorInitials}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{b.operator}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>Responsável pelo broker</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {[
          { val: open,     lbl: 'Abertas',      color: 'var(--text1)' },
          { val: overdue,  lbl: 'Atrasadas',    color: overdue > 0  ? 'var(--red)'    : 'var(--text1)' },
          { val: noreply,  lbl: 'Sem retorno',  color: noreply > 0  ? 'var(--yellow)' : 'var(--text1)' },
          { val: resolved, lbl: 'Resolvidas',   color: resolved > 0 ? 'var(--green)'  : 'var(--text1)' },
          { val: fu,       lbl: 'Follow-ups hoje', color: 'var(--blue)' },
          { val: '~2h',    lbl: 'T.M. resposta',   color: 'var(--text1)' },
        ].map(m => (
          <div key={m.lbl} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 500, color: m.color }}>{m.val}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.3px' }}>{m.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
