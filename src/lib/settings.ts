import { supabase } from './supabase';

let cachedWebhookUrl = '';

export const loadWebhookUrl = async (): Promise<void> => {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'n8n_webhook_url')
    .single();
  cachedWebhookUrl = data?.value ?? '';
};

export const saveWebhookUrl = async (url: string): Promise<void> => {
  cachedWebhookUrl = url;
  await supabase
    .from('app_settings')
    .upsert({ key: 'n8n_webhook_url', value: url, updated_at: new Date().toISOString() });
};

export const getWebhookUrl = (): string => cachedWebhookUrl;
