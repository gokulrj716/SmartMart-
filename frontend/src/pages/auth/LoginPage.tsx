import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, switchRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post<any>('/auth/login', { email, password });
      if (res.success && res.token) {
        login(res.token, res.user);
        if (res.user.role === 'CASHIER') navigate('/pos');
        else if (res.user.role === 'CUSTOMER') navigate('/');
        else navigate('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    await switchRole(role);
    if (role === 'CASHIER') navigate('/pos');
    else if (role === 'CUSTOMER') navigate('/');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-emerald-500/20 mb-3">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-white">SMARTMART</h2>
        <p className="text-xs text-slate-400 mt-1">Supermarket POS & Omnichannel Retail Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-800 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@smartmart.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button variant="primary" type="submit" className="w-full py-3" isLoading={isLoading}>
              Sign In to Account
            </Button>
          </form>

          {/* 1-Click Persona Demo Sign-In */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block text-center">
              1-Click Demo Persona Sign-In:
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                Admin (Full Access)
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('CASHIER')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-emerald-400 border border-slate-700 transition-colors"
              >
                Cashier (POS Mode)
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('MANAGER')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sky-400 border border-slate-700 transition-colors"
              >
                Store Manager
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('CUSTOMER')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-amber-400 border border-slate-700 transition-colors"
              >
                Customer App
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
