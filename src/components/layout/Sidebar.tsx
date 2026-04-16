import React from 'react';
import {
  LayoutDashboard, Code2, CheckSquare,
  MessageCircle, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';

export type View = 'dashboard' | 'demandas' | 'rotina' | 'whatsapp';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: View; label: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'demandas', label: 'Demandas Tech', Icon: Code2 },
  { id: 'rotina', label: 'Rotina Diária', Icon: CheckSquare },
  { id: 'whatsapp', label: 'Alertas WhatsApp', Icon: MessageCircle },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 flex flex-col transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className={`flex items-center border-b border-gray-700 h-16 ${collapsed ? 'justify-center' : 'px-4 gap-3'}`}>
        <img src="/mybroker.logotype-01.png" alt="MyBroker" className={collapsed ? 'h-7 w-auto' : 'h-8 w-auto'} />
        {!collapsed && <span className="text-sm font-semibold text-gray-200">BrokerDesk</span>}
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ id, label, Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                active
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 p-2 space-y-1">
        <button
          title={collapsed ? 'Configurações' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-800 hover:text-gray-400 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronLeft className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
