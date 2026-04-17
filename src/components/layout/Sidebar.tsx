import React from 'react';
import {
  LayoutDashboard, Code2, CheckSquare,
  MessageCircle, Settings, ChevronLeft, ChevronRight,
  ShieldCheck, LogOut, X,
} from 'lucide-react';

export type View = 'dashboard' | 'demandas' | 'rotina' | 'whatsapp' | 'admin';

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  collapsed: boolean;
  onToggle: () => void;
  isAdmin: boolean;
  onSignOut: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems: { id: View; label: string; Icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: 'dashboard', label: 'Dashboard',       Icon: LayoutDashboard },
  { id: 'demandas',  label: 'Demandas Tech',    Icon: Code2 },
  { id: 'rotina',    label: 'Rotina Diária',    Icon: CheckSquare },
  { id: 'whatsapp',  label: 'Alertas WhatsApp', Icon: MessageCircle },
  { id: 'admin',     label: 'Admin',            Icon: ShieldCheck, adminOnly: true },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggle, isAdmin, onSignOut, mobileOpen, onMobileClose }: SidebarProps) {
  const visible = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={`
        fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-700 flex flex-col z-30
        transition-all duration-200
        ${collapsed ? 'w-16' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-gray-700 h-16 ${collapsed ? 'justify-center' : 'px-4 gap-3'}`}>
        <img
          src="https://uploadsww.s3.us-east-1.amazonaws.com/files/01JC6QYQQTSDG3PWRR7W7GHZQB/01KF7N0KEDSPRAC3DF7V0EKPM5/TICKET/TICKET_ATTACHMENT/01KPEFS4V8W11VVTJ3KBB4RSZ5.png"
          alt="BrokerDesk"
          className={collapsed ? 'h-7 w-auto' : 'h-8 w-auto'}
        />
        {!collapsed && <span className="text-sm font-semibold text-gray-200 flex-1">BrokerDesk</span>}
        {/* Close button — mobile only */}
        {!collapsed && (
          <button onClick={onMobileClose} className="md:hidden p-1 text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {visible.map(({ id, label, Icon, adminOnly }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                active
                  ? adminOnly ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? (adminOnly ? 'text-purple-400' : 'text-blue-400') : 'text-gray-500 group-hover:text-gray-300'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r ${adminOnly ? 'bg-purple-500' : 'bg-blue-500'}`} />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700 p-2 space-y-1">
        <button
          title={collapsed ? 'Configurações' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Configurações</span>}
        </button>
        <button
          onClick={onSignOut}
          title={collapsed ? 'Sair' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-900/20 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-800 hover:text-gray-400 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronLeft className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </aside>
  );
}
