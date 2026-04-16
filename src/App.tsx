import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar, { type View } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardView from './components/dashboard/DashboardView';
import DemandasTechView from './components/demandas-tech/DemandasTechView';
import RotinaView from './components/rotina/RotinaView';
import WhatsAppView from './components/whatsapp/WhatsAppView';
import { brokers } from './data/brokers';
import type { Ticket } from './data/brokers';

const MOCK_TICKETS: Ticket[] = [
  {
    id: '1', broker: brokers[0], date: new Date().toISOString().split('T')[0],
    status: 'Pendente', priority: 'Alta', title: 'Plataforma fora do ar',
    description: 'Usuários não conseguem acessar o painel de operações.',
    assignedTo: 'suporte@mybroker.com', createdBy: 'usuario@mybroker.com',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDev: false,
  },
  {
    id: '2', broker: brokers[1], date: new Date().toISOString().split('T')[0],
    status: 'Em Andamento', priority: 'Urgente', title: 'Falha no processamento de saques',
    description: 'Saques acima de R$10.000 estão sendo bloqueados automaticamente.',
    assignedTo: 'gerente@mybroker.com', createdBy: 'usuario@mybroker.com',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDev: true,
  },
  {
    id: '3', broker: brokers[2], date: new Date().toISOString().split('T')[0],
    status: 'Resolvido', priority: 'Média', title: 'Erro no relatório mensal',
    description: 'PDF gerado com dados incorretos do mês anterior.',
    assignedTo: 'suporte@mybroker.com', createdBy: 'usuario@mybroker.com',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDev: true,
  },
  {
    id: '4', broker: brokers[3], date: new Date().toISOString().split('T')[0],
    status: 'Pendente', priority: 'Baixa', title: 'Atualização de dados cadastrais',
    description: 'Solicitar atualização de CNPJ e endereço.',
    assignedTo: '', createdBy: 'usuario@mybroker.com',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDev: false,
  },
];

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const currentUser = 'usuario@mybroker.com';

  const pendingCount = tickets.filter(t => t.status === 'Pendente').length;
  const sidebarWidth = sidebarCollapsed ? 'ml-16' : 'ml-60';
  const showSearch = activeView === 'dashboard' || activeView === 'demandas';

  const onAddTicket = (ticket: Ticket) => setTickets(prev => [ticket, ...prev]);
  const onUpdateTicket = (id: string, status: Ticket['status']) =>
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t));

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardView
            searchTerm={searchTerm}
            currentUser={currentUser}
            tickets={tickets}
            onAddTicket={onAddTicket}
            onUpdateTicket={onUpdateTicket}
          />
        );
      case 'demandas':
        return <DemandasTechView tickets={tickets} onUpdateTicket={onUpdateTicket} />;
      case 'rotina':
        return <RotinaView />;
      case 'whatsapp':
        return <WhatsAppView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar
        activeView={activeView}
        onNavigate={(view) => { setActiveView(view); setSearchTerm(''); }}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      <div className={`${sidebarWidth} transition-all duration-200 flex flex-col min-h-screen`}>
        <Header
          activeView={activeView}
          currentUser={currentUser}
          pendingCount={pendingCount}
        />

        {showSearch && activeView === 'dashboard' && (
          <div className="px-6 pt-4 pb-0">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar broker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        )}

        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
