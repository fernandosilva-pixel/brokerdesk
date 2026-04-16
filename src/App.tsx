import React, { useState } from 'react';
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
    <div className="min-h-screen bg-gray-50">
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
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          pendingCount={pendingCount}
        />

        <main className="flex-1 p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
