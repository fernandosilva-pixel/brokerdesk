import React, { useState, useMemo } from 'react';
import {
  ExternalLink, Plus, BarChart3, X,
  Circle, Play, CheckCircle, AlertTriangle,
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
  // 30 days in the past
  for (let i = 30; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    dates.push({ key: d.toISOString().split('T')[0], label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), sub: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), isToday: false });
  }
  // today
  dates.push({ key: todayKey, label: 'Hoje', sub: today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), isToday: true });
  // 30 days ahead
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ key: d.toISOString().split('T')[0], label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), sub: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), isToday: false });
  }
  return dates;
}
const TODAY_KEY = new Date().toISOString().split('T')[0];

const statusConfig = {
  Pendente: { color: 'bg-red-900/40 text-red-400 border-red-700', dot: 'bg-red-500', Icon: Circle },
  'Em Andamento': { color: 'bg-yellow-900/40 text-yellow-400 border-yellow-700', dot: 'bg-yellow-500', Icon: Play },
  Resolvido: { color: 'bg-green-900/40 text-green-400 border-green-700', dot: 'bg-green-500', Icon: CheckCircle },
  Fechado: { color: 'bg-gray-700 text-gray-400 border-gray-600', dot: 'bg-gray-400', Icon: CheckCircle },
  Aberto: { color: 'bg-red-900/40 text-red-400 border-red-700', dot: 'bg-red-500', Icon: Circle },
} as const;

const priorityConfig = {
  Urgente: { color: 'bg-red-500 text-white', border: 'border-l-red-500' },
  Alta: { color: 'bg-orange-500 text-white', border: 'border-l-orange-400' },
  Média: { color: 'bg-yellow-500 text-white', border: 'border-l-yellow-400' },
  Baixa: { color: 'bg-green-500 text-white', border: 'border-l-green-400' },
} as const;

export default function DashboardView({ searchTerm, currentUser, brokers, tickets, onAddTicket, onUpdateTicket }: DashboardViewProps) {
  const [currentDate, setCurrentDate] = useState(TODAY_KEY);
  const [dateStart, setDateStart] = useState(27); // starts so today is visible (index 30, show 30-36)
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

  const filtered = useMemo(() =>
    brokers.filter(b =>
      b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm, brokers]);

  // Unresolved tickets appear on every date; resolved/closed only on their own date
  const brokerTickets = (brokerNome: string) => tickets.filter(t =>
    t.broker.nome === brokerNome &&
    (t.status !== 'Resolvido' && t.status !== 'Fechado' ? true : t.date === currentDate)
  );

  const kpis = [
    { label: 'Total Brokers', value: brokers.length, color: 'text-blue-400', bg: 'bg-blue-500' },
    { label: 'Tickets Pendentes', value: tickets.filter(t => t.status === 'Pendente').length, color: 'text-red-400', bg: 'bg-red-500' },
    { label: 'Em Andamento', value: tickets.filter(t => t.status === 'Em Andamento').length, color: 'text-yellow-400', bg: 'bg-yellow-500' },
    { label: 'Resolvidos Hoje', value: tickets.filter(t => t.status === 'Resolvido' && t.updatedAt?.startsWith(TODAY_KEY)).length, color: 'text-green-400', bg: 'bg-green-500' },
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
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, bg }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <div className={`mt-2 h-1 rounded-full opacity-30 ${bg}`} />
          </div>
        ))}
      </div>

      {/* Date Tabs */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateStart(Math.max(0, dateStart - 1))}
            disabled={dateStart === 0}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex gap-1 flex-1 overflow-hidden">
            {visibleDates.map(date => {
              const active = currentDate === date.key;
              const dayNum = new Date(date.key + 'T12:00:00').getDate();
              return (
                <button
                  key={date.key}
                  onClick={() => setCurrentDate(date.key)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 px-1 transition-all"
                >
                  {/* Day label — hidden on mobile */}
                  <span className={`hidden sm:block uppercase tracking-wide text-[10px] font-medium ${active ? 'text-blue-400' : date.isToday ? 'text-blue-400' : 'text-gray-500'}`}>
                    {date.label}
                  </span>
                  {/* Circle with day number */}
                  <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : date.isToday
                      ? 'bg-blue-900/40 text-blue-400 ring-1 ring-blue-500/50'
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}>
                    {dayNum}
                  </span>
                  {/* Month — hidden on mobile */}
                  <span className={`hidden sm:block text-[10px] ${active ? 'text-blue-300' : 'text-gray-600'}`}>
                    {new Date(date.key + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setDateStart(Math.min(dates.length - 7, dateStart + 1))}
            disabled={dateStart + 7 >= dates.length}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-4">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Mais frequentes</p>
            <div className="flex flex-wrap gap-2">
              {featuredBrokers.map(broker => {
                const bt = brokerTickets(broker.nome);
                const active = bt.filter(t => t.status !== 'Resolvido' && t.status !== 'Fechado');
                const hasUrgent = active.some(t => t.priority === 'Urgente');
                const hasPending = active.some(t => t.status === 'Pendente');
                const isClean = active.length === 0;
                return (
                  <button
                    key={broker.nome}
                    onClick={() => setCreateModal(broker)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                      hasUrgent
                        ? 'border-red-700/60 bg-red-900/20 text-red-300 hover:bg-red-900/30'
                        : hasPending
                        ? 'border-yellow-700/60 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/30'
                        : isClean
                        ? 'border-green-700/40 bg-green-900/10 text-green-400 hover:bg-green-900/20'
                        : 'border-gray-700 bg-gray-700/40 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasUrgent ? 'bg-red-400' : hasPending ? 'bg-yellow-400' : isClean ? 'bg-green-400' : 'bg-blue-400'}`} />
                    {broker.nome}
                    {active.length > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hasUrgent ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filtered.map(broker => {
          const bTickets = brokerTickets(broker.nome);
          const activeTickets = bTickets.filter(t => t.status !== 'Resolvido' && t.status !== 'Fechado');
          const pending = activeTickets.filter(t => t.status === 'Pendente').length;
          const urgent = activeTickets.filter(t => t.priority === 'Urgente').length;
          const devCount = bTickets.filter(t => t.isDev).length;
          const lastTicket = bTickets[0];

          return (
            <div
              key={broker.nome}
              className={`bg-gray-800 rounded-xl border shadow-sm hover:shadow-lg hover:shadow-black/20 transition-all duration-200 overflow-hidden flex flex-col ${
                urgent > 0 ? 'border-l-4 border-l-red-500 border-gray-700' :
                pending > 0 ? 'border-l-4 border-l-yellow-400 border-gray-700' :
                'border-gray-700'
              }`}
            >
              {/* Card Header */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{broker.nome}</h3>
                    {urgent > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-900/50 text-red-400 rounded-full border border-red-700">
                        <AlertTriangle className="w-2.5 h-2.5" /> Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{broker.responsavel}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <a href={broker.dominio} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setCreateModal(broker)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Ticket
                  </button>
                </div>
              </div>

              {/* Ticket Badges */}
              <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
                {bTickets.length > 0 ? (
                  <>
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-900/40 text-blue-400 border border-blue-700/50 rounded-full">
                      {bTickets.length} ticket{bTickets.length !== 1 ? 's' : ''}
                    </span>
                    {pending > 0 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-red-900/40 text-red-400 border border-red-700/50 rounded-full">
                        {pending} aberto{pending !== 1 ? 's' : ''}
                      </span>
                    )}
                    {devCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 bg-purple-900/40 text-purple-400 border border-purple-700/50 rounded-full">
                        <Code2 className="w-2.5 h-2.5" /> {devCount} tech
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-700 text-gray-500 border border-gray-600 rounded-full">
                    Sem tickets
                  </span>
                )}
              </div>

              {/* Status Grid */}
              <div className="px-4 pb-3 border-t border-gray-700/50 pt-3">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Status dos Tickets</p>
                <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-400">
                  {[
                    { label: 'Pendentes', status: 'Pendente', dot: 'bg-red-400' },
                    { label: 'Andamento', status: 'Em Andamento', dot: 'bg-yellow-400' },
                    { label: 'Resolvidos', status: 'Resolvido', dot: 'bg-green-400' },
                    { label: 'Fechados', status: 'Fechado', dot: 'bg-gray-500' },
                  ].map(({ label, status, dot }) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span>{label}: <span className="font-semibold text-gray-300">{bTickets.filter(t => t.status === status).length}</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Ticket */}
              {lastTicket && (
                <div className="px-4 pb-3 border-t border-gray-700/50 pt-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Último Ticket</p>
                    {lastTicket.isDev && (
                      <span className="ml-auto flex items-center gap-0.5 text-[10px] text-purple-400">
                        <Code2 className="w-2.5 h-2.5" /> Tech
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusConfig[lastTicket.status]?.dot || 'bg-gray-400'}`} />
                    <p className="text-xs text-gray-300 truncate flex-1">{lastTicket.title}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityConfig[lastTicket.priority]?.color}`}>
                      {lastTicket.priority}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto px-4 pb-3 pt-2 border-t border-gray-700/50">
                <button
                  onClick={() => setReportModal(broker)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-400 hover:bg-gray-700 py-1.5 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Ver Relatório
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Ticket Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Novo Ticket</h2>
                <p className="text-xs text-gray-400 mt-0.5">{createModal.nome}</p>
              </div>
              <button onClick={() => setCreateModal(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={e => setNewTicket(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  placeholder="Descreva o problema"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descrição</label>
                <textarea
                  value={newTicket.description}
                  onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white placeholder-gray-500"
                  rows={3}
                  placeholder="Detalhes adicionais..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Prioridade</label>
                  <select
                    value={newTicket.priority}
                    onChange={e => setNewTicket(p => ({ ...p, priority: e.target.value as Ticket['priority'] }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option>Baixa</option>
                    <option>Média</option>
                    <option>Alta</option>
                    <option>Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Atribuir a</label>
                  <select
                    value={newTicket.assignedTo}
                    onChange={e => setNewTicket(p => ({ ...p, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="">Ninguém</option>
                    <option>suporte@mybroker.com</option>
                    <option>gerente@mybroker.com</option>
                  </select>
                </div>
              </div>

              {/* Toggle Demandas Tech */}
              <button
                type="button"
                onClick={() => setNewTicket(p => ({ ...p, isDev: !p.isDev }))}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-150 ${
                  newTicket.isDev
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${newTicket.isDev ? 'bg-purple-600' : 'bg-gray-600'}`}>
                  <Code2 className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${newTicket.isDev ? 'text-purple-300' : 'text-gray-300'}`}>
                    Direcionar para Demandas Tech
                  </p>
                  <p className={`text-xs mt-0.5 ${newTicket.isDev ? 'text-purple-400' : 'text-gray-500'}`}>
                    {newTicket.isDev
                      ? 'Ticket vinculado ao broker e visível em Demandas Tech'
                      : 'Ativar para enviar à sessão de DEV'}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${newTicket.isDev ? 'border-purple-500 bg-purple-500' : 'border-gray-500'}`}>
                  {newTicket.isDev && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.title.trim()}
                className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  newTicket.isDev ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {newTicket.isDev ? 'Criar → Demandas Tech' : 'Criar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Relatório — {reportModal.nome}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => setReportModal(null)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {brokerTickets(reportModal.nome).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Nenhum ticket encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {brokerTickets(reportModal.nome).map(ticket => {
                  const cfg = statusConfig[ticket.status];
                  const pcfg = priorityConfig[ticket.priority];
                  return (
                    <div key={ticket.id} className={`border rounded-xl p-4 border-l-4 ${pcfg?.border || 'border-l-gray-600'} border-gray-700 bg-gray-700/30`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-semibold text-white truncate">{ticket.title}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pcfg?.color}`}>{ticket.priority}</span>
                            {isOverdue(ticket) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-400 border border-orange-700/50">
                                ⏰ Atrasado
                              </span>
                            )}
                            {ticket.isDev && (
                              <span className="flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 bg-purple-900/50 text-purple-400 border border-purple-700/50 rounded">
                                <Code2 className="w-2.5 h-2.5" /> Tech
                              </span>
                            )}
                          </div>
                          {ticket.description && <p className="text-xs text-gray-400 mb-2">{ticket.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>Por: <span className="text-gray-300">{ticket.createdBy}</span></span>
                            {ticket.assignedTo && <span>Para: <span className="text-blue-400">{ticket.assignedTo}</span></span>}
                            {!isCreatedToday(ticket.createdAt) && (
                              <span className="text-gray-500">
                                📅 {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                                {' '}
                                <span className="text-orange-400/80">({dateLabel(ticket.createdAt)})</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg?.color}`}>{ticket.status}</span>
                          {ticket.status === 'Pendente' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => onUpdateTicket(ticket.id, 'Em Andamento')} className="text-[11px] px-2 py-1 bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 rounded-lg hover:bg-yellow-900/60 transition-colors">Iniciar</button>
                              <button onClick={() => onUpdateTicket(ticket.id, 'Resolvido')} className="text-[11px] px-2 py-1 bg-green-900/40 text-green-400 border border-green-700/50 rounded-lg hover:bg-green-900/60 transition-colors">Resolver</button>
                            </div>
                          )}
                          {ticket.status === 'Em Andamento' && (
                            <button onClick={() => onUpdateTicket(ticket.id, 'Resolvido')} className="text-[11px] px-2 py-1 bg-green-900/40 text-green-400 border border-green-700/50 rounded-lg hover:bg-green-900/60 transition-colors">Resolver</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end mt-5 pt-4 border-t border-gray-700">
              <button onClick={() => setReportModal(null)} className="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
