'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Globe2, ExternalLink } from 'lucide-react';
import WorldGlobe3D from './WorldGlobe3D';
import { ContinentNode } from './globe-data';

interface WorldGlobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContinent?: (continent: ContinentNode) => void;
}

const emptySubscribe = () => () => {};

export default function WorldGlobeModal({
  isOpen,
  onClose,
  onSelectContinent,
}: WorldGlobeModalProps) {
  const router = useRouter();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[88vh] max-h-[840px] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Globe2 className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                <span>3D Moveable World Navigation</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  7 Continents • 7 Desks
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Drag to freely rotate the globe. Click any continent beacon to navigate directly to that sidebar section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                router.push('/world');
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 transition-colors cursor-pointer"
              title="Open full dedicated page"
            >
              <span>Full Page Deck</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close 3D World (Esc)"
              aria-label="Close 3D World"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D Globe Body */}
        <div className="flex-1 w-full relative min-h-0 bg-zinc-950">
          <WorldGlobe3D
            height="100%"
            className="border-none rounded-none shadow-none"
            onSelectContinent={(c) => {
              onSelectContinent?.(c);
              onClose();
              router.push(c.route);
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
