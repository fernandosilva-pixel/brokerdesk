import type { Ticket } from '../data/brokers';

export const daysAgo = (isoDate: string): number => {
  const created = new Date(isoDate);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
};

export const isCreatedToday = (isoDate: string): boolean => {
  const d = new Date(isoDate);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
};

export const isOverdue = (ticket: Ticket): boolean =>
  ticket.status === 'Pendente' && daysAgo(ticket.createdAt) > 3;

export const dateLabel = (isoDate: string): string | null => {
  const days = daysAgo(isoDate);
  if (days === 0) return null;
  if (days === 1) return '1 dia atrás';
  return `${days} dias atrás`;
};
