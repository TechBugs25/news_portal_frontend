'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PenSquare, ExternalLink, PanelLeftClose, PanelLeftOpen, Globe2 } from 'lucide-react';
import HealthBadge from './HealthBadge';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useSidebar } from '@/lib/sidebar-context';
import WorldGlobeModal from '@/components/globe/WorldGlobeModal';

export default function Topbar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [isGlobeModalOpen, setIsGlobeModalOpen] = useState(false);

  function getPageTitle() {
    if (pathname === '/') return 'Newsroom Overview';
    if (pathname === '/world') return '3D Moveable World Navigation';
    if (pathname === '/articles') return 'Editorial Workflow Queue';
    if (pathname === '/articles/new') return 'Article Studio • New Story';
    if (pathname.includes('/edit')) return 'Article Studio • Edit Story';
    if (pathname === '/media') return 'Media Asset Library';
    if (pathname === '/categories') return 'Category Taxonomy';
    if (pathname === '/tags') return 'Tag Management';
    if (pathname === '/users') return 'Staff & Access Roles';
    return 'News Portal CMS';
  }

  return (
    <header className="h-16 px-6 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between sticky top-0 z-20 transition-colors duration-150">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time backend connectivity badge */}
        <HealthBadge />

        {/* Dark / Light Mode Switch */}
        <ThemeToggle />

        {/* Quick 3D World Globe Modal Trigger */}
        <button
          onClick={() => setIsGlobeModalOpen(true)}
          title="Open 3D Moveable World Navigator"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors cursor-pointer"
        >
          <Globe2 className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span className="hidden sm:inline">3D World</span>
        </button>

        {/* Quick Link to Swagger / API */}
        <a
          href="http://localhost:8080/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          title="Open Swagger API documentation"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <span>Swagger Docs</span>
          <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
        </a>

        {/* Quick Create Story button */}
        {pathname !== '/articles/new' && (
          <Link href="/articles/new">
            <Button size="sm" variant="primary">
              <PenSquare className="w-3.5 h-3.5" />
              <span>New Story</span>
            </Button>
          </Link>
        )}
      </div>

      <WorldGlobeModal
        isOpen={isGlobeModalOpen}
        onClose={() => setIsGlobeModalOpen(false)}
      />
    </header>
  );
}
