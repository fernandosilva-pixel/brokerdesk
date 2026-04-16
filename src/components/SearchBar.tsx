import React from 'react';
import { Search, FileText, Flag } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalBrokers: number;
  filteredCount: number;
  pendingTicketsCount: number;
  onShowPendingTickets: () => void;
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  totalBrokers,
  pendingTicketsCount,
  onShowPendingTickets,
}: SearchBarProps) {
  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar broker..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-gray-300">Brokers:</span>
            <span className="text-sm font-bold text-blue-400">{totalBrokers}</span>
          </div>
          <button
            onClick={onShowPendingTickets}
            className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700 rounded-lg transition-colors duration-200"
          >
            <Flag className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Tickets Pendentes:</span>
            <span className="text-sm font-bold text-yellow-400">{pendingTicketsCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
