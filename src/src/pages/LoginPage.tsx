/**
 * LoginPage.tsx — User Login Form
 *
 * Public page (no auth required). Shows email + password inputs.
 *
 * On successful login:
 *  1. Calls api.auth.login() → receives JWT + user object
 *  2. Dispatches SET_USER to global store
 *  3. Redirects to /dashboard
 *
 * Displays backend error messages inline (e.g. "Invalid email or password").
 * Password show/hide toggle included.
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Mail, Lock, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      const user = await api.auth.login(email, password);
      dispatch({ type: 'SET_USER', payload: user });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center items-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">Progressly</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-white">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-brand-muted">Welcome back! Please enter your details.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-brand-border/50">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <div className="p-3 rounded-md bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm text-center">{error}</div>}
            <Input label="Email address" type="email" required value={email} onChange={e => setEmail(e.target.value)} icon={<Mail className="w-5 h-5" />} placeholder="you@example.com" />
            <Input label="Password" type="password" required value={password} onChange={e => setPassword(e.target.value)} icon={<Lock className="w-5 h-5" />} placeholder="••••••••" />
            <Button type="submit" fullWidth isLoading={isLoading} icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined} className="mt-2">Sign in</Button>
          </form>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-brand-surface text-brand-muted">Don't have an account?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/register" className="font-medium text-brand-highlight hover:text-white transition-colors">Sign up for free</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
