import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { Ticket } from '../../data/brokers';
import { daysAgo } from '../../lib/ticketUtils';

interface Props {
  tickets: Ticket[];
}

export default function OverdueAlert({ tickets }: Props) {
  const [dismissedUntil, setDismissedUntil] = useState(0);
  const [expanded, setExpanded] = useState(true);

  // Re-show when a new batch of overdue tickets arrives
  useEffect(() => {
    if (tickets.length > 0) setDismissedUntil(0);
  }, [tickets.length]);

  const visible = tickets.length > 0 && Date.now() > dismissedUntil;
  if (!visible) return null;

  return (
    <div className="fixed top-20 right-4 z-50 w-80 shadow-2xl rounded-xl overflow-hidden border border-orange-700/50 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-orange-900/80 backdrop-blur-sm">
        <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0 animate-pulse" />
        <p className="text-sm font-semibold text-orange-200 flex-1">
          {tickets.length} demanda{tickets.length > 1 ? 's' : ''} atrasada{tickets.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={() => setExpanded(p => !p)}
          className="p-0.5 text-orange-400 hover:text-orange-200 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setDismissedUntil(Date.now() + 30 * 60 * 1000)}
          className="p-0.5 text-orange-400 hover:text-orange-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ticket list */}
      {expanded && (
        <div className="bg-gray-900/95 backdrop-blur-sm max-h-72 overflow-y-auto divide-y divide-gray-800">
          {tickets.map(t => {
            const days = daysAgo(t.createdAt);
            return (
              <div key={t.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-orange-300 truncate">{t.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">🏢 {t.broker.nome}</p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-900/50 text-orange-400 border border-orange-700/50 flex-shrink-0">
                    +{days}d
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Criado em {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-orange-500 font-medium">{days} dia{days > 1 ? 's' : ''} em aberto</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      {expanded && (
        <div className="px-4 py-2 bg-gray-900/95 border-t border-gray-800">
          <p className="text-[10px] text-gray-500 text-center">
            Fechar oculta por 30 min · próxima verificação em até 3h
          </p>
        </div>
      )}
    </div>
  );
}
