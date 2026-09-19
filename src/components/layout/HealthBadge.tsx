'use client';

import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { BACKEND_URL } from '@/lib/constants';

interface HealthState {
  isLive: boolean;
  isReady: boolean;
  pgLatency?: number;
  redisLatency?: number;
  uptime?: number;
  lastChecked: Date;
}

export default function HealthBadge() {
  const [health, setHealth] = useState<HealthState>({
    isLive: false,
    isReady: false,
    lastChecked: new Date(),
  });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    async function checkHealth() {
      try {
        const liveRes = await fetch(`${BACKEND_URL}/health/live`, {
          cache: 'no-store',
        });
        const liveData = liveRes.ok ? await liveRes.json() : null;

        const readyRes = await fetch(`${BACKEND_URL}/health/ready`, {
          cache: 'no-store',
        });
        const readyData = readyRes.ok ? await readyRes.json() : null;

        if (!isSubscribed) return;

        const services = readyData?.data?.services || readyData?.services;
        const uptime = liveData?.data?.uptimeSeconds || liveData?.uptimeSeconds;

        setHealth({
          isLive: liveRes.ok,
          isReady: readyRes.ok,
          pgLatency: services?.database?.latencyMs,
          redisLatency: services?.redis?.latencyMs,
          uptime,
          lastChecked: new Date(),
        });
      } catch {
        if (isSubscribed) {
          setHealth({
            isLive: false,
            isReady: false,
            lastChecked: new Date(),
          });
        }
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Check every 15s

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const isHealthy = health.isLive && health.isReady;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
          isHealthy
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/30'
        }`}
      >
        <span className="relative flex h-2 w-2">
          {isHealthy && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          ></span>
        </span>
        <span className="hidden sm:inline font-semibold">
          {isHealthy ? 'Backend Connected' : 'Backend Disconnected'}
        </span>
      </button>

      {/* Popover / Tooltip */}
      {showTooltip && (
        <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 text-xs text-zinc-700 dark:text-zinc-300 space-y-2 animate-in fade-in transition-colors">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1.5 font-semibold text-zinc-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-500" />
              API Diagnostics
            </span>
            <span className="text-[10px] text-zinc-500">
              {health.lastChecked.toLocaleTimeString()}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span>NestJS Server:</span>
              <span className="flex items-center gap-1">
                {health.isLive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                )}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{health.isLive ? 'Online (8080)' : 'Offline'}</span>
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>PostgreSQL 18:</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-300">
                {health.pgLatency !== undefined ? `${health.pgLatency}ms` : '—'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Redis 7 Cache:</span>
              <span className="font-mono font-medium text-zinc-900 dark:text-zinc-300">
                {health.redisLatency !== undefined ? `${health.redisLatency}ms` : '—'}
              </span>
            </div>

            {health.uptime !== undefined && (
              <div className="flex justify-between items-center text-[11px] text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Uptime:</span>
                <span className="font-mono">{Math.floor(health.uptime / 60)} min</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
