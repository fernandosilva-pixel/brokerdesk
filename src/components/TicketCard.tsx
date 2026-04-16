import React, { useState, useEffect } from 'react';
import {
  ExternalLink, X, FileText, Clock, AlertTriangle,
  CheckCircle, Circle, Play, Plus, BarChart3
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Broker, Ticket } from '../data/brokers';

interface TicketCardProps {
  broker: Broker;
  currentDate: string;
  ticketCount: number;
  currentUser: string;
  hasHighPriority: boolean;
  hasPendingTickets: boolean;
  forceOpenModal?: boolean;
  onModalClose?: () => void;
}

export default function TicketCard({
  broker, currentDate, ticketCount, currentUser,
  hasHighPriority, hasPendingTickets, forceOpenModal, onModalClose,
}: TicketCardProps) {
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [users] = useState([
    { id: '1', email: 'admin@mybroker.com' },
    { id: '2', email: 'suporte@mybroker.com' },
    { id: '3', email: 'gerente@mybroker.com' },
  ]);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: 'Média' as Ticket['priority'],
    createdBy: currentUser,
    assignedTo: '',
  });

  useEffect(() => {
    setNewTicket(prev => ({ ...prev, createdBy: currentUser }));
  }, [currentUser]);

  useEffect(() => {
    if (forceOpenModal) setIsReportModalOpen(true);
  }, [forceOpenModal]);

  useEffect(() => {
    loadTickets();
  }, [broker.nome, currentDate]);

  const loadTickets = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      const mockTickets: Ticket[] = [
        {
          id: '1',
          broker,
          date: currentDate,
          status: 'Pendente',
          priority: 'Alta',
          title: 'Problema no sistema de pagamentos',
          description: 'Cliente relatou erro ao processar pagamento',
          assignedTo: 'João Silva',
          createdBy: 'Maria Santos',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setTickets(mockTickets);
      return;
    }
  };

  const createTicket = async () => {
    if (!newTicket.title.trim() || !newTicket.createdBy.trim()) return;
    setIsLoading(true);

    if (!isSupabaseConfigured() || !supabase) {
      const ticket: Ticket = {
        id: Date.now().toString(),
        broker,
        date: currentDate,
        status: 'Pendente',
        priority: newTicket.priority,
        title: newTicket.title,
        description: newTicket.description,
        assignedTo: newTicket.assignedTo,
        createdBy: newTicket.createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets(prev => [ticket, ...prev]);
    }

    setNewTicket({ title: '', description: '', priority: 'Média', createdBy: currentUser, assignedTo: '' });
    setIsCreateTicketModalOpen(false);
    setIsLoading(false);
  };

  const updateTicketStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t));
  };

  const isDomainAvailable = (domain: string) => !domain.includes('(pendente)') && !domain.includes('(não subiu ainda)');

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'Pendente': return <Circle className="w-4 h-4 text-red-400" />;
      case 'Em Andamento': return <Play className="w-4 h-4 text-yellow-400" />;
      case 'Resolvido': return <CheckCircle className="w-4 h-4 text-green-400" />;
      default: return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'Baixa': return 'text-green-400';
      case 'Média': return 'text-yellow-400';
      case 'Alta': return 'text-orange-400';
      case 'Urgente': return 'text-red-400';
    }
  };

  return (
    <>
      <div
        className={`bg-gray-800 rounded-xl shadow-sm p-6 hover:shadow-lg hover:shadow-gray-900/20 transition-all duration-200 ${
          hasHighPriority
            ? 'border-2 border-red-500 shadow-red-500/20'
            : hasPendingTickets
            ? 'border-2 border-yellow-500 shadow-yellow-500/20'
            : 'border border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{broker.nome}</h3>
          <div className="flex items-center gap-2">
            {isDomainAvailable(broker.dominio) && (
              <a href={broker.dominio} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setIsCreateTicketModalOpen(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-400 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded-md transition-colors"
            >
              <Plus className="w-3 h-3" />
              Ticket
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {tickets.length > 0 ? (
            <>
              <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-900/30 border border-blue-700 rounded">
                <FileText className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
              </div>
              {tickets.filter(t => t.status === 'Pendente' || t.status === 'Aberto').length > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-900/30 border border-red-700 rounded">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">{tickets.filter(t => t.status === 'Pendente' || t.status === 'Aberto').length} aberto{tickets.filter(t => t.status === 'Pendente' || t.status === 'Aberto').length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-700 border border-gray-600 rounded">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">Nenhum ticket</span>
            </div>
          )}
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-gray-300">Status dos Tickets</span>
            </div>
            {tickets.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Pendentes: {tickets.filter(t => t.status === 'Pendente').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Andamento: {tickets.filter(t => t.status === 'Em Andamento').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Resolvidos: {tickets.filter(t => t.status === 'Resolvido').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                  <span className="text-gray-300">Fechados: {tickets.filter(t => t.status === 'Fechado').length}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Nenhum ticket hoje</p>
            )}
          </div>

          {tickets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-gray-300">Último Ticket</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(tickets[0].status)}
                <p className="text-sm text-gray-300 truncate flex-1">{tickets[0].title}</p>
                <span className={`text-xs font-medium ${getPriorityColor(tickets[0].priority)}`}>{tickets[0].priority}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-400 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 rounded-md transition-colors"
          >
            <BarChart3 className="w-3 h-3" />
            Relatório
          </button>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Novo Ticket</h2>
              <button onClick={() => setIsCreateTicketModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 text-sm bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Digite o título do ticket"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-3 text-sm bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  rows={3}
                  placeholder="Descreva o problema ou solicitação"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Prioridade</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as Ticket['priority'] }))}
                  className="w-full p-3 text-sm bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Atribuir a</label>
                <select
                  value={newTicket.assignedTo}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, assignedTo: e.target.value }))}
                  className="w-full p-3 text-sm bg-gray-700 border border-gray-600 text-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="">Selecionar usuário</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.email}>{user.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Criado por</label>
                <input
                  type="text"
                  value={newTicket.createdBy}
                  readOnly
                  className="w-full p-3 text-sm bg-gray-600 border border-gray-500 text-gray-300 rounded-md cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsCreateTicketModalOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTicket}
                disabled={isLoading || !newTicket.title.trim() || !newTicket.createdBy.trim()}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isLoading ? 'Criando...' : 'Criar Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">Relatório de Tickets - {broker.nome}</h2>
                  <p className="text-sm text-gray-400">
                    {new Date(currentDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsReportModalOpen(false); onModalClose?.(); }} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Pendentes', count: tickets.filter(t => t.status === 'Pendente').length, color: 'red', Icon: Circle },
                { label: 'Em Andamento', count: tickets.filter(t => t.status === 'Em Andamento').length, color: 'yellow', Icon: Play },
                { label: 'Resolvidos', count: tickets.filter(t => t.status === 'Resolvido').length, color: 'green', Icon: CheckCircle },
                { label: 'Total', count: tickets.length, color: 'blue', Icon: FileText },
              ].map(({ label, count, color, Icon }) => (
                <div key={label} className={`bg-${color}-900/30 border border-${color}-700 rounded-lg p-3`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 text-${color}-400`} />
                    <span className={`text-sm font-medium text-${color}-400`}>{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white mt-1">{count}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Todos os Tickets</h3>
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhum ticket encontrado</p>
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div key={ticket.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-white">{ticket.title}</h4>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(ticket.priority)} bg-gray-600`}>
                        {ticket.priority}
                      </span>
                    </div>
                    {ticket.description && <p className="text-sm text-gray-300 mb-2">{ticket.description}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm font-medium text-gray-300">Status: {ticket.status}</span>
                      </div>
                      {ticket.status === 'Pendente' && (
                        <div className="flex gap-2">
                          <button onClick={() => updateTicketStatus(ticket.id, 'Em Andamento')} className="px-3 py-1 text-xs font-medium text-yellow-400 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700 rounded transition-colors">Iniciar</button>
                          <button onClick={() => updateTicketStatus(ticket.id, 'Resolvido')} className="px-3 py-1 text-xs font-medium text-green-400 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded transition-colors">Resolver</button>
                        </div>
                      )}
                      {ticket.status === 'Em Andamento' && (
                        <button onClick={() => updateTicketStatus(ticket.id, 'Resolvido')} className="px-3 py-1 text-xs font-medium text-green-400 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded transition-colors">Resolver</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
              <button onClick={() => { setIsReportModalOpen(false); onModalClose?.(); }} className="px-6 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
