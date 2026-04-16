import React, { useState, useEffect } from 'react';
import { X, Flag, AlertTriangle, Circle, Play, Calendar } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface PendingTicket {
  id: string;
  broker_name: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Pendente' | 'Em Andamento';
  date: string;
  created_at: string;
  created_by: string;
  assigned_to: string;
}

interface PendingTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PendingTicketsModal({ isOpen, onClose }: PendingTicketsModalProps) {
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) loadPendingTickets();
  }, [isOpen]);

  const loadPendingTickets = async () => {
    setIsLoading(true);
    if (!isSupabaseConfigured() || !supabase) {
      const mockTickets: PendingTicket[] = [
        {
          id: '1',
          broker_name: 'Hiove',
          title: 'Problema no sistema de pagamentos',
          description: 'Cliente relatou erro ao processar pagamento',
          priority: 'Alta',
          status: 'Pendente',
          date: '2024-01-10',
          created_at: new Date('2024-01-10T10:30:00').toISOString(),
          created_by: 'Maria Santos',
          assigned_to: 'João Silva',
        },
        {
          id: '2',
          broker_name: 'T3X Global',
          title: 'Atualização de sistema urgente',
          description: 'Sistema precisa ser atualizado para nova versão',
          priority: 'Urgente',
          status: 'Em Andamento',
          date: '2024-01-08',
          created_at: new Date('2024-01-08T14:15:00').toISOString(),
          created_by: 'Carlos Lima',
          assigned_to: 'Ana Costa',
        },
        {
          id: '3',
          broker_name: 'Binix Pro',
          title: 'Configuração de API',
          description: 'Necessário configurar nova API de integração',
          priority: 'Média',
          status: 'Pendente',
          date: '2024-01-12',
          created_at: new Date('2024-01-12T09:00:00').toISOString(),
          created_by: 'Pedro Silva',
          assigned_to: '',
        },
      ];
      setTickets(mockTickets);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  const getPriorityColor = (priority: PendingTicket['priority']) => {
    switch (priority) {
      case 'Baixa': return 'text-green-400';
      case 'Média': return 'text-yellow-400';
      case 'Alta': return 'text-orange-400';
      case 'Urgente': return 'text-red-400';
    }
  };

  const getPriorityBg = (priority: PendingTicket['priority']) => {
    switch (priority) {
      case 'Baixa': return 'bg-green-900/30 border-green-700';
      case 'Média': return 'bg-yellow-900/30 border-yellow-700';
      case 'Alta': return 'bg-orange-900/30 border-orange-700';
      case 'Urgente': return 'bg-red-900/30 border-red-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const urgentTickets = tickets.filter(t => t.priority === 'Urgente');
  const highTickets = tickets.filter(t => t.priority === 'Alta');
  const mediumTickets = tickets.filter(t => t.priority === 'Média');
  const lowTickets = tickets.filter(t => t.priority === 'Baixa');
  const orderedTickets = [...urgentTickets, ...highTickets, ...mediumTickets, ...lowTickets];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Flag className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Tickets Pendentes</h2>
              <p className="text-sm text-gray-400">Todos os tickets que ainda não foram resolvidos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Circle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{tickets.filter(t => t.status === 'Pendente').length}</p>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">Em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{tickets.filter(t => t.status === 'Em Andamento').length}</p>
          </div>
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">Urgentes</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{urgentTickets.length}</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{tickets.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Lista de Tickets Pendentes</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto mb-3"></div>
              <p className="text-gray-400">Carregando tickets pendentes...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum ticket pendente encontrado</p>
              <p className="text-sm text-gray-500 mt-1">Todos os tickets foram resolvidos!</p>
            </div>
          ) : (
            orderedTickets.map((ticket) => (
              <div key={ticket.id} className={`rounded-lg p-4 border ${getPriorityBg(ticket.priority)}`}>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{ticket.title}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(ticket.priority)} bg-gray-700`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-700">
                    {ticket.broker_name}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(ticket.date)}</span>
                  </div>
                </div>
                {ticket.description && <p className="text-sm text-gray-300 mb-2">{ticket.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Criado por: <span className="text-gray-300">{ticket.created_by}</span></span>
                  {ticket.assigned_to && <span>Atribuído a: <span className="text-blue-300">{ticket.assigned_to}</span></span>}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors duration-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
