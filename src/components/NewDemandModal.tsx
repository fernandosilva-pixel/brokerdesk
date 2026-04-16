import React, { useState, useEffect } from 'react';
import { Broker, Demand, DemandStatus, DemandPriority, DemandCategory } from '../types';
import { CATEGORIES, OPERATORS } from '../data/mockData';

interface Props {
  open: boolean;
  defaultBrokerId: string | null;
  brokers: Broker[];
  onClose: () => void;
  onSave: (data: Partial<Demand> & { brokerId: string }) => void;
}

export default function NewDemandModal({ open, defaultBrokerId, brokers, onClose, onSave }: Props) {
  const [brokerId, setBrokerId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DemandCategory>('Outros');
  const [priority, setPriority] = useState<DemandPriority>('medium');
  const [status, setStatus] = useState<DemandStatus>('pendente');
  const [contact, setContact] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [operator, setOperator] = useState(OPERATORS[0].name);
  const [deadline, setDeadline] = useState('');
  const [followup, setFollowup] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    if (open) {
      setBrokerId(defaultBrokerId || (brokers[0]?.id ?? ''));
    }
  }, [open, defaultBrokerId, brokers]);

  const handleSave = () => {
    if (!title.trim()) { alert('Informe o título da demanda'); return; }
    onSave({ brokerId, title, description, category, priority, status, contact, whatsapp, operator, deadline, followup: followup || null, internalNotes });
    // reset
    setTitle(''); setDescription(''); setContact(''); setWhatsapp('');
    setInternalNotes(''); setDeadline(''); setFollowup('');
    onClose();
  };

  if (!open) return null;
  const selectedBroker = brokers.find(b => b.id === brokerId);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--bg1)', border: '1px solid var(--border2)',
        borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '88vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            Nova Demanda{selectedBroker ? ` — ${selectedBroker.name}` : ''}
          </div>
          <button className="btn btn-xs" onClick={onClose} style={{ fontSize: 16 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Broker */}
            <div>
              <label className="form-label">Broker</label>
              <select className="form-control" value={brokerId} onChange={e => setBrokerId(e.target.value)}>
                {brokers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            {/* Contact */}
            <div>
              <label className="form-label">Contato</label>
              <input className="form-control" placeholder="Nome da pessoa" value={contact} onChange={e => setContact(e.target.value)} />
            </div>
            {/* Title */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Título da Demanda *</label>
              <input className="form-control" placeholder="Descreva resumidamente o problema" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            {/* Description */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Descrição</label>
              <textarea className="form-control" rows={3} placeholder="Detalhes completos..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            {/* Category */}
            <div>
              <label className="form-label">Categoria</label>
              <select className="form-control" value={category} onChange={e => setCategory(e.target.value as DemandCategory)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {/* Priority */}
            <div>
              <label className="form-label">Prioridade</label>
              <select className="form-control" value={priority} onChange={e => setPriority(e.target.value as DemandPriority)}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="form-label">Status</label>
              <select className="form-control" value={status} onChange={e => setStatus(e.target.value as DemandStatus)}>
                <option value="pendente">Pendente</option>
                <option value="andamento">Em andamento</option>
                <option value="observacao">Em observação</option>
                <option value="aguardando">Aguardando cliente</option>
                <option value="aguardando_interno">Aguardando time interno</option>
              </select>
            </div>
            {/* Operator */}
            <div>
              <label className="form-label">Responsável</label>
              <select className="form-control" value={operator} onChange={e => setOperator(e.target.value)}>
                {OPERATORS.map(o => <option key={o.name}>{o.name}</option>)}
              </select>
            </div>
            {/* WhatsApp */}
            <div>
              <label className="form-label">WhatsApp</label>
              <input className="form-control" placeholder="+55 11 9..." value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            </div>
            {/* Follow-up */}
            <div>
              <label className="form-label">Follow-up</label>
              <input type="datetime-local" className="form-control" value={followup} onChange={e => setFollowup(e.target.value)} />
            </div>
            {/* Deadline */}
            <div>
              <label className="form-label">Data limite resolução</label>
              <input type="date" className="form-control" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            {/* Internal notes */}
            <div style={{ gridColumn: '1/-1' }}>
              <label className="form-label" style={{ color: 'var(--yellow)' }}>⚑ Observações internas</label>
              <textarea className="form-control" rows={2} placeholder="Notas internas (não visível ao cliente)..." value={internalNotes} onChange={e => setInternalNotes(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Criar Demanda</button>
        </div>
      </div>
    </div>
  );
}
