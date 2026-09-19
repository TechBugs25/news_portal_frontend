'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { cn } from '@/lib/utils';

export default function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'relative flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer select-none',
        isDark
          ? 'bg-zinc-900 border-zinc-800 text-amber-400 hover:text-amber-300 hover:bg-zinc-800 hover:border-zinc-700'
          : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-200 hover:border-zinc-400',
        className,
      )}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle visual theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0 text-indigo-600" />
      )}
    </button>
  );
}
