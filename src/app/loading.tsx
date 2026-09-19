import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-3 border-amber-500/20 border-t-amber-500 animate-spin" />
        <div className="w-5 h-5 rounded-full bg-amber-500/10 absolute" />
      </div>
      <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase font-mono animate-pulse">
        Loading Newsroom Feed...
      </p>
    </div>
  );
}
