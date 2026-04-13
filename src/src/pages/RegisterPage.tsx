/**
 * RegisterPage.tsx — User Registration Form
 *
 * Public page. Fields: Full Name, Email, Password.
 *
 * Password strength indicator (StrengthBar component):
 *  - 4 animated segments, each lights up when its rule is met:
 *    1. Length ≥ 8 characters
 *    2. Contains uppercase letter
 *    3. Contains a number
 *    4. Contains a special character
 *  - Bar colour: red (weak) → amber (fair) → green (strong)
 *  - Submit button is disabled until all 4 rules pass
 *
 * On successful registration:
 *  1. Calls api.auth.register()
 *  2. Dispatches SET_USER
 *  3. Redirects to /dashboard
 */
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

interface Requirement { label: string; met: boolean; }

function getRequirements(pw: string): Requirement[] {
  return [
    { label: 'At least 8 characters',       met: pw.length >= 8 },
    { label: 'One uppercase letter (A–Z)',   met: /[A-Z]/.test(pw) },
    { label: 'One number (0–9)',             met: /[0-9]/.test(pw) },
    { label: 'One special character (!@#…)', met: /[^A-Za-z0-9]/.test(pw) },
  ];
}

function StrengthBar({ requirements }: { requirements: Requirement[] }) {
  const metCount = requirements.filter(r => r.met).length;
  const total    = requirements.length;
  const pct      = metCount / total;

  const color = pct === 1 ? '#3EBD8A' : pct >= 0.5 ? '#E8993C' : '#E05252';
  const label = pct === 1 ? 'Strong' : pct >= 0.75 ? 'Good' : pct >= 0.5 ? 'Fair' : 'Weak';

  return (
    <div className="mt-2 space-y-2">
      {/* Segmented bar */}
      <div className="flex gap-1 h-1.5">
        {requirements.map((r, i) => (
          <motion.div key={i} className="flex-1 rounded-full overflow-hidden bg-brand-border">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: r.met ? color : 'transparent' }}
              initial={{ width: 0 }}
              animate={{ width: r.met ? '100%' : '0%' }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </motion.div>
        ))}
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        <motion.p key={label} initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
          className="text-xs font-medium" style={{ color }}>
          {label} password
        </motion.p>
      </AnimatePresence>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((r, i) => (
          <motion.div key={i} className="flex items-center gap-1.5"
            animate={{ opacity: 1 }} initial={{ opacity: 0.6 }}>
            <motion.div animate={{ scale: r.met ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.25 }}>
              {r.met
                ? <Check className="w-3 h-3 text-[#3EBD8A]" />
                : <X className="w-3 h-3 text-brand-muted/40" />
              }
            </motion.div>
            <span className={`text-xs transition-colors ${r.met ? 'text-brand-text' : 'text-brand-muted/50'}`}>
              {r.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function RegisterPage() {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useStore();
  const navigate = useNavigate();

  const requirements = useMemo(() => getRequirements(password), [password]);
  const allMet = requirements.every(r => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (!allMet) { setError('Password does not meet all requirements'); return; }
    setIsLoading(true);
    try {
      const user = await api.auth.register(name.trim(), email.trim(), password);
      dispatch({ type: 'SET_USER', payload: user });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex justify-center items-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-brand-accent rounded-xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">Progressly</span>
        </Link>
        <h2 className="mt-6 text-center text-2xl font-bold text-white font-display">Create your account</h2>
        <p className="mt-2 text-center text-sm text-brand-muted">Join thousands of teams already using Progressly.</p>
      </div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="glass-panel py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-brand-border/50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="p-3 rounded-md bg-brand-danger/10 border border-brand-danger/20 text-brand-danger text-sm text-center">{error}</div>}

            <Input label="Full Name" type="text" required value={name} onChange={e => setName(e.target.value)}
              icon={<User className="w-5 h-5" />} placeholder="John Doe" />

            <Input label="Email address" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />} placeholder="you@example.com" />

            {/* Password with toggle + strength */}
            <div>
              <label className="block text-sm font-medium text-brand-muted mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-muted">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="flex h-10 w-full rounded-md border border-brand-border bg-brand-surface/50 pl-10 pr-10 py-2 text-sm text-brand-text placeholder:text-brand-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-muted hover:text-white transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && <StrengthBar requirements={requirements} />}
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}
              icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
              className="mt-2" disabled={!allMet && password.length > 0}>
              Create Account
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-border" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-brand-surface text-brand-muted">Already have an account?</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-brand-highlight hover:text-white transition-colors">Sign in instead</Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
