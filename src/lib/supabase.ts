import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'operator';
  last_seen_notifications_at: string;
  created_at: string;
};

export type BrokerRow = {
  id: string;
  nome: string;
  responsavel: string;
  dominio: string;
  email: string;
  telefone: string;
  ativo: boolean;
  created_at: string;
};

export type TicketRow = {
  id: string;
  broker_id: string;
  broker_nome: string;
  title: string;
  description: string;
  status: 'Pendente' | 'Em Andamento' | 'Resolvido' | 'Fechado' | 'Aberto';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  assigned_to: string;
  created_by: string;
  is_dev: boolean;
  date: string;
  created_at: string;
  updated_at: string;
};

export type RoutineTaskRow = {
  id: string;
  title: string;
  description: string;
  category: 'manha' | 'tarde' | 'custom';
  time: string | null;
  recorrente: boolean;
  ativo: boolean;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  target_role: 'all' | 'operator' | 'admin';
  created_by: string | null;
  created_at: string;
};
