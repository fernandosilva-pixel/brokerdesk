import { getWebhookUrl } from './settings';

export const sendWebhook = async (payload: object): Promise<void> => {
  try {
    const url = getWebhookUrl();
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });
  } catch { /* silent — webhook never breaks the app */ }
};

export const isInNotifyWindow = (): boolean => {
  const h = new Date().getHours();
  return h >= 8 && h < 23;
};
