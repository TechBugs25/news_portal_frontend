'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Newspaper,
  PenSquare,
  Image as ImageIcon,
  FolderTree,
  Hash,
  Users,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSidebar } from '@/lib/sidebar-context';
import { ROLE_CONFIG } from '@/lib/constants';
import { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
    },
    {
      label: 'Editorial Queue',
      href: '/articles',
      icon: Newspaper,
      roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
    },
    {
      label: 'Write New Story',
      href: '/articles/new',
      icon: PenSquare,
      highlight: true,
      roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
    },
    {
      label: 'Media Assets',
      href: '/media',
      icon: ImageIcon,
      roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
    },
    {
      label: 'Categories',
      href: '/categories',
      icon: FolderTree,
      roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR],
    },
    {
      label: 'Tags',
      href: '/tags',
      icon: Hash,
      roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
    },
    {
      label: 'Staff & Roles',
      href: '/users',
      icon: Users,
      roles: [UserRole.ADMIN],
    },
  ];

  const roleConfig = user?.role ? ROLE_CONFIG[user.role] : null;

  return (
    <aside
      className={cn(
        'bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col h-screen sticky top-0 select-none z-30 transition-all duration-300 ease-in-out shrink-0',
        isCollapsed ? 'w-20' : 'w-64',
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'border-b border-zinc-200 dark:border-zinc-800/80 flex items-center transition-all duration-300',
          isCollapsed ? 'p-3 flex-col gap-3 justify-center' : 'p-5 justify-between',
        )}
      >
        <Link href="/" className="flex items-center gap-2.5 min-w-0" title="News Portal Home">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-serif font-black text-zinc-950 text-xl shadow-md shadow-amber-500/20 shrink-0">
            N
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap animate-in fade-in duration-200">
              <span className="font-serif font-bold tracking-tight text-zinc-900 dark:text-white block text-sm leading-none">
                NEWS PORTAL
              </span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-amber-600 dark:text-amber-500/90 mt-0.5 block">
                Newsroom CMS
              </span>
            </div>
          )}
        </Link>

        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0',
            isCollapsed && 'mt-1',
          )}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {!isCollapsed ? (
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Newsroom Core
          </div>
        ) : (
          <div className="my-2 border-t border-zinc-200 dark:border-zinc-800/80 mx-2" />
        )}

        {navItems
          .filter((item) => !item.roles || hasRole(...item.roles))
          .map((item) => {
            const isActive = (() => {
              if (item.href === '/') {
                return pathname === '/';
              }
              if (item.href === '/articles') {
                return (
                  pathname === '/articles' ||
                  (pathname.startsWith('/articles/') && pathname !== '/articles/new')
                );
              }
              if (item.href === '/articles/new') {
                return pathname === '/articles/new';
              }
              return pathname === item.href || pathname.startsWith(`${item.href}/`);
            })();

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'relative rounded-xl text-xs font-medium transition-all group flex items-center',
                  isCollapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3 py-2.5',
                  isActive
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-semibold'
                    : item.highlight
                    ? 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200',
                )}
              >
                <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
                  <Icon
                    className={cn(
                      'shrink-0 transition-colors',
                      isCollapsed ? 'w-5 h-5' : 'w-4 h-4',
                      isActive
                        ? 'text-amber-600 dark:text-amber-400'
                        : item.highlight
                        ? 'text-rose-500 dark:text-rose-400'
                        : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200',
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!isCollapsed && item.highlight && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                )}

                {!isCollapsed && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500/60 shrink-0" />
                )}

                {/* Floating tooltip on collapsed hover */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-zinc-700/50 dark:border-zinc-300">
                    {item.label}
                    {item.highlight && ' • New'}
                  </div>
                )}
              </Link>
            );
          })}
      </nav>

      {/* User & Session Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950">
        {user ? (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={`${user.firstName} ${user.lastName} (${roleConfig?.label || user.role})`}
                className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-white shrink-0 cursor-default"
              >
                {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              <button
                onClick={logout}
                title="Sign out of Newsroom"
                aria-label="Sign out of Newsroom"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-semibold text-xs text-zinc-800 dark:text-white shrink-0">
                  {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  {roleConfig && (
                    <span
                      className={cn(
                        'inline-block text-[10px] px-1.5 py-0.2 rounded font-medium border',
                        roleConfig.color,
                        roleConfig.bg,
                        roleConfig.border,
                      )}
                    >
                      {roleConfig.label}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of Newsroom"
                aria-label="Sign out of Newsroom"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
