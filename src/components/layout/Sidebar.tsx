import React from 'react';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type View = 'dashboard' | 'demandas' | 'rotina' | 'whatsapp';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { id: View; label: string; Icon: React.ElementType; badge?: number }[] = [
  { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'demandas', label: 'Demandas', Icon: FileText },
  { id: 'rotina', label: 'Rotina Diária', Icon: CheckSquare },
  { id: 'whatsapp', label: 'Alertas WhatsApp', Icon: MessageCircle },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-200 z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-100 h-16 ${collapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}>
        <img src="/mybroker.logotype-01.png" alt="MyBroker" className={collapsed ? 'h-7 w-auto' : 'h-8 w-auto'} />
        {!collapsed && <span className="text-sm font-semibold text-gray-700">BrokerDesk</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map(({ id, label, Icon, badge }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {!collapsed && badge !== undefined && badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{badge}</span>
              )}
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-r" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-2 space-y-1">
        <button
          title={collapsed ? 'Configurações' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </button>

        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronLeft className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
