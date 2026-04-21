import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Clock, Calendar, RefreshCw, Pencil, CheckSquare } from 'lucide-react';
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

const categoryConfig = {
  manha:  { label: 'Manhã',         color: 'var(--orange)',  bg: 'var(--orange-bg)',  border: 'var(--orange-border)' },
  tarde:  { label: 'Tarde',         color: 'var(--blue)',    bg: 'var(--blue-bg)',    border: 'var(--blue-border)' },
  custom: { label: 'Tarefas Extras', color: 'var(--purple)', bg: 'var(--purple-bg)', border: 'var(--purple-border)' },
};

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

  const renderSection = (sectionTasks: Task[], cfg: typeof categoryConfig['manha']) => (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
        <span className="ml-auto text-[11px] font-semibold num" style={{ color: cfg.color }}>
          {sectionTasks.filter(t => t.done).length}/{sectionTasks.length}
        </span>
      </div>
      <div className="space-y-2">
        {sectionTasks.length === 0 ? (
          <p className="text-[12px] text-center py-3" style={{ color: 'var(--text3)' }}>Nenhuma tarefa nesta sessão</p>
        ) : (
          sectionTasks.map(task => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-xl transition-all duration-150"
              style={{
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                opacity: task.done ? 0.55 : 1,
              }}
            >
              <button
                onClick={() => toggle(task.id)}
                className={`mt-0.5 flex-shrink-0 ${task.done ? 'cursor-default' : 'cursor-pointer'}`}
              >
                {task.done
                  ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--green)' }} />
                  : <Circle className="w-4 h-4 transition-colors" style={{ color: 'var(--text3)' }} />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-medium leading-snug"
                  style={{
                    color: task.done ? 'var(--text3)' : 'var(--text1)',
                    textDecoration: task.done ? 'line-through' : 'none',
                  }}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--text3)' }}>{task.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  {task.time && (
                    <div className="flex items-center gap-1 text-[10px] num" style={{ color: 'var(--text3)' }}>
                      <Clock className="w-3 h-3" />{task.time}
                    </div>
                  )}
                  {task.recorrente && (
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text3)' }}>
                      <RefreshCw className="w-2.5 h-2.5" />Diário
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(task)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--blue)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--blue-bg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => remove(task.id)}
                    className="p-1 rounded-lg transition-colors cursor-pointer"
                    style={{ color: 'var(--text3)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--red-bg)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
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
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header card */}
      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-border)' }}>
              <CheckSquare className="w-4 h-4" style={{ color: 'var(--blue)' }} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text1)' }}>Rotina do Dia</h2>
              <div className="flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text3)' }}>
                <Calendar className="w-3 h-3" />
                <span className="text-[11px]">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={resetDay}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text2)', background: 'var(--bg3)', border: '1px solid var(--border2)' }}
              >
                <RefreshCw className="w-3 h-3" />Resetar
              </button>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ background: 'var(--blue)', color: '#fff', border: '1px solid var(--blue)' }}
              >
                <Plus className="w-3 h-3" />Nova Tarefa
              </button>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium" style={{ color: 'var(--text3)' }}>
              {done} de {total} tarefas concluídas
            </span>
            <span
              className="text-[12px] font-bold num"
              style={{ color: progress === 100 ? 'var(--green)' : progress > 50 ? 'var(--blue)' : 'var(--text3)' }}
            >
              {progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg4)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: progress === 100 ? 'var(--green)' : 'var(--blue)',
              }}
            />
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="flex gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {[
            { label: 'Total',      value: total,       color: 'var(--text2)' },
            { label: 'Concluídas', value: done,         color: 'var(--green)' },
            { label: 'Pendentes',  value: total - done, color: total - done > 0 ? 'var(--red)' : 'var(--text3)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center flex-1">
              <p className="text-xl font-bold num" style={{ color }}>{value}</p>
              <p className="section-label mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task sections */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <span className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--blue-border)', borderTopColor: 'var(--blue)' }} />
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection(manha, categoryConfig.manha)}
          {renderSection(tarde, categoryConfig.tarde)}
          {custom.length > 0 && renderSection(custom, categoryConfig.custom)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl p-6"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text1)' }}>
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: 'var(--text3)' }}
              >
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
                  className="w-4 h-4 rounded"
                  style={{ accentColor: 'var(--blue)' }}
                />
                <span className="text-[13px]" style={{ color: 'var(--text2)' }}>Tarefa recorrente (repete todo dia)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn"
              >
                Cancelar
              </button>
              <button
                onClick={saveTask}
                disabled={!form.title.trim() || saving}
                className="flex-1 btn btn-primary"
                style={{ opacity: (!form.title.trim() || saving) ? 0.5 : 1, cursor: (!form.title.trim() || saving) ? 'not-allowed' : 'pointer' }}
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
