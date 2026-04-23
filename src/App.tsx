import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import Sidebar, { type View } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardView from './components/dashboard/DashboardView';
import DemandasTechView from './components/demandas-tech/DemandasTechView';
import RotinaView from './components/rotina/RotinaView';
import WhatsAppView from './components/whatsapp/WhatsAppView';
import JiraView from './components/jira/JiraView';
import AdminView from './components/admin/AdminView';
import LoginView from './components/auth/LoginView';
import OverdueAlert from './components/common/OverdueAlert';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { supabase } from './lib/supabase';
import { sendWebhook } from './lib/webhook';
import { loadWebhookUrl } from './lib/settings';
import { isOverdue, daysAgo } from './lib/ticketUtils';
import type { Broker, Ticket } from './data/brokers';
import type { BrokerRow, TicketRow } from './lib/supabase';

function brokerFromRow(row: BrokerRow): Broker {
  return { id: row.id, nome: row.nome, responsavel: row.responsavel, dominio: row.dominio, email: row.email, telefone: row.telefone };
}

function ticketFromRow(row: TicketRow, brokers: Broker[]): Ticket {
  const broker = brokers.find(b => b.id === row.broker_id) ?? {
    id: row.broker_id, nome: row.broker_nome, responsavel: '', dominio: '', email: '', telefone: '',
  };
  return {
    id: row.id, broker, date: row.date,
    status: row.status, priority: row.priority,
    title: row.title, description: row.description,
    assignedTo: row.assigned_to, createdBy: row.created_by,
    createdAt: row.created_at, updatedAt: row.updated_at,
    isDev: row.is_dev, department: row.department,
  };
}

const THREE_HOURS = 3 * 60 * 60 * 1000;

function AppInner() {
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [overdueTickets, setOverdueTickets] = useState<Ticket[]>([]);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    const [{ data: bData }, { data: tData }] = await Promise.all([
      supabase.from('brokers').select('*').eq('ativo', true).order('nome'),
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      loadWebhookUrl(),
    ]);
    const loadedBrokers = (bData ?? []).map(brokerFromRow);
    setBrokers(loadedBrokers);
    setTickets((tData ?? []).map((r: TicketRow) => ticketFromRow(r, loadedBrokers)));
    setDataLoading(false);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);

  // ── Overdue checker — runs on mount + every 3 hours ──
  const runOverdueCheck = useCallback(() => {
    const overdue = tickets.filter(isOverdue);
    setOverdueTickets(overdue);

    if (overdue.length > 0) {
      sendWebhook({
        event: 'overdue_check',
        total_atrasados: overdue.length,
        tickets: overdue.map(t => ({
          ticket_id: t.id,
          titulo: t.title,
          broker: t.broker.nome,
          status: t.status,
          priority: t.priority,
          data_criacao: t.createdAt,
          dias_em_aberto: daysAgo(t.createdAt),
          atrasado: true,
        })),
        timestamp: new Date().toISOString(),
      });
    }
  }, [tickets]);

  useEffect(() => {
    if (!user || dataLoading) return;
    runOverdueCheck();
    const interval = setInterval(runOverdueCheck, THREE_HOURS);
    return () => clearInterval(interval);
  }, [runOverdueCheck, user, dataLoading]);

  const navigate = (view: View) => {
    setActiveView(view);
    setSearchTerm('');
    setMobileMenuOpen(false);
  };

  const onAddTicket = async (ticket: Ticket) => {
    const { data, error } = await supabase.from('tickets').insert({
      broker_id: ticket.broker.id,
      broker_nome: ticket.broker.nome,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assignedTo,
      created_by: ticket.createdBy,
      is_dev: ticket.isDev,
      department: ticket.department ?? 'Outros',
      date: ticket.date,
    }).select().single();
    if (!error && data) {
      const newTicket = ticketFromRow(data as TicketRow, brokers);
      setTickets(prev => [newTicket, ...prev]);
      sendWebhook({
        event: 'ticket_created',
        ticket: {
          id: newTicket.id,
          title: newTicket.title,
          description: newTicket.description,
          broker: newTicket.broker.nome,
          priority: newTicket.priority,
          department: newTicket.department,
          created_by: newTicket.createdBy,
          is_dev: newTicket.isDev,
        },
        timestamp: new Date().toISOString(),
      });
    }
  };

  const onUpdateTicket = async (id: string, status: Ticket['status']) => {
    await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));

    if (status === 'Resolvido') {
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        sendWebhook({
          event: 'ticket_resolved',
          ticket: {
            id,
            title: ticket.title,
            broker: ticket.broker.nome,
            resolved_by: profile?.email ?? 'Operador',
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginView />;

  const renderView = () => {
    if (dataLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <span className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      );
    }
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            searchTerm={searchTerm}
            currentUser={profile?.email ?? user.email ?? ''}
            brokers={brokers}
            tickets={tickets}
            onAddTicket={onAddTicket}
            onUpdateTicket={onUpdateTicket}
          />
        );
      case 'demandas':
        return <DemandasTechView tickets={tickets} onUpdateTicket={onUpdateTicket} />;
      case 'rotina':
        return <RotinaView currentUser={profile?.email ?? user.email ?? ''} isAdmin={isAdmin} />;
      case 'jira':
        return <JiraView />;
      case 'whatsapp':
        return <WhatsAppView />;
      case 'admin':
        return isAdmin ? <AdminView /> : <p className="text-gray-500 text-sm">Acesso restrito.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <OverdueAlert tickets={overdueTickets} />

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        activeView={activeView}
        onNavigate={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
        isAdmin={isAdmin}
        onSignOut={signOut}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className={`${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-200 flex flex-col min-h-screen`}>
        <Header
          activeView={activeView}
          profile={profile}
          onSignOut={signOut}
          onMobileMenuToggle={() => setMobileMenuOpen(p => !p)}
        />

        {activeView === 'dashboard' && (
          <div className="px-4 md:px-6 pt-4 pb-0">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar broker..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">{renderView()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
