export type Broker = {
  id: string;
  nome: string;
  responsavel: string;
  dominio: string;
  email: string;
  telefone: string;
};

export type Ticket = {
  id: string;
  broker: Broker;
  date: string;
  status: 'Pendente' | 'Em Andamento' | 'Resolvido' | 'Fechado' | 'Aberto';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  title: string;
  description: string;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDev?: boolean;
  department?: string;
};

export const brokers: Broker[] = [];
