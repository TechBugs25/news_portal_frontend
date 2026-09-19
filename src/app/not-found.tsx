'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-2xl font-bold font-serif shadow-lg shadow-amber-500/10">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Editorial Story Not Found
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The requested article, media asset, or administrative section might have been moved, deleted, or reassigned in the newsroom taxonomy.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/">
            <Button variant="primary" size="sm" className="gap-2">
              <Home className="w-4 h-4" />
              <span>Newsroom Dashboard</span>
            </Button>
          </Link>
          <Link href="/articles">
            <Button variant="outline" size="sm" className="gap-2">
              <Newspaper className="w-4 h-4" />
              <span>Editorial Queue</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
