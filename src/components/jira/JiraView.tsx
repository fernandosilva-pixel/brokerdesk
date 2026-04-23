import React, { useState } from 'react';
import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';

const JIRA_URL = 'https://asap-team.atlassian.net/jira/software/c/form/24ca704a-aeab-4bb3-9f24-3945c111402b';

export default function JiraView() {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {blocked ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
          <AlertTriangle className="w-10 h-10 text-yellow-500" />
          <p className="text-sm font-semibold text-white">O Jira bloqueou a incorporação via iframe</p>
          <p className="text-xs text-gray-400 max-w-xs">
            Alguns ambientes Atlassian impedem o carregamento em frames externos por política de segurança.
          </p>
          <a
            href={JIRA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir formulário no Jira
          </a>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500">Formulário carregado diretamente do Jira</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setBlocked(false);
                  const frame = document.getElementById('jira-frame') as HTMLIFrameElement;
                  if (frame) { frame.src = JIRA_URL; }
                }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Recarregar
              </button>
              <a
                href={JIRA_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Abrir no Jira
              </a>
            </div>
          </div>
          <iframe
            id="jira-frame"
            src={JIRA_URL}
            className="w-full flex-1 rounded-xl border border-gray-700 bg-white"
            title="Criar Ticket DEV — Jira"
            onError={() => setBlocked(true)}
          />
        </>
      )}
    </div>
  );
}
