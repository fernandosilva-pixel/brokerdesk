import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Clock, Calendar, RefreshCw, Pencil } from 'lucide-react';
import { sendWebhook } from '../../lib/webhook';
import { supabase } from '../../lib/supabase';
import type { RoutineTaskRow } from '../../lib/supabase';

type Task = RoutineTaskRow & { done: boolean };

const DONE_KEY = 'brokerdesk_rotina_done';
const DATE_KEY = 'brokerdesk_rotina_date';

function loadDoneState(): Record<string, boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(DATE_KEY);
    if (savedDate !== today) {
      localStorage.setItem(DATE_KEY, today);
      localStorage.removeItem(DONE_KEY);
      return {};
    }
    return JSON.parse(localStorage.getItem(DONE_KEY) || '{}');
  } catch { return {}; }
}

function saveDoneState(state: Record<string, boolean>) {
  localStorage.setItem(DONE_KEY, JSON.stringify(state));
}

const EMPTY_FORM = { title: '', description: '', category: 'manha' as Task['category'], time: '', recorrente: true };

export default function RotinaView({ currentUser, isAdmin }: { currentUser?: string; isAdmin?: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [doneState, setDoneState] = useState<Record<string, boolean>>(loadDoneState);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('routine_tasks')
      .select('*')
      .eq('ativo', true)
      .order('category')
      .order('time', { nullsFirst: false });
    const done = loadDoneState();
    setDoneState(done);
    setTasks((data ?? []).map((r: RoutineTaskRow) => ({ ...r, done: done[r.id] ?? false })));
    setLoading(false);
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const toggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.done) return;
    const newState = { ...doneState, [id]: true };
    setDoneState(newState);
    saveDoneState(newState);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    await supabase.from('routine_completions').insert({
      task_id: task.id,
      task_title: task.title,
      category: task.category,
      completed_by: currentUser ?? 'Operador',
      completed_date: new Date().toLocaleDateString('en-CA'),
    });
    sendWebhook({
      event: 'routine_task_completed',
      task: { title: task.title, category: task.category, completed_by: currentUser ?? 'Operador' },
      timestamp: new Date().toISOString(),
    });
  };

  const openAdd = () => { setEditingTask(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description, category: task.category, time: task.time ?? '', recorrente: task.recorrente });
    setShowModal(true);
  };

  const saveTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (editingTask) {
      await supabase.from('routine_tasks').update({
        title: form.title, description: form.description,
        category: form.category, time: form.time || null, recorrente: form.recorrente,
      }).eq('id', editingTask.id);
    } else {
      await supabase.from('routine_tasks').insert({
        title: form.title, description: form.description,
        category: form.category, time: form.time || null, recorrente: form.recorrente,
      });
    }
    setSaving(false);
    setShowModal(false);
    loadTasks();
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remover esta tarefa?')) return;
    await supabase.from('routine_tasks').update({ ativo: false }).eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const resetDay = () => {
    if (!window.confirm('Resetar progresso do dia?')) return;
    const newState: Record<string, boolean> = {};
    setDoneState(newState);
    saveDoneState(newState);
    setTasks(prev => prev.map(t => ({ ...t, done: false })));
  };

  const manha = tasks.filter(t => t.category === 'manha');
  const tarde = tasks.filter(t => t.category === 'tarde');
  const custom = tasks.filter(t => t.category === 'custom');
  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const categoryConfig = {
    manha: { label: 'Manhã', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-400' },
    tarde: { label: 'Tarde', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', dot: 'bg-blue-400' },
    custom: { label: 'Tarefas Extras', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', dot: 'bg-purple-400' },
  };

  const renderSection = (label: string, sectionTasks: Task[], cfg: typeof categoryConfig['manha']) => (
    <div>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${cfg.bg} ${cfg.border} border mb-3`}>
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{label}</span>
        <span className={`ml-auto text-xs font-medium ${cfg.color}`}>
          {sectionTasks.filter(t => t.done).length}/{sectionTasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {sectionTasks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">Nenhuma tarefa nesta sessão</p>
        ) : (
          sectionTasks.map(task => (
            <div
              key={task.id}
              className={`group flex items-start gap-3 p-3 bg-gray-800 rounded-xl border transition-all duration-150 ${
                task.done ? 'border-gray-700 opacity-60' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <button onClick={() => toggle(task.id)} className={`mt-0.5 flex-shrink-0 ${task.done ? 'cursor-default' : 'cursor-pointer'}`}>
                {task.done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Circle className="w-4 h-4 text-gray-400 hover:text-blue-500 transition-colors" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug ${task.done ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {task.time && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="w-3 h-3" />{task.time}
                    </div>
                  )}
                  {task.recorrente && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <RefreshCw className="w-2.5 h-2.5" />Diário
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(task)} className="p-1 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(task.id)} className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Rotina do Dia</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button onClick={resetDay} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
                <RefreshCw className="w-3 h-3" />Resetar
              </button>
              <button onClick={openAdd} className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                <Plus className="w-3 h-3" />Nova Tarefa
              </button>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-400">{done} de {total} tarefas concluídas</span>
            <span className={`font-bold ${progress === 100 ? 'text-green-400' : progress > 50 ? 'text-blue-400' : 'text-gray-400'}`}>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-700">
          {[
            { label: 'Total', value: total, color: 'text-gray-300' },
            { label: 'Concluídas', value: done, color: 'text-green-400' },
            { label: 'Pendentes', value: total - done, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center flex-1">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection('Manhã', manha, categoryConfig.manha)}
          {renderSection('Tarde', tarde, categoryConfig.tarde)}
          {custom.length > 0 && renderSection('Tarefas Extras', custom, categoryConfig.custom)}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="form-label">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="form-control"
                  placeholder="Nome da tarefa"
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="form-control"
                  style={{ resize: 'none' }}
                  rows={2}
                  placeholder="Opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Período</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as Task['category'] }))}
                    className="form-control"
                  >
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="custom">Extra</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Horário</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="form-control"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recorrente}
                  onChange={e => setForm(p => ({ ...p, recorrente: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Tarefa recorrente (repete todo dia)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                Cancelar
              </button>
              <button
                onClick={saveTask}
                disabled={!form.title.trim() || saving}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {saving ? 'Salvando...' : editingTask ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
