import React, { useState, useMemo } from 'react';
import {
  Code2, Circle, Play, CheckCircle, Filter,
  FileText, AlertTriangle, Search,
} from 'lucide-react';
import type { Ticket } from '../../data/brokers';
import { isOverdue, dateLabel, isCreatedToday } from '../../lib/ticketUtils';

interface DemandasTechViewProps {
  tickets: Ticket[];
  onUpdateTicket: (id: string, status: Ticket['status']) => void;
}

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

export default function DemandasTechView({ tickets, onUpdateTicket }: DemandasTechViewProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Ticket['status'] | 'Todos'>('Todos');
  const [filterPriority, setFilterPriority] = useState<Ticket['priority'] | 'Todos'>('Todos');

  const devTickets = useMemo(() =>
    tickets
      .filter(t => t.isDev)
      .filter(t => filterStatus === 'Todos' || t.status === filterStatus)
      .filter(t => filterPriority === 'Todos' || t.priority === filterPriority)
      .filter(t =>
        search === '' ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.broker.nome.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      ),
    [tickets, filterStatus, filterPriority, search]
  );

  const kpis = [
    { label: 'Total Tech', value: tickets.filter(t => t.isDev).length, color: 'text-purple-400', bg: 'bg-purple-500' },
    { label: 'Pendentes', value: tickets.filter(t => t.isDev && t.status === 'Pendente').length, color: 'text-red-400', bg: 'bg-red-500' },
    { label: 'Em Andamento', value: tickets.filter(t => t.isDev && t.status === 'Em Andamento').length, color: 'text-yellow-400', bg: 'bg-yellow-500' },
    { label: 'Resolvidos', value: tickets.filter(t => t.isDev && t.status === 'Resolvido').length, color: 'text-green-400', bg: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-700/50 flex items-center justify-center">
          <Code2 className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Demandas Tech</h2>
          <p className="text-xs text-gray-500">Tickets direcionados para o time de desenvolvimento</p>
        </div>
      </div>

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

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar ticket ou broker..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as Ticket['status'] | 'Todos')}
            className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="Todos">Todos status</option>
            <option>Pendente</option>
            <option>Em Andamento</option>
            <option>Resolvido</option>
            <option>Fechado</option>
          </select>
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value as Ticket['priority'] | 'Todos')}
            className="text-sm bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="Todos">Todas prioridades</option>
            <option>Urgente</option>
            <option>Alta</option>
            <option>Média</option>
            <option>Baixa</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      {devTickets.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-purple-900/20 border border-purple-700/30 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-400">Nenhum ticket tech encontrado</p>
          <p className="text-xs text-gray-600 mt-1">
            {tickets.filter(t => t.isDev).length === 0
              ? 'Crie um ticket e ative "Direcionar para Demandas Tech" no Dashboard'
              : 'Tente ajustar os filtros'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {devTickets.map(ticket => {
            const cfg = statusConfig[ticket.status];
            const pcfg = priorityConfig[ticket.priority];
            return (
              <div
                key={ticket.id}
                className={`bg-gray-800 rounded-xl border border-gray-700 border-l-4 ${pcfg?.border} p-4 shadow-sm hover:shadow-lg hover:shadow-black/20 transition-all`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded-full">
                        <Code2 className="w-2.5 h-2.5" />
                        {ticket.broker.nome}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pcfg?.color}`}>
                        {ticket.priority}
                      </span>
                      {(ticket.priority === 'Urgente' || ticket.priority === 'Alta') && (
                        <AlertTriangle className="w-3 h-3 text-orange-400" />
                      )}
                      {isOverdue(ticket) && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-400 border border-orange-700/50">
                          ⏰ Atrasado
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white mb-1">{ticket.title}</p>
                    {ticket.description && (
                      <p className="text-xs text-gray-400 leading-relaxed">{ticket.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                      <span>Por: <span className="text-gray-300">{ticket.createdBy}</span></span>
                      {ticket.assignedTo && (
                        <span>Para: <span className="text-blue-400">{ticket.assignedTo}</span></span>
                      )}
                      {!isCreatedToday(ticket.createdAt) && (
                        <span>
                          📅 {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                          {' '}<span className="text-orange-400/80">({dateLabel(ticket.createdAt)})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${cfg?.color}`}>
                      {ticket.status}
                    </span>
                    <div className="flex gap-1.5">
                      {ticket.status === 'Pendente' && (
                        <>
                          <button
                            onClick={() => onUpdateTicket(ticket.id, 'Em Andamento')}
                            className="text-[11px] px-2.5 py-1 bg-yellow-900/40 text-yellow-400 border border-yellow-700/50 rounded-lg hover:bg-yellow-900/60 transition-colors"
                          >
                            Iniciar
                          </button>
                          <button
                            onClick={() => onUpdateTicket(ticket.id, 'Resolvido')}
                            className="text-[11px] px-2.5 py-1 bg-green-900/40 text-green-400 border border-green-700/50 rounded-lg hover:bg-green-900/60 transition-colors"
                          >
                            Resolver
                          </button>
                        </>
                      )}
                      {ticket.status === 'Em Andamento' && (
                        <button
                          onClick={() => onUpdateTicket(ticket.id, 'Resolvido')}
                          className="text-[11px] px-2.5 py-1 bg-green-900/40 text-green-400 border border-green-700/50 rounded-lg hover:bg-green-900/60 transition-colors"
                        >
                          Resolver
                        </button>
                      )}
                      {ticket.status === 'Resolvido' && (
                        <button
                          onClick={() => onUpdateTicket(ticket.id, 'Fechado')}
                          className="text-[11px] px-2.5 py-1 bg-gray-700 text-gray-400 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          Fechar
                        </button>
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
  );
}
