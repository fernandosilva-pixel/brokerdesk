export const supabase = null;

export function isSupabaseConfigured(): boolean {
  return false;
}

export type BrokerNote = {
  id: string;
  broker_name: string;
  note: string;
  created_at: string;
};
