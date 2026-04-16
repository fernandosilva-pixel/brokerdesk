import React, { useState } from 'react';
import { Search } from 'lucide-react';
import Sidebar, { type View } from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardView from './components/dashboard/DashboardView';
import RotinaView from './components/rotina/RotinaView';
import WhatsAppView from './components/whatsapp/WhatsAppView';

function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = 'usuario@mybroker.com';
  const pendingCount = 5;

  const sidebarWidth = sidebarCollapsed ? 'ml-16' : 'ml-60';
  const showSearch = activeView === 'dashboard' || activeView === 'demandas';

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
      case 'demandas':
        return <DashboardView searchTerm={searchTerm} currentUser={currentUser} />;
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

        {/* Search bar — só aparece nas views de demandas, abaixo do header */}
        {showSearch && (
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
