'use client';

import React, { useState } from 'react';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillDefaultAdmin() {
    setEmail('admin@newsportal.com');
    setPassword('AdminPassword123!');
    setError(null);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative overflow-hidden transition-colors duration-150">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-amber-500/10 dark:bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[250px] bg-rose-500/10 dark:bg-rose-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 font-serif font-black text-zinc-950 text-3xl shadow-xl shadow-amber-500/20 mb-4">
            N
          </div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white font-serif">
            NEWSROOM EDITORIAL CMS
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 uppercase tracking-widest font-mono">
            Authorized Editorial & Staff Portal
          </p>
        </div>

        {/* Login Card */}
        <div className="p-8 rounded-2xl bg-white/90 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl shadow-xl dark:shadow-2xl transition-colors">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 flex items-start gap-3 text-red-800 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Staff Email"
              type="email"
              placeholder="editor@newsportal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 font-semibold text-sm"
                isLoading={isSubmitting}
              >
                <span>Access Newsroom Studio</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>Local Development:</span>
              <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400">Default Seed</span>
            </div>
            <button
              type="button"
              onClick={fillDefaultAdmin}
              className="w-full py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700/60 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fill Default Admin Credentials</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-600 mt-6">
          Connected to News Portal Backend API at http://localhost:8080/api/v1
        </p>
      </div>
    </div>
  );
}
