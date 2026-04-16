import React, { useState, useMemo } from 'react';
import {
  ExternalLink, Plus, BarChart3, X,
  Circle, Play, CheckCircle, AlertTriangle,
  FileText, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { brokers } from '../../data/brokers';
import type { Broker, Ticket } from '../../data/brokers';

interface DashboardViewProps {
  searchTerm: string;
  currentUser: string;
}

const MOCK_TICKETS: Ticket[] = [
  { id: '1', broker: brokers[0], date: new Date().toISOString().split('T')[0], status: 'Pendente', priority: 'Alta', title: 'Problema no sistema de pagamentos', description: 'Cliente relatou erro ao processar pagamento', assignedTo: 'suporte@mybroker.com', createdBy: 'usuario@mybroker.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', broker: brokers[1], date: new Date().toISOString().split('T')[0], status: 'Em Andamento', priority: 'Urgente', title: 'Atualização de sistema urgente', description: 'Sistema precisa ser atualizado', assignedTo: 'gerente@mybroker.com', createdBy: 'usuario@mybroker.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', broker: brokers[2], date: new Date().toISOString().split('T')[0], status: 'Resolvido', priority: 'Média', title: 'Configuração de API', description: 'Nova API de integração', assignedTo: 'suporte@mybroker.com', createdBy: 'usuario@mybroker.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '4', broker: brokers[3], date: new Date().toISOString().split('T')[0], status: 'Pendente', priority: 'Alta', title: 'Relatório mensal atrasado', description: 'Relatório de abril não enviado', assignedTo: '', createdBy: 'usuario@mybroker.com', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

function generateDates() {
  const dates = [];
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  dates.push({ key: todayKey, label: 'Hoje', sub: today.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), isToday: true });
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({ key: d.toISOString().split('T')[0], label: d.toLocaleDateString('pt-BR', { weekday: 'short' }), sub: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), isToday: false });
  }
  return dates;
}

const statusConfig = {
  Pendente: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', Icon: Circle },
  'Em Andamento': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', Icon: Play },
  Resolvido: { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', Icon: CheckCircle },
  Fechado: { color: 'bg-gray-700 text-gray-400 border-gray-700', dot: 'bg-gray-400', Icon: CheckCircle },
  Aberto: { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', Icon: Circle },
} as const;

const priorityConfig = {
  Urgente: { color: 'bg-red-500 text-white', border: 'border-l-red-500' },
  Alta: { color: 'bg-orange-500 text-white', border: 'border-l-orange-400' },
  Média: { color: 'bg-yellow-400 text-white', border: 'border-l-yellow-400' },
  Baixa: { color: 'bg-green-500 text-white', border: 'border-l-green-400' },
} as const;

export default function DashboardView({ searchTerm, currentUser }: DashboardViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateStart, setDateStart] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [createModal, setCreateModal] = useState<Broker | null>(null);
  const [reportModal, setReportModal] = useState<Broker | null>(null);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'Média' as Ticket['priority'], assignedTo: '' });

  const dates = useMemo(() => generateDates(), []);
  const visibleDates = dates.slice(dateStart, dateStart + 7);

  const filtered = useMemo(() =>
    brokers.filter(b =>
      b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]);

  const brokerTickets = (brokerNome: string) => tickets.filter(t => t.broker.nome === brokerNome);

  const kpis = [
    { label: 'Total Brokers', value: brokers.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tickets Pendentes', value: tickets.filter(t => t.status === 'Pendente').length, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Em Andamento', value: tickets.filter(t => t.status === 'Em Andamento').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Resolvidos Hoje', value: tickets.filter(t => t.status === 'Resolvido').length, color: 'text-green-600', bg: 'bg-green-50' },
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
    };
    setTickets(prev => [ticket, ...prev]);
    setNewTicket({ title: '', description: '', priority: 'Média', assignedTo: '' });
    setCreateModal(null);
  };

  const updateStatus = (id: string, status: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, color, bg }) => (
          <div key={label} className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <div className={`mt-2 h-1 rounded-full ${bg}`} />
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
            {visibleDates.map(date => (
              <button
                key={date.key}
                onClick={() => setCurrentDate(date.key)}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                  currentDate === date.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : date.isToday
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-400 hover:bg-gray-900'
                }`}
              >
                <span className="uppercase tracking-wide text-[10px]">{date.label}</span>
                <span className="font-semibold mt-0.5">{date.sub}</span>
              </button>
            ))}
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

      {/* Broker Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filtered.map(broker => {
          const bTickets = brokerTickets(broker.nome);
          const pending = bTickets.filter(t => t.status === 'Pendente').length;
          const urgent = bTickets.filter(t => t.priority === 'Urgente').length;
          const lastTicket = bTickets[0];

          return (
            <div
              key={broker.nome}
              className={`bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col ${
                urgent > 0 ? 'border-red-300 border-l-4 border-l-red-500' :
                pending > 0 ? 'border-yellow-300 border-l-4 border-l-yellow-400' :
                'border-gray-700'
              }`}
            >
              {/* Card Header */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white truncate">{broker.nome}</h3>
                    {urgent > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full border border-red-200">
                        <AlertTriangle className="w-2.5 h-2.5" /> Urgente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{broker.responsavel}</p>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <a href={broker.dominio} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
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
                    <span className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">
                      {bTickets.length} ticket{bTickets.length !== 1 ? 's' : ''}
                    </span>
                    {pending > 0 && (
                      <span className="text-[11px] font-medium px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">
                        {pending} aberto{pending !== 1 ? 's' : ''}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-900 text-gray-400 border border-gray-700 rounded-full">
                    Sem tickets
                  </span>
                )}
              </div>

              {/* Status Grid */}
              <div className="px-4 pb-3 border-t border-gray-50 pt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Status dos Tickets</p>
                <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-400">
                  {[
                    { label: 'Pendentes', status: 'Pendente', dot: 'bg-red-400' },
                    { label: 'Andamento', status: 'Em Andamento', dot: 'bg-yellow-400' },
                    { label: 'Resolvidos', status: 'Resolvido', dot: 'bg-green-400' },
                    { label: 'Fechados', status: 'Fechado', dot: 'bg-gray-300' },
                  ].map(({ label, status, dot }) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                      <span>{label}: <span className="font-semibold text-gray-100">{bTickets.filter(t => t.status === status).length}</span></span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Ticket */}
              {lastTicket && (
                <div className="px-4 pb-3 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Último Ticket</p>
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
              <div className="mt-auto px-4 pb-3 pt-2 border-t border-gray-50">
                <button
                  onClick={() => setReportModal(broker)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Novo Ticket</h2>
                <p className="text-xs text-gray-400 mt-0.5">{createModal.nome}</p>
              </div>
              <button onClick={() => setCreateModal(null)} className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
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
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Descreva o problema"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descrição</label>
                <textarea
                  value={newTicket.description}
                  onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400"
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
                    className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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
                    className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="">Ninguém</option>
                    <option>suporte@mybroker.com</option>
                    <option>gerente@mybroker.com</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCreateModal(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleCreateTicket}
                disabled={!newTicket.title.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Criar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Relatório — {reportModal.nome}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              <button onClick={() => setReportModal(null)} className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {brokerTickets(reportModal.nome).length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Nenhum ticket encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {brokerTickets(reportModal.nome).map(ticket => {
                  const cfg = statusConfig[ticket.status];
                  const pcfg = priorityConfig[ticket.priority];
                  return (
                    <div key={ticket.id} className={`border rounded-xl p-4 border-l-4 ${pcfg?.border || 'border-l-gray-300'} border-gray-700`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-white truncate">{ticket.title}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pcfg?.color}`}>{ticket.priority}</span>
                          </div>
                          {ticket.description && <p className="text-xs text-gray-400 mb-2">{ticket.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>Por: <span className="text-gray-400">{ticket.createdBy}</span></span>
                            {ticket.assignedTo && <span>Para: <span className="text-blue-600">{ticket.assignedTo}</span></span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg?.color}`}>{ticket.status}</span>
                          {ticket.status === 'Pendente' && (
                            <div className="flex gap-1.5">
                              <button onClick={() => updateStatus(ticket.id, 'Em Andamento')} className="text-[11px] px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">Iniciar</button>
                              <button onClick={() => updateStatus(ticket.id, 'Resolvido')} className="text-[11px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">Resolver</button>
                            </div>
                          )}
                          {ticket.status === 'Em Andamento' && (
                            <button onClick={() => updateStatus(ticket.id, 'Resolvido')} className="text-[11px] px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">Resolver</button>
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
