import React, { useState, useMemo } from 'react';
import { FileText, User, LogOut, UserCheck } from 'lucide-react';
import { brokers } from './data/brokers';
import TicketCard from './components/TicketCard';
import SearchBar from './components/SearchBar';
import DailyTabs from './components/DailyTabs';
import HighPriorityAlert from './components/HighPriorityAlert';
import AssignedTicketsModal from './components/AssignedTicketsModal';
import PendingTicketsModal from './components/PendingTicketsModal';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showHighPriorityAlert, setShowHighPriorityAlert] = useState(true);
  const [selectedBrokerForModal, setSelectedBrokerForModal] = useState<string | null>(null);
  const [showAssignedTicketsModal, setShowAssignedTicketsModal] = useState(false);
  const [showPendingTicketsModal, setShowPendingTicketsModal] = useState(false);
  const [currentUser] = useState({ email: 'usuario@mybroker.com' });
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const highPriorityBrokers = ['Hiove', 'T3X Global'];
  const pendingTicketsBrokers = ['Hiove', 'T3X Global', 'Binix Pro'];
  const pendingTicketsCount = 5;
  const assignedTicketsCount = 2;

  const highPriorityTickets = [
    { brokerName: 'Hiove', ticketTitle: 'Problema no sistema de pagamentos', priority: 'Alta' as const, assignedTo: 'João Silva' },
    { brokerName: 'T3X Global', ticketTitle: 'Atualização de sistema', priority: 'Média' as const, assignedTo: 'Maria Santos' },
  ];

  const filteredAndSortedBrokers = useMemo(() => {
    let filtered = brokers.filter(broker =>
      broker.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered = filtered.sort((a, b) => {
      const aHasHighPriority = highPriorityBrokers.includes(a.nome);
      const bHasHighPriority = highPriorityBrokers.includes(b.nome);
      if (aHasHighPriority && !bHasHighPriority) return -1;
      if (!aHasHighPriority && bHasHighPriority) return 1;
      return a.nome.localeCompare(b.nome);
    });

    return filtered;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-900">
      {showHighPriorityAlert && (
        <HighPriorityAlert
          tickets={highPriorityTickets}
          onClose={() => setShowHighPriorityAlert(false)}
          onTicketClick={(brokerName) => {
            setSelectedBrokerForModal(brokerName);
            setShowHighPriorityAlert(false);
          }}
        />
      )}

      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg">
                <User className="w-4 h-4" />
                <span>{currentUser.email}</span>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <img src="/mybroker.logotype-01.png" alt="MyBroker Logo" className="h-12 w-auto" />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssignedTicketsModal(true)}
                className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Tickets atribuídos a mim"
              >
                <UserCheck className="w-5 h-5" />
                {assignedTicketsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {assignedTicketsCount > 9 ? '9+' : assignedTicketsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-500 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <DailyTabs currentDate={currentDate} onDateChange={setCurrentDate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalBrokers={brokers.length}
          filteredCount={filteredAndSortedBrokers.length}
          pendingTicketsCount={pendingTicketsCount}
          onShowPendingTickets={() => setShowPendingTicketsModal(true)}
        />

        {filteredAndSortedBrokers.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum ticket encontrado</h3>
            <p className="text-gray-400">Tente ajustar os termos de busca ou selecionar outra data.</p>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedBrokers.map((broker, index) => (
              <TicketCard
                key={`${broker.nome}-${index}-${currentDate}`}
                broker={broker}
                currentDate={currentDate}
                ticketCount={0}
                currentUser={currentUser.email}
                hasHighPriority={highPriorityBrokers.includes(broker.nome)}
                hasPendingTickets={pendingTicketsBrokers.includes(broker.nome)}
                forceOpenModal={selectedBrokerForModal === broker.nome}
                onModalClose={() => setSelectedBrokerForModal(null)}
              />
            ))}
          </div>
        )}
      </main>

      <AssignedTicketsModal
        isOpen={showAssignedTicketsModal}
        onClose={() => setShowAssignedTicketsModal(false)}
        currentUser={currentUser.email}
      />

      <PendingTicketsModal
        isOpen={showPendingTicketsModal}
        onClose={() => setShowPendingTicketsModal(false)}
      />

      <footer className="bg-gray-800 border-t border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"></div>
      </footer>
    </div>
  );
}

export default App;
