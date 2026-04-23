import React, { useState } from 'react';
import { Kanban, Send, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getJiraAuth } from '../../lib/settings';

const JIRA_URL = 'https://asap-team.atlassian.net/rest/api/3/issue';

interface Props {
  currentUserEmail: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function JiraView({ currentUserEmail }: Props) {
  const [email, setEmail] = useState(currentUserEmail);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && status !== 'submitting';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    try {
      const res = await fetch(JIRA_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${getJiraAuth()}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            project: { key: 'MMT2' },
            issuetype: { name: 'Bug' },
            summary: title,
            description: {
              version: 1,
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: `Reportado por: ${email}`, marks: [{ type: 'strong' }] }],
                },
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: description }],
                },
              ],
            },
          },
        }),
      });
      if (res.ok) {
        setStatus('success');
        setTitle('');
        setDescription('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <p className="text-base font-semibold text-white">Ticket criado no Jira!</p>
        <p className="text-xs text-gray-400">O time de desenvolvimento já foi notificado.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Criar outro ticket
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center">
          <Kanban className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Space Asap Codes — Bug Form</p>
          <p className="text-xs text-gray-500">Reporte um problema para o time de desenvolvimento</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Título do Problema <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
            placeholder="Descreva brevemente o problema"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Descreva seu problema para que possamos solucionar <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={5}
            className="w-full px-3 py-2.5 text-sm bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 resize-none"
            placeholder="Explique o problema com o máximo de detalhes possível..."
          />
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Erro ao criar ticket. Verifique sua conexão e tente novamente.
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          {status === 'submitting'
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando...</>
            : <><Send className="w-4 h-4" /> Enviar</>}
        </button>
      </form>
    </div>
  );
}
