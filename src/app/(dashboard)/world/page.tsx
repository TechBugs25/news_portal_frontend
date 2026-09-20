'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe2,
  Radio,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import WorldGlobe3D from '@/components/globe/WorldGlobe3D';
import { CONTINENTS } from '@/components/globe/globe-data';
import { Button } from '@/components/ui/Button';

export default function WorldNavigationPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Globe2 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white font-serif">
              3D Moveable World Navigation
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Interactive spherical newsroom command center. Rotate the world, zoom, and select any continent to explore its linked news desk.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Telemetry Online</span>
          </div>
          <Link href="/">
            <Button size="sm" variant="outline" className="gap-1.5">
              <span>Standard View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 3D World Interactive Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
        <WorldGlobe3D height="620px" />
      </div>

      {/* Continent to Sidebar Item Legend Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Continent Editorial Directory</span>
          </h2>
          <span className="text-xs text-zinc-500">
            7 Continents • Linked to Newsroom Sidebar Desks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CONTINENTS.map((continent) => (
            <div
              key={continent.id}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 group shadow-xs dark:shadow-none"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border"
                    style={{
                      borderColor: `${continent.color}40`,
                      backgroundColor: `${continent.color}15`,
                      color: continent.glowColor,
                    }}
                  >
                    {continent.name}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                    {continent.lat > 0 ? `${continent.lat}°N` : `${Math.abs(continent.lat)}°S`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {continent.sidebarTitle}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {continent.description}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                <div className="text-[11px]">
                  <span className="text-zinc-400 block text-[10px]">{continent.stats.label}</span>
                  <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">
                    {continent.stats.value}
                  </span>
                </div>

                <Link href={continent.route}>
                  <Button size="sm" variant="secondary" className="gap-1 text-xs">
                    <span>Open Desk</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}

          {/* Real-time Telemetry Arcs Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-zinc-900/40 border border-cyan-500/20 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Data Arcs
              </span>
              <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Global News Dispatch
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Light pulses travel across Great Circle Bézier splines connecting bureaus in North America, Europe, Asia, Africa, and Oceania in real time.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/30 text-xs text-cyan-300 font-mono flex items-center justify-between">
              <span>Synchronized:</span>
              <span className="font-bold">60 FPS WebGL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
