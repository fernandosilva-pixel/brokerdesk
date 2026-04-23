import React, { useState, useRef } from 'react';
import { Kanban, Send, CheckCircle2, AlertTriangle, RefreshCw, Paperclip, X, ImageIcon, FileText } from 'lucide-react';
import { getJiraAuth } from '../../lib/settings';

const JIRA_BASE = 'https://asap-team.atlassian.net/rest/api/3';

interface Props {
  currentUserEmail: string;
}

type Status = 'idle' | 'submitting' | 'uploading' | 'success' | 'error';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FilePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const [previewUrl] = useState(() => isImage ? URL.createObjectURL(file) : null);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900 border border-gray-700 rounded-lg group">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{file.name}</p>
        <p className="text-[10px] text-gray-500">{formatBytes(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="p-1 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function JiraView({ currentUserEmail }: Props) {
  const [email, setEmail] = useState(currentUserEmail);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    files.length > 0 &&
    status !== 'submitting' &&
    status !== 'uploading';

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const added = Array.from(incoming).filter(f => f.size <= 10 * 1024 * 1024); // 10 MB limit
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...added.filter(f => !existing.has(f.name + f.size))];
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus('submitting');
    setErrorMsg('');

    try {
      // 1. Criar o issue
      const res = await fetch(`${JIRA_BASE}/issue`, {
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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.errors ? JSON.stringify(body.errors) : 'Erro ao criar issue');
      }

      const { key } = await res.json();

      // 2. Anexar arquivos
      setStatus('uploading');
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const attachRes = await fetch(`${JIRA_BASE}/issue/${key}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${getJiraAuth()}`,
            'X-Atlassian-Token': 'no-check',
          },
          body: form,
        });
        if (!attachRes.ok) {
          throw new Error(`Falha ao anexar "${file.name}"`);
        }
      }

      setStatus('success');
      setTitle('');
      setDescription('');
      setFiles([]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido');
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

  const isSubmitting = status === 'submitting' || status === 'uploading';

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

        {/* Anexos */}
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Anexos <span className="text-red-400">*</span>
            <span className="font-normal text-gray-500 ml-1">(obrigatório — máx. 10 MB por arquivo)</span>
          </label>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg cursor-pointer transition-colors group"
          >
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-blue-400 transition-colors">
              <ImageIcon className="w-5 h-5" />
              <Paperclip className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors text-center">
              Arraste arquivos aqui ou <span className="text-blue-400">clique para selecionar</span>
            </p>
            <p className="text-[10px] text-gray-600">PNG, JPG, GIF, PDF, MP4…</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.txt,.log"
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />

          {/* Preview dos arquivos */}
          {files.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {files.map((file, i) => (
                <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
              ))}
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMsg || 'Erro ao criar ticket. Verifique sua conexão e tente novamente.'}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors"
        >
          {status === 'submitting' && <><RefreshCw className="w-4 h-4 animate-spin" /> Criando ticket...</>}
          {status === 'uploading' && <><RefreshCw className="w-4 h-4 animate-spin" /> Enviando anexos ({files.length})...</>}
          {(status === 'idle' || status === 'error') && <><Send className="w-4 h-4" /> Enviar</>}
        </button>
      </form>
    </div>
  );
}
