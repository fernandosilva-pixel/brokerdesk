export const sendWebhook = async (payload: object): Promise<void> => {
  try {
    const config = JSON.parse(localStorage.getItem('zapi_config') || '{}');
    const url = config.n8nWebhookUrl as string | undefined;
    if (!url) return;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* silent — webhook never breaks the app */ }
};

export const isInNotifyWindow = (): boolean => {
  const h = new Date().getHours();
  return h >= 8 && h < 23;
};
