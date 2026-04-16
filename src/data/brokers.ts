export type Broker = {
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
};

export const brokers: Broker[] = [
  { nome: 'Hiove', responsavel: 'Lucas Mendes', dominio: 'https://hiove.com', email: 'contato@hiove.com', telefone: '+55 11 99001-1234' },
  { nome: 'T3X Global', responsavel: 'Ana Ferreira', dominio: 'https://t3xglobal.com', email: 'contato@t3xglobal.com', telefone: '+55 11 99002-2345' },
  { nome: 'Binix Pro', responsavel: 'Lucas Mendes', dominio: 'https://binixpro.com', email: 'contato@binixpro.com', telefone: '+55 11 99003-3456' },
  { nome: '01broker', responsavel: 'Ana Ferreira', dominio: 'https://01broker.com', email: 'contato@01broker.com', telefone: '+55 11 99004-4567' },
  { nome: 'AstronFX', responsavel: 'Lucas Mendes', dominio: 'https://astronfx.com', email: 'contato@astronfx.com', telefone: '+55 11 99005-5678' },
  { nome: 'Axium', responsavel: 'Ana Ferreira', dominio: 'https://axium.com', email: 'contato@axium.com', telefone: '+55 11 99006-6789' },
  { nome: 'Axiun Broker', responsavel: 'Lucas Mendes', dominio: 'https://axiunbroker.com', email: 'contato@axiunbroker.com', telefone: '+55 11 99007-7890' },
  { nome: 'BrokerX', responsavel: 'Ana Ferreira', dominio: 'https://brokerx.com', email: 'contato@brokerx.com', telefone: '+55 11 99008-8901' },
];
