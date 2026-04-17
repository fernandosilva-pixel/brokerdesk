import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function LoginView() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!name.trim()) { setError('Informe seu nome.'); setLoading(false); return; }
      const { error } = await signUp(email, password, name);
      if (error) setError(error);
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar o acesso.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="https://uploadsww.s3.us-east-1.amazonaws.com/files/01JC6QYQQTSDG3PWRR7W7GHZQB/01KF7N0KEDSPRAC3DF7V0EKPM5/TICKET/TICKET_ATTACHMENT/01KPEFS4V8W11VVTJ3KBB4RSZ5.png" alt="BrokerDesk" className="h-10 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white">BrokerDesk</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="px-3 py-2 bg-green-900/30 border border-green-700/50 rounded-lg text-xs text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <><LogIn className="w-4 h-4" /> Entrar</>
              ) : (
                <><UserPlus className="w-4 h-4" /> Criar conta</>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-700 text-center">
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
              className="text-xs text-gray-500 hover:text-blue-400 transition-colors"
            >
              {mode === 'login' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
