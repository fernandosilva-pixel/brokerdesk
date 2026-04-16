export type DemandStatus =
  | 'pendente'
  | 'andamento'
  | 'observacao'
  | 'aguardando'
  | 'aguardando_interno'
  | 'semretorno'
  | 'resolvida'
  | 'cancelada';

export type DemandPriority = 'low' | 'medium' | 'high' | 'critical';

export type DemandCategory =
  | 'Financeiro'
  | 'Saque'
  | 'Depósito'
  | 'Plataforma'
  | 'Trading'
  | 'Integração'
  | 'Afiliados'
  | 'Login / Acesso'
  | 'KYC'
  | 'Comercial'
  | 'Operacional'
  | 'Bug'
  | 'Dúvida'
  | 'Outros';

export interface HistoryEntry {
  time: string;
  text: string;
  author?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Demand {
  id: number;
  title: string;
  description: string;
  category: DemandCategory;
  priority: DemandPriority;
  status: DemandStatus;
  contact: string;
  whatsapp: string;
  operator: string;
  opened: string;         // ISO date string
  deadline: string;       // ISO date string
  followup: string | null; // ISO datetime string
  internalNotes: string;
  lastReply?: string;
  lastReplyDate?: string;
  history: HistoryEntry[];
  checklist: ChecklistItem[];
  tags: string[];
  isOverdue: boolean;
}

export interface Broker {
  id: string;
  name: string;
  operator: string;
  operatorInitials: string;
  demands: Demand[];
}

export interface Operator {
  name: string;
  initials: string;
  role: string;
  color: 'blue' | 'purple';
}

export type FilterType =
  | 'todos'
  | 'pendente'
  | 'observacao'
  | 'semretorno'
  | 'critica'
  | 'atrasada'
  | 'followup';

export type DateRange = 'hoje' | 'semana' | 'mes';
