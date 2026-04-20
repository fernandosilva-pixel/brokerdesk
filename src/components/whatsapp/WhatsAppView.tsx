import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle, Send, Settings2, CheckCircle2, AlertTriangle,
  RefreshCw, Bell, Clock, Plus, Trash2, X, QrCode, Phone,
  Lock, Zap, Wifi, WifiOff, Globe,
} from 'lucide-react';

interface ZApiConfig {
  instanceId: string;
  token: string;
  defaultPhone: string;
  n8nWebhookUrl: string;
}

interface AlertTemplate {
  id: string;
  name: string;
  message: string;
  triggerType: 'pendente' | 'urgente' | 'rotina' | 'manual';
}

interface SentAlert {
  id: string;
  phone: string;
  message: string;
  status: 'sent' | 'error' | 'pending';
  time: string;
}

const DEFAULT_TEMPLATES: AlertTemplate[] = [
  {
    id: 't1',
    name: 'Ticket Pendente',
    message: '⚠️ *BrokerDesk Alert*\n\nVocê tem tickets pendentes que precisam de atenção.\n\nAcesse o painel para verificar: brokerdesk.up.railway.app',
    triggerType: 'pendente',
  },
  {
    id: 't2',
    name: 'Ticket Urgente',
    message: '🚨 *URGENTE — BrokerDesk*\n\nBroker *{{broker}}* tem um ticket urgente aberto:\n\n📋 {{titulo}}\n\nAção imediata necessária!',
    triggerType: 'urgente',
  },
  {
    id: 't3',
    name: 'Lembrete de Rotina',
    message: '📋 *Lembrete de Rotina Diária*\n\nOlá! Você tem tarefas pendentes na sua rotina do dia.\n\nAcesse o painel para conferir.',
    triggerType: 'rotina',
  },
];

const triggerLabels: Record<AlertTemplate['triggerType'], string> = {
  pendente: 'Ticket Pendente',
  urgente: 'Ticket Urgente',
  rotina: 'Rotina Diária',
  manual: 'Manual',
};

type Tab = 'config' | 'conectar' | 'templates' | 'enviar' | 'historico';
type ConnStatus = 'unknown' | 'connected' | 'disconnected' | 'checking';

export default function WhatsAppView() {
  const [activeTab, setActiveTab] = useState<Tab>('config');
  const [config, setConfig] = useState<ZApiConfig>(() => {
    try { return JSON.parse(localStorage.getItem('zapi_config') || '{}'); } catch { return {}; }
  });
  const [templates, setTemplates] = useState<AlertTemplate[]>(DEFAULT_TEMPLATES);
  const [sent, setSent] = useState<SentAlert[]>([]);
  const [connStatus, setConnStatus] = useState<ConnStatus>('unknown');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendForm, setSendForm] = useState({ phone: '', message: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', message: '', triggerType: 'manual' as AlertTemplate['triggerType'] });
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const baseUrl = `https://api.z-api.io/instances/${config.instanceId}/token/${config.token}`;
  const isConfigured = !!(config.instanceId && config.token);

  const checkStatus = async () => {
    if (!isConfigured) return;
    setConnStatus('checking');
    try {
      const res = await fetch(`${baseUrl}/status`);
      if (res.ok) {
        const data = await res.json();
        setConnStatus(data.connected ? 'connected' : 'disconnected');
        if (data.connected) stopQrPolling();
      } else {
        setConnStatus('disconnected');
      }
    } catch {
      setConnStatus('disconnected');
    }
  };

  const fetchQrCode = async () => {
    if (!isConfigured) return;
    setQrLoading(true);
    try {
      const res = await fetch(`${baseUrl}/qrcode`);
      if (res.ok) {
        const data = await res.json();
        // Z-API returns { value: "base64string" } or the image directly
        if (data.value) {
          setQrCode(data.value);
        } else if (data.qrcode) {
          setQrCode(data.qrcode);
        }
        // After getting QR, check if already connected
        await checkStatus();
      }
    } catch {
      // ignore
    }
    setQrLoading(false);
  };

  const startQrPolling = () => {
    fetchQrCode();
    qrIntervalRef.current = setInterval(async () => {
      await checkStatus();
      if (connStatus !== 'connected') fetchQrCode();
    }, 20000);
  };

  const stopQrPolling = () => {
    if (qrIntervalRef.current) {
      clearInterval(qrIntervalRef.current);
      qrIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (activeTab === 'conectar' && isConfigured) {
      checkStatus();
      startQrPolling();
    } else {
      stopQrPolling();
    }
    return () => stopQrPolling();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isConfigured]);

  const [saveMsg, setSaveMsg] = useState('');
  const [webhookTestMsg, setWebhookTestMsg] = useState('');

  const saveConfig = () => {
    localStorage.setItem('zapi_config', JSON.stringify(config));
    setSaveMsg('✅ Configuração salva!');
    setTimeout(() => setSaveMsg(''), 3000);
    checkStatus();
  };

  const testWebhook = async () => {
    const url = config.n8nWebhookUrl;
    if (!url) { setWebhookTestMsg('❌ URL do webhook não preenchida'); setTimeout(() => setWebhookTestMsg(''), 4000); return; }
    setWebhookTestMsg('Enviando...');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'test', message: 'Teste de conexão BrokerDesk', timestamp: new Date().toISOString() }),
      });
      setWebhookTestMsg(res.ok ? '✅ Webhook enviado! Verifique o n8n.' : `❌ Erro ${res.status}`);
    } catch {
      setWebhookTestMsg('❌ Falha ao conectar com o n8n');
    }
    setTimeout(() => setWebhookTestMsg(''), 5000);
  };

  const sendMessage = async (phone: string, message: string): Promise<boolean> => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!isConfigured) {
      setSent(prev => [{ id: Date.now().toString(), phone, message, status: 'pending', time: new Date().toLocaleTimeString('pt-BR') }, ...prev]);
      return false;
    }
    try {
      const res = await fetch(`${baseUrl}/send-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, message }),
      });
      const success = res.ok;
      setSent(prev => [{ id: Date.now().toString(), phone, message, status: success ? 'sent' : 'error', time: new Date().toLocaleTimeString('pt-BR') }, ...prev]);
      return success;
    } catch {
      setSent(prev => [{ id: Date.now().toString(), phone, message, status: 'error', time: new Date().toLocaleTimeString('pt-BR') }, ...prev]);
      return false;
    }
  };

  const handleSend = async () => {
    if (!sendForm.phone.trim() || !sendForm.message.trim()) return;
    setSending(true);
    await sendMessage(sendForm.phone, sendForm.message);
    setSendForm(p => ({ ...p, message: '' }));
    setSending(false);
  };

  const applyTemplate = (t: AlertTemplate) => {
    setSendForm(p => ({ ...p, message: t.message }));
    setActiveTab('enviar');
  };

  const addTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.message.trim()) return;
    setTemplates(prev => [...prev, { id: Date.now().toString(), ...newTemplate }]);
    setNewTemplate({ name: '', message: '', triggerType: 'manual' });
    setShowTemplateModal(false);
  };

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'config', label: 'Configuração', Icon: Settings2 },
    { id: 'conectar', label: 'Conectar', Icon: QrCode },
    { id: 'templates', label: 'Templates', Icon: MessageCircle },
    { id: 'enviar', label: 'Enviar', Icon: Send },
    { id: 'historico', label: 'Histórico', Icon: Clock },
  ];

  const statusBar = () => {
    if (!isConfigured) return null;
    const cfg = {
      connected: { icon: <Wifi className="w-3.5 h-3.5" />, label: 'Conectado', cls: 'bg-green-900/30 text-green-400 border-green-700/50' },
      disconnected: { icon: <WifiOff className="w-3.5 h-3.5" />, label: 'Desconectado', cls: 'bg-red-900/30 text-red-400 border-red-700/50' },
      checking: { icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'Verificando...', cls: 'bg-gray-700 text-gray-400 border-gray-600' },
      unknown: { icon: <Zap className="w-3.5 h-3.5" />, label: 'Status desconhecido', cls: 'bg-gray-700 text-gray-400 border-gray-600' },
    }[connStatus];
    return (
      <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${cfg.cls}`}>
        {cfg.icon} {cfg.label}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600/20 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">WhatsApp — Z-API</p>
            <p className="text-xs text-gray-500">Alertas e notificações via WhatsApp</p>
          </div>
        </div>
        {statusBar()}
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-shrink-0 flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all min-w-[60px] ${
                activeTab === id
                  ? 'text-green-400 border-b-2 border-green-500 bg-green-900/10'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-5">

          {/* ── Config Tab ── */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Informe as credenciais da sua instância Z-API. Você encontra esses dados no painel em{' '}
                <span className="text-blue-400">app.z-api.io</span>.
              </p>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                  <Zap className="w-3.5 h-3.5 text-gray-400" /> Instance ID
                </label>
                <input
                  type="text"
                  value={config.instanceId || ''}
                  onChange={e => setConfig(p => ({ ...p, instanceId: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                  placeholder="Ex: 3C7F2B1A4D..."
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                  <Lock className="w-3.5 h-3.5 text-gray-400" /> Token
                </label>
                <input
                  type="password"
                  value={config.token || ''}
                  onChange={e => setConfig(p => ({ ...p, token: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                  placeholder="Seu token Z-API"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> Telefone padrão para alertas
                </label>
                <input
                  type="text"
                  value={config.defaultPhone || ''}
                  onChange={e => setConfig(p => ({ ...p, defaultPhone: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                  placeholder="5511999999999"
                />
                <p className="text-[11px] text-gray-500 mt-1">DDI + DDD + número, sem espaços ou símbolos</p>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-gray-400" /> Webhook URL (n8n)
                </label>
                <input
                  type="url"
                  value={config.n8nWebhookUrl || ''}
                  onChange={e => setConfig(p => ({ ...p, n8nWebhookUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                  placeholder="https://seu-n8n.com/webhook/brokerdesk"
                />
                <p className="text-[11px] text-gray-500 mt-1">URL do webhook do n8n — todos os eventos do sistema são enviados aqui</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={checkStatus}
                  disabled={!isConfigured || connStatus === 'checking'}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {connStatus === 'checking'
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : connStatus === 'connected'
                    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                    : <Zap className="w-4 h-4" />}
                  Testar
                </button>
                <button
                  onClick={saveConfig}
                  disabled={!isConfigured}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Salvar Configuração
                </button>
              </div>
              {saveMsg && <p className="text-xs text-green-400 font-medium">{saveMsg}</p>}
              <button
                onClick={testWebhook}
                disabled={!config.n8nWebhookUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                Testar Webhook n8n
              </button>
              {webhookTestMsg && <p className="text-xs font-medium text-gray-300">{webhookTestMsg}</p>}

              <div className="p-4 bg-gray-900 rounded-xl border border-gray-700 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400">Como obter as credenciais</p>
                <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                  <li>Acesse <span className="text-blue-400">app.z-api.io</span> e faça login</li>
                  <li>Crie ou selecione uma instância</li>
                  <li>Copie o <strong className="text-gray-300">Instance ID</strong> e o <strong className="text-gray-300">Token</strong></li>
                  <li>Cole acima, salve e vá para a aba <strong className="text-gray-300">Conectar</strong></li>
                </ol>
              </div>
            </div>
          )}

          {/* ── Conectar Tab ── */}
          {activeTab === 'conectar' && (
            <div className="space-y-5">
              {!isConfigured ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
                  <p className="text-sm text-gray-300 font-medium">Configure as credenciais primeiro</p>
                  <p className="text-xs text-gray-500 mt-1">Vá para a aba Configuração e preencha Instance ID e Token.</p>
                  <button onClick={() => setActiveTab('config')} className="mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                    Ir para Configuração
                  </button>
                </div>
              ) : connStatus === 'connected' ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">WhatsApp conectado!</p>
                  <p className="text-xs text-gray-400 mt-1">Sua instância está ativa e pronta para enviar mensagens.</p>
                  <button
                    onClick={checkStatus}
                    className="mt-5 flex items-center gap-2 mx-auto px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Verificar novamente
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-200">Escaneie o QR Code com o WhatsApp</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Abra o WhatsApp → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong>
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div className="relative w-52 h-52 bg-white rounded-2xl flex items-center justify-center">
                      {qrLoading ? (
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                      ) : qrCode ? (
                        <img
                          src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                          alt="QR Code WhatsApp"
                          className="w-44 h-44 object-contain"
                        />
                      ) : (
                        <div className="text-center px-4">
                          <QrCode className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-400">Clique em gerar para obter o QR Code</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={fetchQrCode}
                      disabled={qrLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {qrLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                      {qrCode ? 'Novo QR Code' : 'Gerar QR Code'}
                    </button>
                    <button
                      onClick={checkStatus}
                      disabled={connStatus === 'checking'}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      {connStatus === 'checking' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                      Status
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 text-center">
                    O QR Code expira a cada 20 segundos. Clique em "Novo QR Code" se expirar.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Templates Tab ── */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400">Templates reutilizáveis para alertas</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" /> Novo
                </button>
              </div>
              {templates.map(t => (
                <div key={t.id} className="border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-100">{t.name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        t.triggerType === 'urgente' ? 'bg-red-900/30 text-red-400 border-red-700/50' :
                        t.triggerType === 'pendente' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' :
                        t.triggerType === 'rotina' ? 'bg-blue-900/30 text-blue-400 border-blue-700/50' :
                        'bg-gray-700 text-gray-400 border-gray-600'
                      }`}>
                        {triggerLabels[t.triggerType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => applyTemplate(t)}
                        className="text-xs font-medium text-green-400 hover:text-green-300 px-2.5 py-1 bg-green-900/20 hover:bg-green-900/30 border border-green-700/50 rounded-lg transition-colors"
                      >
                        Usar
                      </button>
                      <button
                        onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))}
                        className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans bg-gray-900 rounded-lg p-3 border border-gray-700/50 mt-2">{t.message}</pre>
                </div>
              ))}
            </div>
          )}

          {/* ── Enviar Tab ── */}
          {activeTab === 'enviar' && (
            <div className="space-y-4">
              {!isConfigured && (
                <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg text-xs text-yellow-400">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Sem credenciais configuradas — os envios serão registrados como pendentes.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Número de destino</label>
                <input
                  type="text"
                  value={sendForm.phone}
                  onChange={e => setSendForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                  placeholder="5511999999999 (DDI + DDD + número)"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Mensagem</label>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="text-[11px] text-green-400 hover:text-green-300 font-medium"
                  >
                    Usar template →
                  </button>
                </div>
                <textarea
                  value={sendForm.message}
                  onChange={e => setSendForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-white placeholder-gray-500"
                  rows={5}
                  placeholder="Digite a mensagem..."
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !sendForm.phone.trim() || !sendForm.message.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando...' : 'Enviar via WhatsApp'}
              </button>
            </div>
          )}

          {/* ── Histórico Tab ── */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              {sent.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Nenhum alerta enviado ainda</p>
                </div>
              ) : (
                sent.map(s => (
                  <div key={s.id} className={`border rounded-xl p-3 ${
                    s.status === 'error' ? 'border-red-700/50 bg-red-900/10' :
                    s.status === 'pending' ? 'border-yellow-700/50 bg-yellow-900/10' :
                    'border-gray-700 bg-gray-800'
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs font-medium text-gray-300">{s.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                          s.status === 'sent' ? 'bg-green-900/30 text-green-400 border-green-700/50' :
                          s.status === 'error' ? 'bg-red-900/30 text-red-400 border-red-700/50' :
                          'bg-yellow-900/30 text-yellow-400 border-yellow-700/50'
                        }`}>
                          {s.status === 'sent' ? 'Enviado' : s.status === 'error' ? 'Falhou' : 'Pendente'}
                        </span>
                        <span className="text-[10px] text-gray-500">{s.time}</span>
                      </div>
                    </div>
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans line-clamp-3">{s.message.slice(0, 150)}{s.message.length > 150 ? '...' : ''}</pre>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      {/* New Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Novo Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nome *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-500"
                  placeholder="Ex: Alerta de SLA"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Tipo de Gatilho</label>
                <select
                  value={newTemplate.triggerType}
                  onChange={e => setNewTemplate(p => ({ ...p, triggerType: e.target.value as AlertTemplate['triggerType'] }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                >
                  <option value="manual">Manual</option>
                  <option value="pendente">Ticket Pendente</option>
                  <option value="urgente">Ticket Urgente</option>
                  <option value="rotina">Rotina Diária</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Mensagem *
                  <span className="font-normal text-gray-500 ml-1">— {'{{broker}}'}, {'{{titulo}}'} disponíveis</span>
                </label>
                <textarea
                  value={newTemplate.message}
                  onChange={e => setNewTemplate(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-white placeholder-gray-500"
                  rows={4}
                  placeholder="Digite a mensagem..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTemplateModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={addTemplate}
                disabled={!newTemplate.name.trim() || !newTemplate.message.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Criar Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
