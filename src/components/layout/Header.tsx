import React from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import type { View } from './Sidebar';

const titles: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral das demandas' },
  demandas: { title: 'Demandas', subtitle: 'Gestão de tickets por broker' },
  rotina: { title: 'Rotina Diária', subtitle: 'Checklist de tarefas do dia' },
  whatsapp: { title: 'Alertas WhatsApp', subtitle: 'Notificações e configuração de alertas' },
};

interface HeaderProps {
  activeView: View;
  currentUser: string;
  pendingCount: number;
}

export default function Header({ activeView, currentUser, pendingCount }: HeaderProps) {
  const { title, subtitle } = titles[activeView];

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>

      <button className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
        <Bell className="w-4 h-4" />
        {pendingCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
          {currentUser.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-medium text-gray-300 leading-none">{currentUser.split('@')[0]}</p>
          <p className="text-xs text-gray-500 leading-none mt-0.5">{currentUser}</p>
        </div>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </div>
    </header>
  );
}
