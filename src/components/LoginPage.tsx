import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Sparkles, TrendingUp, ShieldCheck, Zap, User, Lock } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username?: string, password?: string) => void;
  isLoading: boolean;
}

export function LoginPage({ onLogin, isLoading }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 selection:bg-brand-primary selection:text-white">
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary rounded-2xl shadow-xl shadow-blue-500/20 mb-6 group transition-transform hover:scale-105 active:scale-95 cursor-default">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-text-main mb-2">
            DalciosPay<span className="text-brand-primary">.</span>
          </h1>
          <p className="text-brand-text-muted font-medium">
            Gestão financeira inteligente e minimalista.
          </p>
        </motion.div>

        {/* Card Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-brand-border rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50 relative overflow-hidden"
        >
          {/* Decorative backgrounds */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-brand-accent-bg rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-40 h-40 bg-blue-50 rounded-full blur-3xl opacity-50" />

          <div className="relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Usuário</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Seu usuário"
                    className="w-full pl-12 pr-4 py-4 bg-brand-bg border border-brand-border rounded-2xl outline-none focus:border-brand-primary transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-brand-text-muted ml-1">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full pl-12 pr-4 py-4 bg-brand-bg border border-brand-border rounded-2xl outline-none focus:border-brand-primary transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-brand-primary hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Acessar Carteira</span>
                  </>
                )}
              </button>
            </form>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-brand-text-muted font-bold uppercase tracking-widest text-[9px]">ou continue com</span>
              </div>
            </div>

            <button
              onClick={() => onLogin()}
              disabled={isLoading}
              className="w-full border border-brand-border bg-white hover:bg-slate-50 text-brand-text-main font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative group overflow-hidden"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span>Entrar com Google</span>
            </button>

            <div className="mt-8 pt-6 border-t border-brand-border/50 text-center">
              <p className="text-xs text-brand-text-muted font-medium">
                Novo por aqui? 
                <span className="text-brand-primary ml-1 opacity-50 cursor-not-allowed">Criar nova conta</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex justify-center gap-6"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-brand-text-muted uppercase tracking-widest bg-brand-bg-muted px-4 py-2 rounded-full border border-brand-border">
            <Sparkles size={14} className="text-amber-500" />
            <span>Power by Gemini & Supabase</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
