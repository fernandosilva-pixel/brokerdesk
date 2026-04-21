import React from 'react';
import {
  LayoutDashboard, Code2, CheckSquare,
  MessageCircle, ChevronLeft, ChevronRight,
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
  { id: 'whatsapp',  label: 'Alertas WhatsApp', Icon: MessageCircle, adminOnly: true },
  { id: 'admin',     label: 'Admin',            Icon: ShieldCheck,   adminOnly: true },
];

export default function Sidebar({ activeView, onNavigate, collapsed, onToggle, isAdmin, onSignOut, mobileOpen, onMobileClose }: SidebarProps) {
  const visible = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      style={{ background: 'var(--bg1)', borderRight: '1px solid var(--border)' }}
      className={`
        fixed top-0 left-0 h-full flex flex-col z-30
        transition-all duration-200
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div
        style={{ borderBottom: '1px solid var(--border)' }}
        className="flex items-center justify-center h-14 px-3 relative flex-shrink-0"
      >
        {collapsed ? (
          <img
            src="https://uploadsww.s3.us-east-1.amazonaws.com/files/01JC6QYQQTSDG3PWRR7W7GHZQB/01KF7N0KEDSPRAC3DF7V0EKPM5/TICKET/TICKET_ATTACHMENT/01KPEJXAC4CZPBH5QR3PCJV6N7.png"
            alt="BrokerDesk"
            className="h-6 w-auto"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <img
            src="https://uploadsww.s3.us-east-1.amazonaws.com/files/01JC6QYQQTSDG3PWRR7W7GHZQB/01KF7N0KEDSPRAC3DF7V0EKPM5/TICKET/TICKET_ATTACHMENT/01KPEFS4V8W11VVTJ3KBB4RSZ5.png"
            alt="BrokerDesk"
            className="h-7 w-auto"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        {!collapsed && (
          <button
            onClick={onMobileClose}
            style={{ color: 'var(--text3)' }}
            className="md:hidden absolute right-3 p-1 rounded-md hover:opacity-80 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {visible.map(({ id, label, Icon, adminOnly }) => {
          const active = activeView === id;
          const isAdminItem = adminOnly;
          const activeColor = isAdminItem ? 'var(--purple)' : 'var(--blue)';
          const activeBg = isAdminItem ? 'var(--purple-bg)' : 'var(--blue-bg)';
          const activeBorder = isAdminItem ? 'var(--purple)' : 'var(--blue)';

          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              title={collapsed ? label : undefined}
              style={active ? {
                background: activeBg,
                color: activeColor,
                borderLeft: `2px solid ${activeBorder}`,
                paddingLeft: collapsed ? undefined : '10px',
              } : {
                color: 'var(--text2)',
                borderLeft: '2px solid transparent',
                paddingLeft: collapsed ? undefined : '10px',
              }}
              className={`
                w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium
                transition-all duration-150 cursor-pointer
                ${!active ? 'hover:bg-white/[0.04] hover:text-[var(--text1)]' : ''}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
              {!collapsed && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)' }} className="p-2 flex-shrink-0 space-y-0.5">
        <button
          onClick={onSignOut}
          style={{ color: 'var(--text3)' }}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
        >
          <LogOut className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
          {!collapsed && <span>Sair</span>}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={onToggle}
          style={{ color: 'var(--text3)' }}
          className="hidden md:flex w-full items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-white/[0.04] hover:text-[var(--text1)] cursor-pointer"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
            : <><ChevronLeft className="w-4 h-4 flex-shrink-0" /><span>Recolher</span></>
          }
        </button>
      </div>
    </aside>
  );
}
