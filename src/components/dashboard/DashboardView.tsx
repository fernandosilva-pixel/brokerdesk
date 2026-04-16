import React, { useState, useMemo } from 'react';
import {
  ExternalLink, Plus, BarChart3, X,
  ChevronLeft, ChevronRight, Code2,
  FileText, Zap,
} from 'lucide-react';
import { brokers } from '../../data/brokers';
import type { Broker, Ticket } from '../../data/brokers';

interface DashboardViewProps {
  searchTerm: string;
  currentUser: string;
  tickets: Ticket[];
  onAddTicket: (ticket: Ticket) => void;
  onUpdateTicket: (id: string, status: Ticket['status']) => void;
}

function generateDates() {
  const dates = [];
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  dates.push({ key: todayKey, label: 'HOJE', sub: today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase(), isToday: true });
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      key: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase(),
      sub: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase(),
      isToday: false,
    });
  }
  return dates;
}

const P = {
  Urgente: { bar: 'var(--red)',    glow: 'rgba(255,71,87,0.16)',   text: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)' },
  Alta:    { bar: 'var(--yellow)', glow: 'rgba(245,166,35,0.12)',  text: 'var(--yellow)', bg: 'var(--yellow-bg)', border: 'var(--yellow-border)' },
  Média:   { bar: 'var(--blue)',   glow: 'rgba(74,158,255,0.10)',  text: 'var(--blue)',   bg: 'var(--blue-bg)',   border: 'var(--blue-border)' },
  Baixa:   { bar: 'var(--green)',  glow: 'rgba(46,213,115,0.08)',  text: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)' },
} as const;

const S = {
  Pendente:       { text: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)',    bar: 'var(--red)' },
  'Em Andamento': { text: 'var(--blue)',   bg: 'var(--blue-bg)',   border: 'var(--blue-border)',   bar: 'var(--blue)' },
  Resolvido:      { text: 'var(--green)',  bg: 'var(--green-bg)',  border: 'var(--green-border)',  bar: 'var(--green)' },
  Fechado:        { text: 'var(--text3)',  bg: 'var(--bg3)',       border: 'var(--border)',        bar: 'var(--text3)' },
  Aberto:         { text: 'var(--red)',    bg: 'var(--red-bg)',    border: 'var(--red-border)',    bar: 'var(--red)' },
} as const;

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const syne: React.CSSProperties = { fontFamily: "'Syne', 'DM Sans', sans-serif" };

export default function DashboardView({ searchTerm, currentUser, tickets, onAddTicket, onUpdateTicket }: DashboardViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateStart, setDateStart] = useState(0);
  const [createModal, setCreateModal] = useState<Broker | null>(null);
  const [reportModal, setReportModal] = useState<Broker | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: '', description: '',
    priority: 'Média' as Ticket['priority'],
    assignedTo: '', isDev: false,
  });

  const dates = useMemo(() => generateDates(), []);
  const visibleDates = dates.slice(dateStart, dateStart + 7);

  const filtered = useMemo(() =>
    brokers.filter(b =>
      b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]);

  const brokerTickets = (brokerNome: string) => tickets.filter(t => t.broker.nome === brokerNome);

  const kpis = [
    { label: 'BROKERS',     value: brokers.length,                                      accent: 'var(--blue)',   glow: 'rgba(74,158,255,0.12)' },
    { label: 'PENDENTES',   value: tickets.filter(t => t.status === 'Pendente').length, accent: 'var(--red)',    glow: 'rgba(255,71,87,0.12)' },
    { label: 'EM ANDAMENTO',value: tickets.filter(t => t.status === 'Em Andamento').length, accent: 'var(--yellow)', glow: 'rgba(245,166,35,0.12)' },
    { label: 'RESOLVIDOS',  value: tickets.filter(t => t.status === 'Resolvido').length,    accent: 'var(--green)',  glow: 'rgba(46,213,115,0.12)' },
  ];

  const handleCreateTicket = () => {
    if (!newTicket.title.trim() || !createModal) return;
    const ticket: Ticket = {
      id: Date.now().toString(), broker: createModal, date: currentDate,
      status: 'Pendente', priority: newTicket.priority, title: newTicket.title,
      description: newTicket.description, assignedTo: newTicket.assignedTo,
      createdBy: currentUser, createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(), isDev: newTicket.isDev,
    };
    onAddTicket(ticket);
    setNewTicket({ title: '', description: '', priority: 'Média', assignedTo: '', isDev: false });
    setCreateModal(null);
  };

  return (
    <div className="space-y-4">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, accent, glow }, i) => (
          <div
            key={label}
            className="relative overflow-hidden group"
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '14px 16px',
              transition: 'border-color 0.15s, box-shadow 0.15s',
              animationDelay: `${i * 60}ms`,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = `inset 3px 0 0 ${accent}, 0 0 28px ${glow}`;
              el.style.borderColor = 'var(--border2)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement;
              el.style.boxShadow = '';
              el.style.borderColor = 'var(--border)';
            }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--text3)', marginBottom: 8, ...mono }}>
              {label}
            </p>
            <p style={{ fontSize: 38, fontWeight: 700, color: accent, lineHeight: 1, ...mono }}>
              {value}
            </p>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: accent, opacity: 0.18 }} />
          </div>
        ))}
      </div>

      {/* ── Date Tabs ── */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, padding: 6 }}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDateStart(Math.max(0, dateStart - 1))}
            disabled={dateStart === 0}
            style={{ padding: '6px 7px', borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', opacity: dateStart === 0 ? 0.3 : 1, display: 'flex' }}
          >
            <ChevronLeft size={13} />
          </button>
          <div className="flex flex-1 gap-px">
            {visibleDates.map(date => (
              <button
                key={date.key}
                onClick={() => setCurrentDate(date.key)}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '7px 2px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: currentDate === date.key ? 'var(--blue)' : date.isToday ? 'var(--blue-bg)' : 'transparent',
                  transition: 'background 0.12s',
                }}
              >
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.08em',
                  color: currentDate === date.key ? '#fff' : date.isToday ? 'var(--blue)' : 'var(--text3)', ...mono,
                }}>
                  {date.label}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 600, marginTop: 2,
                  color: currentDate === date.key ? '#fff' : date.isToday ? 'var(--blue)' : 'var(--text2)', ...mono,
                }}>
                  {date.sub}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setDateStart(Math.min(dates.length - 7, dateStart + 1))}
            disabled={dateStart + 7 >= dates.length}
            style={{ padding: '6px 7px', borderRadius: 4, border: 'none', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', opacity: dateStart + 7 >= dates.length ? 0.3 : 1, display: 'flex' }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Broker Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map((broker, idx) => {
          const bTickets = brokerTickets(broker.nome);
          const pending    = bTickets.filter(t => t.status === 'Pendente').length;
          const inProgress = bTickets.filter(t => t.status === 'Em Andamento').length;
          const resolved   = bTickets.filter(t => t.status === 'Resolvido').length;
          const closed     = bTickets.filter(t => t.status === 'Fechado').length;
          const urgent     = bTickets.filter(t => t.priority === 'Urgente').length;
          const high       = bTickets.filter(t => t.priority === 'Alta').length;
          const devCount   = bTickets.filter(t => t.isDev).length;
          const lastTicket = bTickets[0];

          const prio = urgent > 0 ? P.Urgente : high > 0 ? P.Alta : pending > 0 ? P.Média : null;
          const baseGlow = prio ? `inset 3px 0 0 ${prio.bar}, 0 4px 20px ${prio.glow}` : 'none';
          const isUrgentCard = urgent > 0;

          return (
            <div
              key={broker.nome}
              className="broker-card flex flex-col"
              style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 6, boxShadow: baseGlow,
                transition: 'border-color 0.15s, box-shadow 0.2s, transform 0.15s',
                animationDelay: `${idx * 35}ms`,
                animation: isUrgentCard ? 'urgentPulse 2.5s infinite' : undefined,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-2px)';
                el.style.borderColor = 'var(--border2)';
                if (prio) el.style.boxShadow = `inset 3px 0 0 ${prio.bar}, 0 16px 40px ${prio.glow}`;
                else el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = '';
                el.style.borderColor = 'var(--border)';
                el.style.boxShadow = isUrgentCard ? '' : baseGlow;
              }}
            >
              {/* Header */}
              <div style={{ padding: '11px 13px 9px', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', letterSpacing: '0.04em', ...syne }}>
                        {broker.nome.toUpperCase()}
                      </h3>
                      {urgent > 0 && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                          fontSize: 8, fontWeight: 700, padding: '2px 5px',
                          background: 'var(--red-bg)', border: '1px solid var(--red-border)',
                          color: 'var(--red)', borderRadius: 3, letterSpacing: '0.1em', ...mono,
                        }}>
                          <Zap size={7} fill="currentColor" /> URG
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1, ...mono }}>
                      {broker.responsavel.toLowerCase()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={broker.dominio} target="_blank" rel="noopener noreferrer"
                      style={{ padding: 5, borderRadius: 4, color: 'var(--text3)', display: 'flex', transition: 'color 0.12s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--blue)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
                    >
                      <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => setCreateModal(broker)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px',
                        background: 'var(--blue)', border: 'none', borderRadius: 4,
                        color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        transition: 'opacity 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      <Plus size={10} strokeWidth={2.5} /> Ticket
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ padding: '7px 13px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {bTickets.length > 0 ? (
                  <>
                    <span className="badge badge-blue" style={mono}>{bTickets.length} total</span>
                    {pending > 0 && <span className="badge badge-red" style={mono}>{pending} aberto{pending !== 1 ? 's' : ''}</span>}
                    {devCount > 0 && (
                      <span className="badge badge-purple" style={{ ...mono, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Code2 size={8} /> {devCount} tech
                      </span>
                    )}
                  </>
                ) : (
                  <span className="badge badge-gray" style={mono}>sem tickets</span>
                )}
              </div>

              {/* Status bars */}
              <div style={{ padding: '9px 13px', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: 7, ...mono }}>STATUS</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 14px' }}>
                  {[
                    { label: 'PENDENTE',   count: pending,    color: S.Pendente.bar },
                    { label: 'ANDAMENTO',  count: inProgress, color: S['Em Andamento'].bar },
                    { label: 'RESOLVIDO',  count: resolved,   color: S.Resolvido.bar },
                    { label: 'FECHADO',    count: closed,     color: S.Fechado.bar },
                  ].map(({ label, count, color }) => {
                    const pct = bTickets.length > 0 ? (count / bTickets.length) * 100 : 0;
                    return (
                      <div key={label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: 'var(--text3)', letterSpacing: '0.08em', fontWeight: 500, ...mono }}>{label}</span>
                          <span style={{ fontSize: 9, color, fontWeight: 700, ...mono }}>{count}</span>
                        </div>
                        <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Last ticket */}
              {lastTicket ? (
                <div style={{ padding: '8px 13px', borderBottom: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text3)', marginBottom: 5, ...mono }}>ÚLTIMO TICKET</p>
                  <p style={{ fontSize: 11, color: 'var(--text1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {lastTicket.title}
                  </p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <span style={{
                      fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700, letterSpacing: '0.07em', ...mono,
                      background: S[lastTicket.status]?.bg || 'var(--bg3)',
                      color: S[lastTicket.status]?.text || 'var(--text3)',
                      border: `1px solid ${S[lastTicket.status]?.border || 'var(--border)'}`,
                    }}>
                      {lastTicket.status.toUpperCase()}
                    </span>
                    <span style={{
                      fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700, letterSpacing: '0.07em', ...mono,
                      background: P[lastTicket.priority]?.bg, color: P[lastTicket.priority]?.text,
                      border: `1px solid ${P[lastTicket.priority]?.border}`,
                    }}>
                      {lastTicket.priority.toUpperCase()}
                    </span>
                    {lastTicket.isDev && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700,
                        background: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid var(--purple-border)', ...mono,
                      }}>
                        <Code2 size={7} /> TECH
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '12px 13px', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: 'var(--text3)' }}>Nenhum ticket registrado</p>
                </div>
              )}

              {/* Footer */}
              <div style={{ padding: '7px 13px', marginTop: 'auto' }}>
                <button
                  onClick={() => setReportModal(broker)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '6px', borderRadius: 4, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--text3)', fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = 'var(--bg3)';
                    b.style.color = 'var(--blue)';
                    b.style.borderColor = 'var(--blue-border)';
                  }}
                  onMouseLeave={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text3)';
                    b.style.borderColor = 'var(--border)';
                  }}
                >
                  <BarChart3 size={11} /> Ver Relatório
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create Modal ── */}
      {createModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, backdropFilter: 'blur(6px)' }}>
          <div style={{
            background: 'var(--bg1)', border: '1px solid var(--border2)',
            borderRadius: 8, width: '100%', maxWidth: 440, padding: 24,
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--text3)', marginBottom: 5, ...mono }}>NOVO TICKET</p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', ...syne }}>{createModal.nome}</h2>
              </div>
              <button onClick={() => setCreateModal(null)} style={{ padding: 6, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label className="form-label">Título *</label>
                <input type="text" value={newTicket.title} onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))}
                  className="form-control" placeholder="Descreva o problema" autoFocus />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <textarea value={newTicket.description} onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  className="form-control" rows={3} placeholder="Detalhes adicionais..." style={{ resize: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="form-label">Prioridade</label>
                  <select value={newTicket.priority} onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value as Ticket['priority'] }))} className="form-control">
                    <option>Baixa</option><option>Média</option><option>Alta</option><option>Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Atribuir a</label>
                  <select value={newTicket.assignedTo} onChange={e => setNewTicket(p => ({ ...p, assignedTo: e.target.value }))} className="form-control">
                    <option value="">Ninguém</option>
                    <option>suporte@mybroker.com</option>
                    <option>gerente@mybroker.com</option>
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewTicket(p => ({ ...p, isDev: !p.isDev }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px',
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                  border: newTicket.isDev ? '1px solid var(--purple-border)' : '1px solid var(--border)',
                  background: newTicket.isDev ? 'var(--purple-bg)' : 'var(--bg3)',
                }}
              >
                <div style={{
                  width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: newTicket.isDev ? 'var(--purple)' : 'var(--bg4)', transition: 'background 0.15s',
                }}>
                  <Code2 size={14} color="#fff" />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: newTicket.isDev ? 'var(--purple)' : 'var(--text2)' }}>Direcionar para Demandas Tech</p>
                  <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                    {newTicket.isDev ? 'Ticket vinculado ao broker + visível em Tech' : 'Ativar para enviar à sessão DEV'}
                  </p>
                </div>
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${newTicket.isDev ? 'var(--purple)' : 'var(--border2)'}`,
                  background: newTicket.isDev ? 'var(--purple)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
                }}>
                  {newTicket.isDev && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </button>
            </div>

            <div style={{ display: 'flex', gap: 9, marginTop: 20 }}>
              <button onClick={() => setCreateModal(null)} className="btn" style={{ flex: 1 }}>Cancelar</button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.title.trim()}
                style={{
                  flex: 1, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  background: newTicket.isDev ? 'var(--purple)' : 'var(--blue)',
                  color: '#fff', fontSize: 13, fontWeight: 600, transition: 'opacity 0.12s',
                  opacity: !newTicket.title.trim() ? 0.4 : 1,
                }}
              >
                {newTicket.isDev ? 'Criar → Demandas Tech' : 'Criar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50, backdropFilter: 'blur(6px)' }}>
          <div style={{
            background: 'var(--bg1)', border: '1px solid var(--border2)',
            borderRadius: 8, width: '100%', maxWidth: 600, maxHeight: '85vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
          }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--text3)', marginBottom: 4, ...mono }}>RELATÓRIO</p>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', ...syne }}>{reportModal.nome}</h2>
                <p style={{ fontSize: 9, color: 'var(--text3)', marginTop: 3, ...mono }}>
                  {new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setReportModal(null)} style={{ padding: 6, borderRadius: 4, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text3)', cursor: 'pointer', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px' }}>
              {brokerTickets(reportModal.nome).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <FileText size={34} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Nenhum ticket encontrado</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {brokerTickets(reportModal.nome).map(ticket => {
                    const sc = S[ticket.status];
                    const pc = P[ticket.priority];
                    return (
                      <div key={ticket.id} style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderLeft: `3px solid ${pc?.bar}`, borderRadius: 6, padding: '11px 13px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{ticket.title}</p>
                              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700, letterSpacing: '0.08em', ...mono, background: pc?.bg, color: pc?.text, border: `1px solid ${pc?.border}` }}>
                                {ticket.priority.toUpperCase()}
                              </span>
                              {ticket.isDev && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 8, padding: '1px 5px', borderRadius: 2, fontWeight: 700, ...mono, background: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid var(--purple-border)' }}>
                                  <Code2 size={7} /> TECH
                                </span>
                              )}
                            </div>
                            {ticket.description && <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>{ticket.description}</p>}
                            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--text3)' }}>
                              <span>por: <span style={{ color: 'var(--text2)', ...mono }}>{ticket.createdBy}</span></span>
                              {ticket.assignedTo && <span>para: <span style={{ color: 'var(--blue)', ...mono }}>{ticket.assignedTo}</span></span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 3, fontWeight: 700, ...mono, background: sc?.bg, color: sc?.text, border: `1px solid ${sc?.border}` }}>
                              {ticket.status.toUpperCase()}
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {ticket.status === 'Pendente' && (
                                <>
                                  <button onClick={() => onUpdateTicket(ticket.id, 'Em Andamento')} className="btn btn-xs" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', borderColor: 'var(--yellow-border)' }}>Iniciar</button>
                                  <button onClick={() => onUpdateTicket(ticket.id, 'Resolvido')} className="btn btn-xs" style={{ background: 'var(--green-bg)', color: 'var(--green)', borderColor: 'var(--green-border)' }}>Resolver</button>
                                </>
                              )}
                              {ticket.status === 'Em Andamento' && (
                                <button onClick={() => onUpdateTicket(ticket.id, 'Resolvido')} className="btn btn-xs" style={{ background: 'var(--green-bg)', color: 'var(--green)', borderColor: 'var(--green-border)' }}>Resolver</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '10px 22px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setReportModal(null)} className="btn">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
