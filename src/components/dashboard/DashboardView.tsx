import React, { useState, useMemo } from 'react';
import {
  ExternalLink, Plus, BarChart3, X,
  AlertTriangle,
  FileText, Clock, ChevronLeft, ChevronRight, Code2,
} from 'lucide-react';
import type { Broker, Ticket } from '../../data/brokers';
import { isOverdue, dateLabel, isCreatedToday } from '../../lib/ticketUtils';

interface DashboardViewProps {
  searchTerm: string;
  currentUser: string;
  brokers: Broker[];
  tickets: Ticket[];
  onAddTicket: (ticket: Ticket) => void;
  onUpdateTicket: (id: string, status: Ticket['status']) => void;
}

function generateDates() {
  const dates = [];
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  for (let i = 30; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push({ key: d.toISOString().split('T')[0], label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), isToday: false });
  }
  dates.push({ key: todayKey, label: 'Hoje', isToday: true });
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ key: d.toISOString().split('T')[0], label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), isToday: false });
  }
  return dates;
}
const TODAY_KEY = new Date().toISOString().split('T')[0];

const statusDot: Record<string, string> = {
  Pendente: 'var(--red)',
  'Em Andamento': 'var(--yellow)',
  Resolvido: 'var(--green)',
  Fechado: 'var(--text3)',
  Aberto: 'var(--red)',
};

const statusBadgeStyle: Record<string, React.CSSProperties> = {
  Pendente:     { background: 'var(--red-bg)',    border: '1px solid var(--red-border)',    color: 'var(--red)' },
  'Em Andamento':{ background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', color: 'var(--yellow)' },
  Resolvido:    { background: 'var(--green-bg)',  border: '1px solid var(--green-border)',  color: 'var(--green)' },
  Fechado:      { background: 'var(--bg3)',       border: '1px solid var(--border)',        color: 'var(--text3)' },
  Aberto:       { background: 'var(--red-bg)',    border: '1px solid var(--red-border)',    color: 'var(--red)' },
};

const priorityBadgeStyle: Record<string, React.CSSProperties> = {
  Urgente: { background: 'var(--red)',    color: '#fff' },
  Alta:    { background: 'var(--orange)', color: '#fff' },
  Média:   { background: 'var(--yellow)', color: '#fff' },
  Baixa:   { background: 'var(--green)',  color: '#fff' },
};

const priorityCardBorder: Record<string, string> = {
  Urgente: 'var(--red)',
  Alta:    'var(--orange)',
  Média:   'var(--yellow)',
  Baixa:   'var(--green)',
};

const priorityReportBorder: Record<string, string> = {
  Urgente: 'var(--red)',
  Alta:    'var(--orange)',
  Média:   'var(--yellow)',
  Baixa:   'var(--green)',
};

export default function DashboardView({ searchTerm, currentUser, brokers, tickets, onAddTicket, onUpdateTicket }: DashboardViewProps) {
  const [currentDate, setCurrentDate] = useState(TODAY_KEY);
  const [dateStart, setDateStart] = useState(27);
  const [createModal, setCreateModal] = useState<Broker | null>(null);
  const [reportModal, setReportModal] = useState<Broker | null>(null);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'Média' as Ticket['priority'],
    assignedTo: '',
    isDev: false,
  });

  const dates = useMemo(() => generateDates(), []);
  const visibleDates = dates.slice(dateStart, dateStart + 7);

  const filtered = useMemo(() => {
    const brokerPriority = (nome: string) => {
      const active = tickets.filter(t => t.broker.nome === nome && t.status !== 'Resolvido' && t.status !== 'Fechado');
      if (active.some(t => t.priority === 'Urgente')) return 0;
      if (active.some(t => t.status === 'Pendente')) return 1;
      if (active.length > 0) return 2;
      return 3;
    };
    return brokers
      .filter(b => b.nome.toLowerCase().includes(searchTerm.toLowerCase()) || b.responsavel.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => brokerPriority(a.nome) - brokerPriority(b.nome));
  }, [searchTerm, brokers, tickets]);

  const brokerTickets = (brokerNome: string) => tickets.filter(t =>
    t.broker.nome === brokerNome &&
    (t.status !== 'Resolvido' && t.status !== 'Fechado' ? t.date <= currentDate : t.date === currentDate)
  );

  const kpis = [
    { label: 'Total Brokers',     value: brokers.length,                                                                           color: 'var(--blue)',   glow: 'var(--blue-bg)' },
    { label: 'Tickets Pendentes', value: tickets.filter(t => t.status === 'Pendente').length,                                      color: 'var(--red)',    glow: 'var(--red-bg)' },
    { label: 'Em Andamento',      value: tickets.filter(t => t.status === 'Em Andamento').length,                                  color: 'var(--yellow)', glow: 'var(--yellow-bg)' },
    { label: 'Resolvidos Hoje',   value: tickets.filter(t => t.status === 'Resolvido' && t.updatedAt?.startsWith(TODAY_KEY)).length, color: 'var(--green)', glow: 'var(--green-bg)' },
  ];

  const handleCreateTicket = () => {
    if (!newTicket.title.trim() || !createModal) return;
    const ticket: Ticket = {
      id: Date.now().toString(),
      broker: createModal,
      date: currentDate,
      status: 'Pendente',
      priority: newTicket.priority,
      title: newTicket.title,
      description: newTicket.description,
      assignedTo: newTicket.assignedTo,
      createdBy: currentUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDev: newTicket.isDev,
    };
    onAddTicket(ticket);
    setNewTicket({ title: '', description: '', priority: 'Média', assignedTo: '', isDev: false });
    setCreateModal(null);
  };

  return (
    <div className="space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(({ label, value, color, glow }) => (
          <div key={label} className="kpi-card">
            <p className="section-label mb-2">{label}</p>
            <p className="num text-3xl font-bold" style={{ color }}>{value}</p>
            <div className="mt-2.5 h-0.5 rounded-full" style={{ background: glow, border: `1px solid ${color}22` }} />
          </div>
        ))}
      </div>

      {/* Date Tabs */}
      <div className="card !p-2.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDateStart(Math.max(0, dateStart - 1))}
            disabled={dateStart === 0}
            style={{ color: 'var(--text3)' }}
            className="p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-25 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-0.5 flex-1 overflow-hidden">
            {visibleDates.map(date => {
              const active = currentDate === date.key;
              const dayNum = new Date(date.key + 'T12:00:00').getDate();
              return (
                <button
                  key={date.key}
                  onClick={() => setCurrentDate(date.key)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg transition-all"
                >
                  <span className="hidden sm:block uppercase tracking-wider text-[9px] font-semibold"
                    style={{ color: active ? 'var(--blue)' : date.isToday ? 'var(--blue)' : 'var(--text3)' }}>
                    {date.label}
                  </span>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all num"
                    style={active
                      ? { background: 'var(--blue)', color: '#fff' }
                      : date.isToday
                      ? { background: 'var(--blue-bg)', color: 'var(--blue)', outline: '1px solid var(--blue-border)' }
                      : { color: 'var(--text2)' }
                    }
                  >
                    {dayNum}
                  </span>
                  <span className="hidden sm:block text-[9px]"
                    style={{ color: active ? 'var(--blue)' : 'var(--text3)' }}>
                    {new Date(date.key + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setDateStart(Math.min(dates.length - 7, dateStart + 1))}
            disabled={dateStart + 7 >= dates.length}
            style={{ color: 'var(--text3)' }}
            className="p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-25 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Featured Brokers */}
      {(() => {
        const FEATURED = ['Option Market','Clarus Option','Tourex','Axiun','Tradex Id','Ember','Dupocket','Hiove','Orion Option','Peak Broker'];
        const featuredBrokers = FEATURED.map(nome => brokers.find(b => b.nome === nome)).filter(Boolean) as Broker[];
        if (featuredBrokers.length === 0) return null;
        return (
          <div className="card !p-4">
            <p className="section-label mb-3">Mais frequentes</p>
            <div className="flex flex-wrap gap-1.5">
              {featuredBrokers.map(broker => {
                const bt = brokerTickets(broker.nome);
                const active = bt.filter(t => t.status !== 'Resolvido' && t.status !== 'Fechado');
                const hasUrgent = active.some(t => t.priority === 'Urgente');
                const hasPending = active.some(t => t.status === 'Pendente');
                const isClean = active.length === 0;
                const dotColor = hasUrgent ? 'var(--red)' : hasPending ? 'var(--yellow)' : isClean ? 'var(--green)' : 'var(--blue)';
                const btnStyle: React.CSSProperties = hasUrgent
                  ? { background: 'var(--red-bg)', border: '1px solid var(--red-border)', color: 'var(--red)' }
                  : hasPending
                  ? { background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)', color: 'var(--yellow)' }
                  : isClean
                  ? { background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)' }
                  : { background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--text2)' };

                return (
                  <button
                    key={broker.nome}
                    onClick={() => setCreateModal(broker)}
                    style={btnStyle}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all hover:opacity-80 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                    {broker.nome}
                    {active.length > 0 && (
                      <span className="num text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ background: 'rgba(0,0,0,0.25)', color: 'inherit' }}>
                        {active.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Broker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
        {filtered.map(broker => {
          const bTickets = brokerTickets(broker.nome);
          const activeTickets = bTickets.filter(t => t.status !== 'Resolvido' && t.status !== 'Fechado');
          const urgent = activeTickets.filter(t => t.priority === 'Urgente').length;
          const devCount = bTickets.filter(t => t.isDev).length;
          const lastTicket = bTickets[0];
          const priorityOrder = ['Urgente', 'Alta', 'Média', 'Baixa'] as const;
          const topPriority = priorityOrder.find(p => activeTickets.some(t => t.priority === p));
          const borderColor = topPriority ? priorityCardBorder[topPriority] : 'var(--border)';

          return (
            <div
              key={broker.nome}
              style={{ background: 'var(--bg2)', border: `1.5px solid ${borderColor}`, borderRadius: '12px' }}
              className="flex flex-col hover:shadow-lg transition-all duration-200 overflow-hidden"
            >
              {/* Card Header */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[13px] font-semibold truncate" style={{ color: 'var(--text1)' }}>{broker.nome}</h3>
                    {urgent > 0 && (
                      <span className="badge badge-red flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text3)' }}>{broker.responsavel}</p>
                </div>
                <button
                  onClick={() => setCreateModal(broker)}
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                  style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)', color: 'var(--blue)' }}
                >
                  <Plus className="w-3 h-3" /> Ticket
                </button>
              </div>

              {/* Active badge */}
              <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
                {activeTickets.length > 0 ? (
                  <>
                    <span className="badge badge-blue">
                      <span className="num">{activeTickets.length}</span> aberto{activeTickets.length !== 1 ? 's' : ''}
                    </span>
                    {devCount > 0 && (
                      <span className="badge badge-purple">
                        <Code2 className="w-2.5 h-2.5" />
                        <span className="num">{devCount}</span> tech
                      </span>
                    )}
                  </>
                ) : (
                  <span className="badge badge-gray">Sem tickets</span>
                )}
              </div>

              {/* Status Grid */}
              <div className="px-4 pb-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="section-label mb-2">Status</p>
                <div className="grid grid-cols-2 gap-y-1.5">
                  {[
                    { label: 'Pendentes',  status: 'Pendente',     dotColor: 'var(--red)' },
                    { label: 'Andamento',  status: 'Em Andamento', dotColor: 'var(--yellow)' },
                    { label: 'Resolvidos', status: 'Resolvido',    dotColor: 'var(--green)' },
                    { label: 'Fechados',   status: 'Fechado',      dotColor: 'var(--text3)' },
                  ].map(({ label, status, dotColor }) => {
                    const count = bTickets.filter(t => t.status === status).length;
                    return (
                      <div key={status} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
                        <span className="text-[11px]" style={{ color: 'var(--text2)' }}>
                          {label}:{' '}
                          <span className="num font-semibold" style={{ color: count > 0 ? dotColor : 'var(--text2)' }}>
                            {count}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Last Ticket */}
              {lastTicket && (
                <div className="px-4 pb-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3 h-3" style={{ color: 'var(--text3)' }} />
                    <p className="section-label">Último Ticket</p>
                    {lastTicket.isDev && (
                      <span className="badge badge-purple ml-auto">
                        <Code2 className="w-2.5 h-2.5" /> Tech
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusDot[lastTicket.status] || 'var(--text3)' }} />
                    <p className="text-[12px] truncate flex-1" style={{ color: 'var(--text1)' }}>{lastTicket.title}</p>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                      style={priorityBadgeStyle[lastTicket.priority]}
                    >
                      {lastTicket.priority}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto px-4 pb-3 pt-2.5 flex gap-1.5" style={{ borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setReportModal(broker)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-lg transition-all cursor-pointer hover:bg-white/[0.05]"
                  style={{ color: 'var(--text2)' }}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Relatório
                </button>
                {broker.dominio && (
                  <a
                    href={broker.dominio.startsWith('http') ? broker.dominio : `https://${broker.dominio}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-medium py-1.5 rounded-lg transition-all hover:bg-white/[0.05]"
                    style={{ color: 'var(--text2)' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Ir para Admin
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Ticket Modal */}
      {createModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text1)' }}>Novo Ticket</h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>{createModal.nome}</p>
              </div>
              <button onClick={() => setCreateModal(null)} className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06] cursor-pointer" style={{ color: 'var(--text2)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">Título *</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))}
                  className="form-control"
                  placeholder="Descreva o problema"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <textarea
                  value={newTicket.description}
                  onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  className="form-control"
                  style={{ resize: 'none' }}
                  rows={3}
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer"
                style={newTicket.isDev
                  ? { border: '1.5px solid var(--purple)', background: 'var(--purple-bg)' }
                  : { border: '1.5px solid var(--border2)', background: 'var(--bg3)' }
                }
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: newTicket.isDev ? 'var(--purple)' : 'var(--bg4)' }}>
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[13px] font-semibold" style={{ color: newTicket.isDev ? 'var(--purple)' : 'var(--text1)' }}>
                    Direcionar para Demandas Tech
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: newTicket.isDev ? 'var(--purple)' : 'var(--text3)' }}>
                    {newTicket.isDev ? 'Ticket visível em Demandas Tech' : 'Ativar para enviar à sessão de DEV'}
                  </p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: newTicket.isDev ? 'var(--purple)' : 'var(--border3)', background: newTicket.isDev ? 'var(--purple)' : 'transparent' }}>
                  {newTicket.isDev && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setCreateModal(null)} className="btn flex-1">Cancelar</button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.title.trim()}
                className="flex-1 px-4 py-2 text-[13px] font-semibold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ background: newTicket.isDev ? 'var(--purple)' : 'var(--blue)' }}
              >
                {newTicket.isDev ? 'Criar → Demandas Tech' : 'Criar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text1)' }}>
                  Relatório — {reportModal.nome}
                </h2>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                  {new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <button onClick={() => setReportModal(null)} className="p-1.5 rounded-lg transition-colors hover:bg-white/[0.06] cursor-pointer" style={{ color: 'var(--text2)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {brokerTickets(reportModal.nome).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text3)' }} />
                <p className="text-[13px]" style={{ color: 'var(--text2)' }}>Nenhum ticket encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {brokerTickets(reportModal.nome).map(ticket => (
                  <div
                    key={ticket.id}
                    style={{
                      background: 'var(--bg3)',
                      border: '1px solid var(--border)',
                      borderLeft: `3px solid ${priorityReportBorder[ticket.priority] || 'var(--border)'}`,
                      borderRadius: '10px',
                    }}
                    className="p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text1)' }}>{ticket.title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={priorityBadgeStyle[ticket.priority]}>
                            {ticket.priority}
                          </span>
                          {isOverdue(ticket) && (
                            <span className="badge badge-orange">⏰ Atrasado</span>
                          )}
                          {ticket.isDev && (
                            <span className="badge badge-purple"><Code2 className="w-2.5 h-2.5" /> Tech</span>
                          )}
                        </div>
                        {ticket.description && (
                          <p className="text-[12px] mb-2" style={{ color: 'var(--text2)' }}>{ticket.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text3)' }}>
                          <span>Por: <span style={{ color: 'var(--text2)' }}>{ticket.createdBy}</span></span>
                          {ticket.assignedTo && (
                            <span>Para: <span style={{ color: 'var(--blue)' }}>{ticket.assignedTo}</span></span>
                          )}
                          {!isCreatedToday(ticket.createdAt) && (
                            <span>
                              📅 {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                              {' '}<span style={{ color: 'var(--orange)' }}>({dateLabel(ticket.createdAt)})</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end flex-shrink-0">
                        <span className="status-badge num" style={statusBadgeStyle[ticket.status]}>{ticket.status}</span>
                        {(ticket.status === 'Pendente' || ticket.status === 'Em Andamento') && (
                          <button
                            onClick={() => onUpdateTicket(ticket.id, 'Resolvido')}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:opacity-80"
                            style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border)', color: 'var(--green)' }}
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end mt-5 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setReportModal(null)} className="btn btn-sm">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
