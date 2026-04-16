import React from 'react';

interface Props {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: Props) {
  if (!visible) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      background: 'var(--bg3)', border: '1px solid var(--border2)',
      borderRadius: 8, padding: '10px 16px',
      fontSize: 13, color: 'var(--text1)', zIndex: 999,
      display: 'flex', alignItems: 'center', gap: 8,
      animation: 'slideUp .25s ease',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />
      {message}
      <style>{`@keyframes slideUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}
