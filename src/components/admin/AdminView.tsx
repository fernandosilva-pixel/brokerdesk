import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit2, X, Check, Building2,
  Bell, AlertTriangle, Info, CheckCircle, XCircle,
  Globe, Mail, Phone, User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { BrokerRow, NotificationRow } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { sendWebhook, isInNotifyWindow } from '../../lib/webhook';

type Tab = 'brokers' | 'notifications';

const notifTypeConfig = {
  info:    { label: 'Info',    Icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-900/30',   border: 'border-blue-700/50' },
  success: { label: 'Sucesso', Icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-900/30',  border: 'border-green-700/50' },
  warning: { label: 'Alerta',  Icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-900/30', border: 'border-yellow-700/50' },
  error:   { label: 'Erro',    Icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/50' },
} as const;

const emptyBroker = { nome: '', responsavel: '', dominio: '', email: '', telefone: '' };
const emptyNotif = { title: '', message: '', type: 'info' as NotificationRow['type'], target_role: 'all' as NotificationRow['target_role'] };

export default function AdminView() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('brokers');

  // Brokers
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [bLoading, setBLoading] = useState(true);
  const [showBrokerForm, setShowBrokerForm] = useState(false);
  const [editingBroker, setEditingBroker] = useState<BrokerRow | null>(null);
  const [brokerForm, setBrokerForm] = useState(emptyBroker);
  const [bSaving, setBSaving] = useState(false);
  const [bError, setBError] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [nLoading, setNLoading] = useState(true);
  const [notifForm, setNotifForm] = useState(emptyNotif);
  const [nSaving, setNSaving] = useState(false);
  const [nError, setNError] = useState('');
  const [nSuccess, setNSuccess] = useState('');

  const loadBrokers = useCallback(async () => {
    setBLoading(true);
    const { data } = await supabase.from('brokers').select('*').order('nome');
    if (data) setBrokers(data as BrokerRow[]);
    setBLoading(false);
  }, []);

  const loadNotifications = useCallback(async () => {
    setNLoading(true);
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setNotifications(data as NotificationRow[]);
    setNLoading(false);
  }, []);

  useEffect(() => { loadBrokers(); }, [loadBrokers]);
  useEffect(() => { if (tab === 'notifications') loadNotifications(); }, [tab, loadNotifications]);

  // ── Broker handlers ──
  const openAddBroker = () => { setEditingBroker(null); setBrokerForm(emptyBroker); setBError(''); setShowBrokerForm(true); };
  const openEditBroker = (b: BrokerRow) => { setEditingBroker(b); setBrokerForm({ nome: b.nome, responsavel: b.responsavel, dominio: b.dominio, email: b.email, telefone: b.telefone }); setBError(''); setShowBrokerForm(true); };

  const saveBroker = async () => {
    if (!brokerForm.nome.trim() || !brokerForm.responsavel.trim()) { setBError('Nome e responsável são obrigatórios.'); return; }
    setBSaving(true); setBError('');
    if (editingBroker) {
      const { error } = await supabase.from('brokers').update(brokerForm).eq('id', editingBroker.id);
      if (error) { setBError(error.message); setBSaving(false); return; }
    } else {
      const { error } = await supabase.from('brokers').insert({ ...brokerForm, ativo: true });
      if (error) { setBError(error.message); setBSaving(false); return; }
    }
    await loadBrokers();
    setShowBrokerForm(false);
    setBSaving(false);
  };

  const deleteBroker = async (id: string) => {
    if (!window.confirm('Remover este broker? Todos os tickets vinculados serão excluídos.')) return;
    await supabase.from('brokers').delete().eq('id', id);
    await loadBrokers();
  };

  const toggleAtivo = async (b: BrokerRow) => {
    await supabase.from('brokers').update({ ativo: !b.ativo }).eq('id', b.id);
    await loadBrokers();
  };

  // ── Notification handlers ──
  const sendNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) { setNError('Título e mensagem são obrigatórios.'); return; }
    setNSaving(true); setNError(''); setNSuccess('');
    const { error } = await supabase.from('notifications').insert({ ...notifForm, created_by: user?.id });
    if (error) { setNError(error.message); }
    else {
      setNSuccess('Notificação enviada!');
      if (isInNotifyWindow()) {
        sendWebhook({ event: 'admin_notification', notification: { title: notifForm.title, message: notifForm.message, type: notifForm.type }, timestamp: new Date().toISOString() });
      }
      setNotifForm(emptyNotif);
      await loadNotifications();
    }
    setNSaving(false);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    await loadNotifications();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-700/50 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Painel Admin</h2>
          <p className="text-xs text-gray-500">Gerencie brokers e notificações do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 border border-gray-700 rounded-xl p-1 w-fit">
        {([['brokers', Building2, 'Brokers'], ['notifications', Bell, 'Notificações']] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── BROKERS TAB ── */}
      {tab === 'brokers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{brokers.length} broker{brokers.length !== 1 ? 's' : ''} cadastrado{brokers.length !== 1 ? 's' : ''}</p>
            <button onClick={openAddBroker} className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Novo Broker
            </button>
          </div>

          {bLoading ? (
            <div className="text-center py-12 text-gray-500 text-sm">Carregando...</div>
          ) : brokers.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-xl">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhum broker cadastrado</p>
              <p className="text-xs text-gray-600 mt-1">Clique em "Novo Broker" para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {brokers.map(b => (
                <div key={b.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{b.nome}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${b.ativo ? 'bg-green-900/30 text-green-400 border-green-700/50' : 'bg-gray-700 text-gray-500 border-gray-600'}`}>
                        {b.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{b.responsavel}</span>
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{b.dominio}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{b.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{b.telefone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleAtivo(b)} className="p-1.5 text-gray-500 hover:text-yellow-400 hover:bg-gray-700 rounded-lg transition-colors" title={b.ativo ? 'Desativar' : 'Ativar'}>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => openEditBroker(b)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteBroker(b.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === 'notifications' && (
        <div className="space-y-5">
          {/* Create form */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" /> Enviar Notificação
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Título *</label>
                <input
                  type="text"
                  value={notifForm.title}
                  onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Título da notificação"
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Mensagem *</label>
                <textarea
                  value={notifForm.message}
                  onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Detalhe do alerta ou comunicado"
                  rows={3}
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Tipo</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.entries(notifTypeConfig) as [NotificationRow['type'], typeof notifTypeConfig[keyof typeof notifTypeConfig]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNotifForm(p => ({ ...p, type: key }))}
                        className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${notifForm.type === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500'}`}
                      >
                        <cfg.Icon className="w-3 h-3" /> {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Destinatário</label>
                  <select
                    value={notifForm.target_role}
                    onChange={e => setNotifForm(p => ({ ...p, target_role: e.target.value as NotificationRow['target_role'] }))}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos</option>
                    <option value="operator">Operadores</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {nError && <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">{nError}</p>}
              {nSuccess && <p className="text-xs text-green-400 bg-green-900/20 border border-green-700/40 rounded-lg px-3 py-2">{nSuccess}</p>}

              <button
                onClick={sendNotification}
                disabled={nSaving}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {nSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Bell className="w-4 h-4" />}
                Enviar Notificação
              </button>
            </div>
          </div>

          {/* History */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</p>
            {nLoading ? (
              <p className="text-center py-8 text-gray-500 text-sm">Carregando...</p>
            ) : notifications.length === 0 ? (
              <p className="text-center py-8 text-gray-600 text-sm">Nenhuma notificação enviada</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => {
                  const cfg = notifTypeConfig[n.type];
                  return (
                    <div key={n.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <cfg.Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${cfg.color}`}>{n.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {new Date(n.created_at).toLocaleString('pt-BR')} · para {n.target_role === 'all' ? 'todos' : n.target_role}
                        </p>
                      </div>
                      <button onClick={() => deleteNotification(n.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Broker Form Modal ── */}
      {showBrokerForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">
                {editingBroker ? 'Editar Broker' : 'Novo Broker'}
              </h2>
              <button onClick={() => setShowBrokerForm(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { key: 'nome', label: 'Nome *', placeholder: 'Ex: Hiove' },
                { key: 'responsavel', label: 'Responsável *', placeholder: 'Nome do responsável' },
                { key: 'dominio', label: 'URL do Painel Admin', placeholder: 'https://admin.exemplo.com' },
                { key: 'email', label: 'E-mail', placeholder: 'contato@exemplo.com' },
                { key: 'telefone', label: 'Telefone', placeholder: '+55 11 99000-0000' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
                  <input
                    type="text"
                    value={brokerForm[key as keyof typeof brokerForm]}
                    onChange={e => setBrokerForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            {bError && <p className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-700/40 rounded-lg px-3 py-2">{bError}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowBrokerForm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={saveBroker}
                disabled={bSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
              >
                {bSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                {editingBroker ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
