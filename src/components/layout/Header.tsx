import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import type { View } from './Sidebar';
import { supabase } from '../../lib/supabase';
import type { NotificationRow, Profile } from '../../lib/supabase';

const titles: Record<View, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard',        subtitle: 'Visão geral das demandas' },
  demandas:  { title: 'Demandas Tech',    subtitle: 'Tickets direcionados ao time de desenvolvimento' },
  rotina:    { title: 'Rotina Diária',    subtitle: 'Checklist de tarefas do dia' },
  whatsapp:  { title: 'Alertas WhatsApp', subtitle: 'Notificações e configuração de alertas' },
  admin:     { title: 'Admin',            subtitle: 'Gerenciamento de brokers e notificações' },
};

const typeIcon = {
  info:    { Icon: Info,          color: 'text-blue-400' },
  success: { Icon: CheckCircle,   color: 'text-green-400' },
  warning: { Icon: AlertTriangle, color: 'text-yellow-400' },
  error:   { Icon: XCircle,       color: 'text-red-400' },
} as const;

interface HeaderProps {
  activeView: View;
  profile: Profile | null;
  onSignOut: () => void;
}

export default function Header({ activeView, profile, onSignOut }: HeaderProps) {
  const { title, subtitle } = titles[activeView];
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unread, setUnread] = useState(0);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data as NotificationRow[]);
      const lastSeen = profile?.last_seen_notifications_at ?? '2000-01-01';
      setUnread(data.filter(n => n.created_at > lastSeen).length);
    }
  };

  const handleOpenBell = async () => {
    setShowDropdown(p => !p);
    if (!showDropdown && profile) {
      setUnread(0);
      await supabase.from('profiles').update({ last_seen_notifications_at: new Date().toISOString() }).eq('id', profile.id);
    }
  };

  const displayName = profile?.name ?? profile?.email?.split('@')[0] ?? '?';
  const displayEmail = profile?.email ?? '';

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 gap-4 sticky top-0 z-20">
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
        <p className="text-xs text-gray-400 truncate">{subtitle}</p>
      </div>

      {/* Bell */}
      <div className="relative" ref={dropRef}>
        <button
          onClick={handleOpenBell}
          className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <p className="text-sm font-semibold text-white">Notificações</p>
              <button onClick={() => setShowDropdown(false)} className="text-gray-500 hover:text-gray-300">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-8">Nenhuma notificação</p>
              ) : (
                notifications.map(n => {
                  const { Icon, color } = typeIcon[n.type];
                  const isNew = n.created_at > (profile?.last_seen_notifications_at ?? '2000-01-01');
                  return (
                    <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-gray-700/50 ${isNew ? 'bg-blue-900/10' : ''}`}>
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white leading-snug">{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{n.message}</p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {new Date(n.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block">
          <p className="text-xs font-medium text-gray-300 leading-none">{displayName}</p>
          <p className="text-xs text-gray-500 leading-none mt-0.5">{displayEmail}</p>
        </div>
        <button onClick={onSignOut} className="ml-1">
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
