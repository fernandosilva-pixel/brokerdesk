import React, { useState } from 'react';
import {
  MessageCircle, Send, Settings2, CheckCircle2, AlertTriangle,
  Zap, Phone, Lock, Globe, RefreshCw, Bell, Clock, Plus, Trash2, X,
} from 'lucide-react';
import { brokers } from '../../data/brokers';

interface WaConfig {
  apiUrl: string;
  apiToken: string;
  instance: string;
  defaultPhone: string;
}

interface AlertTemplate {
  id: string;
  name: string;
  message: string;
  triggerType: 'pendente' | 'urgente' | 'rotina' | 'manual';
  active: boolean;
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
    message: '⚠️ *BrokerDesk Alert*\n\nVocê tem tickets pendentes que precisam de atenção.\n\nAcesse o painel para verificar: {{link}}',
    triggerType: 'pendente',
    active: true,
  },
  {
    id: 't2',
    name: 'Ticket Urgente',
    message: '🚨 *URGENTE — BrokerDesk*\n\nBroker *{{broker}}* tem um ticket urgente aberto:\n\n📋 {{titulo}}\n\nAção imediata necessária!',
    triggerType: 'urgente',
    active: true,
  },
  {
    id: 't3',
    name: 'Lembrete de Rotina',
    message: '📋 *Lembrete de Rotina Diária*\n\nOlá! Você tem tarefas pendentes na sua rotina do dia.\n\nAcesse o painel para conferir.',
    triggerType: 'rotina',
    active: false,
  },
];

export default function WhatsAppView() {
  const [activeTab, setActiveTab] = useState<'config' | 'templates' | 'enviar' | 'historico'>('config');
  const [config, setConfig] = useState<WaConfig>(() => {
    try { return JSON.parse(localStorage.getItem('wa_config') || '{}'); } catch { return {}; }
  });
  const [templates, setTemplates] = useState<AlertTemplate[]>(DEFAULT_TEMPLATES);
  const [sent, setSent] = useState<SentAlert[]>([]);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [sendForm, setSendForm] = useState({ phone: '', message: '', broker: '' });
  const [sending, setSending] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', message: '', triggerType: 'manual' as AlertTemplate['triggerType'] });

  const saveConfig = () => {
    localStorage.setItem('wa_config', JSON.stringify(config));
    alert('Configuração salva!');
  };

  const testConnection = async () => {
    if (!config.apiUrl || !config.apiToken) {
      alert('Preencha a URL da API e o Token primeiro.');
      return;
    }
    setTestStatus('sending');
    try {
      const res = await fetch(`${config.apiUrl}/instance/connectionState/${config.instance}`, {
        headers: { Authorization: `Bearer ${config.apiToken}` },
      });
      setTestStatus(res.ok ? 'ok' : 'error');
    } catch {
      setTestStatus('error');
    }
    setTimeout(() => setTestStatus('idle'), 4000);
  };

  const sendMessage = async (phone: string, message: string) => {
    if (!config.apiUrl || !config.apiToken || !config.instance) {
      const id = Date.now().toString();
      setSent(prev => [{
        id,
        phone,
        message,
        status: 'sent',
        time: new Date().toLocaleTimeString('pt-BR'),
      }, ...prev]);
      return true;
    }
    try {
      const res = await fetch(`${config.apiUrl}/message/sendText/${config.instance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiToken}` },
        body: JSON.stringify({ number: phone.replace(/\D/g, ''), text: message }),
      });
      const success = res.ok;
      setSent(prev => [{
        id: Date.now().toString(),
        phone,
        message,
        status: success ? 'sent' : 'error',
        time: new Date().toLocaleTimeString('pt-BR'),
      }, ...prev]);
      return success;
    } catch {
      setSent(prev => [{
        id: Date.now().toString(),
        phone,
        message,
        status: 'error',
        time: new Date().toLocaleTimeString('pt-BR'),
      }, ...prev]);
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

  const applyTemplate = (template: AlertTemplate) => {
    let msg = template.message;
    if (sendForm.broker) {
      msg = msg.replace('{{broker}}', sendForm.broker).replace('{{titulo}}', 'Ticket Urgente').replace('{{link}}', 'brokerdesk-production.up.railway.app');
    }
    setSendForm(p => ({ ...p, message: msg }));
    setActiveTab('enviar');
  };

  const addTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.message.trim()) return;
    setTemplates(prev => [...prev, { id: Date.now().toString(), ...newTemplate, active: true }]);
    setNewTemplate({ name: '', message: '', triggerType: 'manual' });
    setShowTemplateModal(false);
  };

  const tabs = [
    { id: 'config' as const, label: 'Configuração', Icon: Settings2 },
    { id: 'templates' as const, label: 'Templates', Icon: MessageCircle },
    { id: 'enviar' as const, label: 'Enviar Alerta', Icon: Send },
    { id: 'historico' as const, label: 'Histórico', Icon: Clock },
  ];

  const triggerLabels: Record<AlertTemplate['triggerType'], string> = {
    pendente: 'Ticket Pendente',
    urgente: 'Ticket Urgente',
    rotina: 'Rotina Diária',
    manual: 'Manual',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-green-800">Integração WhatsApp via Evolution API</p>
          <p className="text-xs text-green-700 mt-0.5">Configure sua instância da Evolution API para enviar alertas automáticos de tickets pendentes e lembretes de rotina diretamente no WhatsApp.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-700">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-all ${
                activeTab === id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Config Tab */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                    URL da API
                  </label>
                  <input
                    type="url"
                    value={config.apiUrl || ''}
                    onChange={e => setConfig(p => ({ ...p, apiUrl: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    placeholder="https://sua-evolution-api.com"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    API Token
                  </label>
                  <input
                    type="password"
                    value={config.apiToken || ''}
                    onChange={e => setConfig(p => ({ ...p, apiToken: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    placeholder="seu-token-secreto"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                      <Zap className="w-3.5 h-3.5 text-gray-400" />
                      Nome da Instância
                    </label>
                    <input
                      type="text"
                      value={config.instance || ''}
                      onChange={e => setConfig(p => ({ ...p, instance: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="brokerdesk"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      Telefone Padrão
                    </label>
                    <input
                      type="text"
                      value={config.defaultPhone || ''}
                      onChange={e => setConfig(p => ({ ...p, defaultPhone: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                      placeholder="5511999999999"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'sending'}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    testStatus === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' :
                    testStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-gray-900 text-gray-400 border border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  {testStatus === 'sending' ? <RefreshCw className="w-4 h-4 animate-spin" /> :
                   testStatus === 'ok' ? <CheckCircle2 className="w-4 h-4" /> :
                   testStatus === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                   <Zap className="w-4 h-4" />}
                  {testStatus === 'sending' ? 'Testando...' : testStatus === 'ok' ? 'Conectado!' : testStatus === 'error' ? 'Falhou' : 'Testar Conexão'}
                </button>
                <button
                  onClick={saveConfig}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Salvar Configuração
                </button>
              </div>

              <div className="mt-4 p-4 bg-gray-900 rounded-xl border border-gray-700">
                <p className="text-xs font-semibold text-gray-400 mb-2">Como configurar</p>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Instale a <strong>Evolution API</strong> no seu servidor</li>
                  <li>Crie uma instância e conecte seu WhatsApp via QR Code</li>
                  <li>Copie a URL da API e o Token de autenticação</li>
                  <li>Cole os dados acima e clique em "Testar Conexão"</li>
                </ol>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">Templates de mensagem para alertas automáticos</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Novo Template
                </button>
              </div>
              {templates.map(t => (
                <div key={t.id} className="border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-100">{t.name}</p>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        t.triggerType === 'urgente' ? 'bg-red-50 text-red-700 border-red-200' :
                        t.triggerType === 'pendente' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        t.triggerType === 'rotina' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-gray-900 text-gray-400 border-gray-700'
                      }`}>
                        {triggerLabels[t.triggerType]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => applyTemplate(t)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        Usar
                      </button>
                      <button
                        onClick={() => setTemplates(prev => prev.filter(x => x.id !== t.id))}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans bg-gray-900 rounded-lg p-3 border border-gray-700 mt-2">{t.message}</pre>
                </div>
              ))}
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'enviar' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Número de destino</label>
                <input
                  type="text"
                  value={sendForm.phone}
                  onChange={e => setSendForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  placeholder="5511999999999 (com DDI e DDD)"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Broker (opcional — para templates)</label>
                <select
                  value={sendForm.broker}
                  onChange={e => setSendForm(p => ({ ...p, broker: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                >
                  <option value="">Nenhum</option>
                  {brokers.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300">Mensagem</label>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Usar template →
                  </button>
                </div>
                <textarea
                  value={sendForm.message}
                  onChange={e => setSendForm(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white placeholder-gray-400"
                  rows={5}
                  placeholder="Digite a mensagem a ser enviada..."
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

              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-xs text-yellow-700">
                <strong>Modo Demo:</strong> sem API configurada, os envios são simulados e registrados no histórico.
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              {sent.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Nenhum alerta enviado ainda</p>
                </div>
              ) : (
                sent.map(s => (
                  <div key={s.id} className={`border rounded-xl p-3 ${s.status === 'error' ? 'border-red-100 bg-red-50' : 'border-gray-700 bg-gray-800'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-300">{s.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          s.status === 'sent' ? 'bg-green-100 text-green-700' :
                          s.status === 'error' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {s.status === 'sent' ? 'Enviado' : s.status === 'error' ? 'Falhou' : 'Pendente'}
                        </span>
                        <span className="text-[10px] text-gray-400">{s.time}</span>
                      </div>
                    </div>
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans">{s.message.slice(0, 120)}{s.message.length > 120 ? '...' : ''}</pre>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Novo Template</h2>
              <button onClick={() => setShowTemplateModal(false)} className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Nome do Template *</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                  placeholder="Ex: Alerta de SLA"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Tipo de Gatilho</label>
                <select
                  value={newTemplate.triggerType}
                  onChange={e => setNewTemplate(p => ({ ...p, triggerType: e.target.value as AlertTemplate['triggerType'] }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
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
                  <span className="font-normal text-gray-400 ml-1">— use {'{{broker}}'}, {'{{titulo}}'}, {'{{link}}'}</span>
                </label>
                <textarea
                  value={newTemplate.message}
                  onChange={e => setNewTemplate(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white placeholder-gray-400"
                  rows={4}
                  placeholder="Digite a mensagem do template..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowTemplateModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={addTemplate}
                disabled={!newTemplate.name.trim() || !newTemplate.message.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
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
