import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Clock, Calendar, RefreshCw } from 'lucide-react';
import { sendWebhook, isInNotifyWindow } from '../../lib/webhook';

interface Task {
  id: string;
  title: string;
  description: string;
  category: 'manha' | 'tarde' | 'custom';
  done: boolean;
  time?: string;
  recorrente: boolean;
}

const DEFAULT_TASKS: Task[] = [
  { id: 'rt1', title: 'Verificar tickets pendentes de ontem', description: 'Revisar todos os tickets que ficaram abertos do dia anterior', category: 'manha', done: false, time: '08:00', recorrente: true },
  { id: 'rt2', title: 'Checar alertas de alto risco', description: 'Revisar brokers com prioridade Alta ou Urgente', category: 'manha', done: false, time: '08:30', recorrente: true },
  { id: 'rt3', title: 'Atualizar status dos brokers', description: 'Confirmar se todos os sistemas dos brokers estão operacionais', category: 'manha', done: false, time: '09:00', recorrente: true },
  { id: 'rt4', title: 'Enviar relatório de progresso', description: 'Enviar atualização para o time sobre tickets em andamento', category: 'tarde', done: false, time: '13:00', recorrente: true },
  { id: 'rt5', title: 'Revisar pendências do dia', description: 'Checar se todos os tickets abertos hoje foram tratados', category: 'tarde', done: false, time: '17:00', recorrente: true },
  { id: 'rt6', title: 'Fechar tickets resolvidos', description: 'Confirmar resolução com clientes e fechar tickets concluídos', category: 'tarde', done: false, time: '17:30', recorrente: true },
];

const STORAGE_KEY = 'brokerdesk_rotina';
const DATE_KEY = 'brokerdesk_rotina_date';

export default function RotinaView({ currentUser }: { currentUser?: string }) {
  const today = new Date().toISOString().split('T')[0];

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedDate = localStorage.getItem(DATE_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (savedDate === today && saved) return JSON.parse(saved);
      return DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'custom' as Task['category'], time: '', recorrente: false });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    localStorage.setItem(DATE_KEY, today);
  }, [tasks, today]);

  const toggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.done && isInNotifyWindow()) {
      sendWebhook({
        event: 'routine_task_completed',
        task: { title: task.title, category: task.category, completed_by: currentUser ?? 'Operador' },
        timestamp: new Date().toISOString(),
      });
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };
  const remove = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      done: false,
      time: newTask.time || undefined,
      recorrente: newTask.recorrente,
    };
    setTasks(prev => [...prev, task]);
    setNewTask({ title: '', description: '', category: 'custom', time: '', recorrente: false });
    setShowAddModal(false);
  };

  const resetDay = () => {
    if (window.confirm('Resetar todas as tarefas do dia?')) {
      setTasks(DEFAULT_TASKS);
    }
  };

  const manha = tasks.filter(t => t.category === 'manha');
  const tarde = tasks.filter(t => t.category === 'tarde');
  const custom = tasks.filter(t => t.category === 'custom');

  const total = tasks.length;
  const done = tasks.filter(t => t.done).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  const categoryConfig = {
    manha: { label: 'Manhã', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', dot: 'bg-orange-400' },
    tarde: { label: 'Tarde', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', dot: 'bg-blue-400' },
    custom: { label: 'Tarefas Extras', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', dot: 'bg-purple-400' },
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
                task.done ? 'border-gray-700 opacity-60' : 'border-gray-700 hover:border-gray-600 hover:shadow-sm'
              }`}
            >
              <button onClick={() => toggle(task.id)} className="mt-0.5 flex-shrink-0">
                {task.done
                  ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                  : <Circle className="w-4 h-4 text-gray-300 hover:text-blue-500 transition-colors" />
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
                      <Clock className="w-3 h-3" />
                      {task.time}
                    </div>
                  )}
                  {task.recorrente && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <RefreshCw className="w-2.5 h-2.5" />
                      Diário
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => remove(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Rotina do Dia</h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetDay}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 px-3 py-1.5 bg-gray-900 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Resetar
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-white px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-3 h-3" />
              Nova Tarefa
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-400">{done} de {total} tarefas concluídas</span>
            <span className={`font-bold ${progress === 100 ? 'text-green-600' : progress > 50 ? 'text-blue-600' : 'text-gray-400'}`}>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Summary Badges */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-50">
          {[
            { label: 'Total', value: total, color: 'text-gray-300' },
            { label: 'Concluídas', value: done, color: 'text-green-600' },
            { label: 'Pendentes', value: total - done, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center flex-1">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-gray-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Task Sections */}
      <div className="space-y-6">
        {renderSection('Manhã', manha, categoryConfig.manha)}
        {renderSection('Tarde', tarde, categoryConfig.tarde)}
        {custom.length > 0 && renderSection('Tarefas Extras', custom, categoryConfig.custom)}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Nova Tarefa</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Nome da tarefa"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">Descrição</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-white placeholder-gray-400"
                  rows={2}
                  placeholder="Opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Período</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask(p => ({ ...p, category: e.target.value as Task['category'] }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="manha">Manhã</option>
                    <option value="tarde">Tarde</option>
                    <option value="custom">Extra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">Horário</label>
                  <input
                    type="time"
                    value={newTask.time}
                    onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newTask.recorrente}
                  onChange={e => setNewTask(p => ({ ...p, recorrente: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Tarefa recorrente (repete todo dia)</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-400 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={addTask}
                disabled={!newTask.title.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
