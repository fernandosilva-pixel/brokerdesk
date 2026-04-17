import React, { useState, useEffect } from 'react';
import { X, FileText, User, Circle, Play, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AssignedTicket {
  id: string;
  broker_name: string;
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  status: 'Pendente' | 'Em Andamento' | 'Resolvido' | 'Fechado';
  date: string;
  created_at: string;
  created_by: string;
}

interface AssignedTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

export default function AssignedTicketsModal({ isOpen, onClose, currentUser }: AssignedTicketsModalProps) {
  const [tickets, setTickets] = useState<AssignedTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadAssignedTickets();
    }
  }, [isOpen, currentUser]);

  const loadAssignedTickets = async () => {
    setIsLoading(true);
    if (!supabase) {
      const mockTickets: AssignedTicket[] = [
        {
          id: '1',
          broker_name: 'Hiove',
          title: 'Problema no sistema de pagamentos',
          description: 'Cliente relatou erro ao processar pagamento',
          priority: 'Alta',
          status: 'Pendente',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          created_by: 'Maria Santos',
        },
        {
          id: '2',
          broker_name: 'T3X Global',
          title: 'Atualização de sistema',
          description: 'Necessário atualizar versão do sistema',
          priority: 'Média',
          status: 'Em Andamento',
          date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          created_by: 'João Silva',
        },
      ];
      setTickets(mockTickets);
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
  };

  const getStatusIcon = (status: AssignedTicket['status']) => {
    switch (status) {
      case 'Pendente': return <Circle className="w-4 h-4 text-red-400" />;
      case 'Em Andamento': return <Play className="w-4 h-4 text-yellow-400" />;
      case 'Resolvido': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'Fechado': return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: AssignedTicket['priority']) => {
    switch (priority) {
      case 'Baixa': return 'text-green-400';
      case 'Média': return 'text-yellow-400';
      case 'Alta': return 'text-orange-400';
      case 'Urgente': return 'text-red-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Tickets Atribuídos a Mim</h2>
              <p className="text-sm text-gray-400">{currentUser}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{tickets.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Meus Tickets</h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-gray-400">Carregando tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">Nenhum ticket atribuído a você</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-white">{ticket.title}</h4>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(ticket.priority)} bg-gray-600`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs font-medium px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-700">
                    {ticket.broker_name}
                  </span>
                </div>
                {ticket.description && <p className="text-sm text-gray-300 mb-2">{ticket.description}</p>}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-600">
                  {getStatusIcon(ticket.status)}
                  <span className="text-sm font-medium text-gray-300">Status: {ticket.status}</span>
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
