import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface HighPriorityTicket {
  brokerName: string;
  ticketTitle: string;
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  assignedTo: string;
}

interface HighPriorityAlertProps {
  tickets: HighPriorityTicket[];
  onClose: () => void;
  onTicketClick?: (brokerName: string) => void;
}

export default function HighPriorityAlert({ tickets, onClose, onTicketClick }: HighPriorityAlertProps) {
  if (tickets.length === 0) return null;

  const urgentTickets = tickets.filter(t => t.priority === 'Urgente');
  const highTickets = tickets.filter(t => t.priority === 'Alta');
  const mediumTickets = tickets.filter(t => t.priority === 'Média');
  const lowTickets = tickets.filter(t => t.priority === 'Baixa');
  const orderedTickets = [...urgentTickets, ...highTickets, ...mediumTickets, ...lowTickets];

  const getPriorityColor = (priority: HighPriorityTicket['priority']) => {
    switch (priority) {
      case 'Baixa': return 'text-green-400';
      case 'Média': return 'text-yellow-400';
      case 'Alta': return 'text-orange-400';
      case 'Urgente': return 'text-red-400';
    }
  };

  const getPriorityBg = (priority: HighPriorityTicket['priority']) => {
    switch (priority) {
      case 'Baixa': return 'bg-green-900/30 border-green-700';
      case 'Média': return 'bg-yellow-900/30 border-yellow-700';
      case 'Alta': return 'bg-orange-900/30 border-orange-700';
      case 'Urgente': return 'bg-red-900/30 border-red-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <p className="text-white font-medium text-sm">
              Existem demandas em aberto! Solicitamos sua revisão!
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {urgentTickets.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 border border-red-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">{urgentTickets.length} Urgente{urgentTickets.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {highTickets.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-900/30 border border-orange-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-orange-400">{highTickets.length} Alta{highTickets.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {mediumTickets.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-900/30 border border-yellow-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-400">{mediumTickets.length} Média{mediumTickets.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          {lowTickets.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">{lowTickets.length} Baixa{lowTickets.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {orderedTickets.map((ticket, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getPriorityBg(ticket.priority)} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => onTicketClick?.(ticket.brokerName)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{ticket.brokerName}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getPriorityColor(ticket.priority)} bg-gray-700`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-2">{ticket.ticketTitle}</p>
                  <p className="text-xs text-gray-400">Atribuído a: {ticket.assignedTo}</p>
                </div>
                <p className="text-white font-medium text-xs animate-pulse">Demanda em aberto. Sua atenção é necessária.</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            Entendi, vamos resolver!
          </button>
        </div>
      </div>
    </div>
  );
}
