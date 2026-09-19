'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled newsroom client error:', error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-zinc-900/60 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Editorial Operation Interrupted
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            An unexpected error occurred while rendering the editorial workspace. Our session crash recovery is active.
          </p>
          {error?.message && (
            <p className="text-[11px] font-mono p-2 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-rose-600 dark:text-rose-400 border border-zinc-200 dark:border-zinc-700/60 truncate">
              {error.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="primary" size="sm" onClick={() => reset()} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Retry Operation</span>
          </Button>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
