import React, { useState, useMemo } from 'react';
import { Broker, Demand, DemandStatus, FilterType, DateRange } from './types';
import { initialBrokers, OPERATORS, nextId } from './data/mockData';
import Header from './components/Header';
import KPIRow from './components/KPIRow';
import FilterRow from './components/FilterRow';
import BrokerGrid from './components/BrokerGrid';
import NewDemandModal from './components/NewDemandModal';
import BrokerDrawer from './components/BrokerDrawer';
import OperatorsModal from './components/OperatorsModal';
import Toast from './components/Toast';

export interface AppState {
  brokers: Broker[];
  filter: FilterType;
  dateRange: DateRange;
  search: string;
}

export default function App() {
  const [brokers, setBrokers] = useState<Broker[]>(initialBrokers);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [dateRange, setDateRange] = useState<DateRange>('hoje');
  const [search, setSearch] = useState('');

  // Modals / Drawer
  const [newDemandOpen, setNewDemandOpen] = useState(false);
  const [newDemandBrokerId, setNewDemandBrokerId] = useState<string | null>(null);
  const [drawerBrokerId, setDrawerBrokerId] = useState<string | null>(null);
  const [operatorsOpen, setOperatorsOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false });

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg, visible: false }), 2800);
  };

  // Filtered brokers for the grid
  const filteredBrokers = useMemo(() => {
    let list = brokers;
    if (search) list = list.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    if (filter !== 'todos') {
      list = list.filter(b => {
        const d = b.demands;
        const today = '2026-04-16';
        if (filter === 'pendente')    return d.some(x => x.status === 'pendente');
        if (filter === 'observacao')  return d.some(x => x.status === 'observacao');
        if (filter === 'semretorno')  return d.some(x => x.status === 'semretorno');
        if (filter === 'critica')     return d.some(x => x.priority === 'critical' && x.status !== 'resolvida' && x.status !== 'cancelada');
        if (filter === 'atrasada')    return d.some(x => x.isOverdue);
        if (filter === 'followup')    return d.some(x => x.followup && x.followup.startsWith(today));
        return true;
      });
    }
    return list;
  }, [brokers, search, filter]);

  // KPI computations
  const kpis = useMemo(() => {
    const all = brokers.flatMap(b => b.demands);
    const today = '2026-04-16';
    return {
      totalBrokers: brokers.length,
      pendentes:    all.filter(d => d.status === 'pendente').length,
      observacao:   all.filter(d => d.status === 'observacao').length,
      semRetorno:   all.filter(d => d.status === 'semretorno').length,
      atrasadas:    all.filter(d => d.isOverdue).length,
      resolvidas:   all.filter(d => d.status === 'resolvida').length,
      followupHoje: all.filter(d => d.followup && d.followup.startsWith(today)).length,
      andamento:    all.filter(d => d.status === 'andamento').length,
    };
  }, [brokers]);

  // Filter counts
  const filterCounts = useMemo(() => {
    const all = brokers.flatMap(b => b.demands);
    const today = '2026-04-16';
    return {
      todos:      all.length,
      pendente:   all.filter(d => d.status === 'pendente').length,
      observacao: all.filter(d => d.status === 'observacao').length,
      semretorno: all.filter(d => d.status === 'semretorno').length,
      critica:    all.filter(d => d.priority === 'critical' && d.status !== 'resolvida').length,
      atrasada:   all.filter(d => d.isOverdue).length,
      followup:   all.filter(d => d.followup && d.followup.startsWith(today)).length,
    };
  }, [brokers]);

  // Handlers
  const openNewDemand = (brokerId?: string) => {
    setNewDemandBrokerId(brokerId || null);
    setNewDemandOpen(true);
  };

  const openDrawer = (brokerId: string) => setDrawerBrokerId(brokerId);
  const closeDrawer = () => setDrawerBrokerId(null);

  const drawerBroker = useMemo(
    () => brokers.find(b => b.id === drawerBrokerId) || null,
    [brokers, drawerBrokerId]
  );

  const handleSaveDemand = (data: Partial<Demand> & { brokerId: string }) => {
    setBrokers(prev => prev.map(b => {
      if (b.id !== data.brokerId) return b;
      const newDemand: Demand = {
        id: nextId(),
        title: data.title || 'Nova demanda',
        description: data.description || '',
        category: data.category || 'Outros',
        priority: data.priority || 'medium',
        status: data.status || 'pendente',
        contact: data.contact || '—',
        whatsapp: data.whatsapp || '—',
        operator: data.operator || b.operator,
        opened: '2026-04-16',
        deadline: data.deadline || '2026-04-23',
        followup: data.followup || null,
        internalNotes: data.internalNotes || '',
        history: [{ time: '16/04 agora', text: `Demanda criada por ${data.operator || b.operator}`, author: data.operator || b.operator }],
        checklist: [
          { id: 'c1', text: 'Contato inicial realizado', done: false },
          { id: 'c2', text: 'Documentação coletada', done: false },
          { id: 'c3', text: 'Escalado para equipe interna', done: false },
          { id: 'c4', text: 'Retorno ao cliente dado', done: false },
          { id: 'c5', text: 'Demanda encerrada', done: false },
        ],
        tags: [],
        isOverdue: false,
      };
      return { ...b, demands: [newDemand, ...b.demands] };
    }));
    showToast('✓ Demanda criada com sucesso!');
  };

  const handleChangeStatus = (brokerId: string, demandId: number, newStatus: DemandStatus) => {
    setBrokers(prev => prev.map(b => {
      if (b.id !== brokerId) return b;
      return {
        ...b,
        demands: b.demands.map(d => {
          if (d.id !== demandId) return d;
          return {
            ...d,
            status: newStatus,
            history: [...d.history, { time: '16/04 agora', text: `Status alterado para: ${newStatus}`, author: 'Sistema' }],
          };
        }),
      };
    }));
    showToast('Status atualizado!');
  };

  const handleToggleChecklist = (brokerId: string, demandId: number, checkId: string) => {
    setBrokers(prev => prev.map(b => {
      if (b.id !== brokerId) return b;
      return {
        ...b,
        demands: b.demands.map(d => {
          if (d.id !== demandId) return d;
          return {
            ...d,
            checklist: d.checklist.map(c => c.id === checkId ? { ...c, done: !c.done } : c),
          };
        }),
      };
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg0)' }}>
      <Header
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        search={search}
        onSearchChange={setSearch}
      />

      <div style={{ padding: '16px 20px', maxWidth: 1600, margin: '0 auto' }}>
        <KPIRow kpis={kpis} />

        <FilterRow
          filter={filter}
          counts={filterCounts}
          onFilterChange={setFilter}
          onOpenOperators={() => setOperatorsOpen(true)}
        />

        <BrokerGrid
          brokers={filteredBrokers}
          onNewDemand={openNewDemand}
          onOpenDrawer={openDrawer}
        />
      </div>

      {/* New Demand Modal */}
      <NewDemandModal
        open={newDemandOpen}
        defaultBrokerId={newDemandBrokerId}
        brokers={brokers}
        onClose={() => setNewDemandOpen(false)}
        onSave={handleSaveDemand}
      />

      {/* Broker Drawer */}
      <BrokerDrawer
        broker={drawerBroker}
        allBrokers={brokers}
        open={!!drawerBrokerId}
        onClose={closeDrawer}
        onNewDemand={() => drawerBrokerId && openNewDemand(drawerBrokerId)}
        onChangeStatus={handleChangeStatus}
        onToggleChecklist={handleToggleChecklist}
      />

      {/* Operators Modal */}
      <OperatorsModal
        open={operatorsOpen}
        brokers={brokers}
        operators={OPERATORS}
        onClose={() => setOperatorsOpen(false)}
      />

      <Toast message={toast.msg} visible={toast.visible} />
    </div>
  );
}
