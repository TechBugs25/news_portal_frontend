import { ArticleStatus } from '@/types/article';
import { UserRole } from '@/types/user';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

export const TOKEN_STORAGE_KEY = 'news_portal_admin_token';
export const USER_STORAGE_KEY = 'news_portal_admin_user';

export const STATUS_CONFIG: Record<
  ArticleStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  [ArticleStatus.DRAFT]: {
    label: 'Draft',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
  },
  [ArticleStatus.PENDING_REVIEW]: {
    label: 'Pending Review',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    border: 'border-blue-200 dark:border-blue-500/20',
  },
  [ArticleStatus.PUBLISHED]: {
    label: 'Published',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    border: 'border-emerald-200 dark:border-emerald-500/20',
  },
  [ArticleStatus.ARCHIVED]: {
    label: 'Archived',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-500/10',
    border: 'border-zinc-200 dark:border-zinc-500/20',
  },
};

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: string; bg: string; border: string }
> = {
  [UserRole.ADMIN]: {
    label: 'Administrator',
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/20',
  },
  [UserRole.CHIEF_EDITOR]: {
    label: 'Chief Editor',
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    border: 'border-purple-200 dark:border-purple-500/20',
  },
  [UserRole.REPORTER]: {
    label: 'Reporter',
    color: 'text-sky-700 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-500/10',
    border: 'border-sky-200 dark:border-sky-500/20',
  },
  [UserRole.READER]: {
    label: 'Reader',
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-500/10',
    border: 'border-zinc-200 dark:border-zinc-500/20',
  },
};

export interface NavItemDef {
  label: string;
  href: string;
  roles: UserRole[];
  highlight?: boolean;
}

export const NAV_ITEMS: NavItemDef[] = [
  {
    label: 'Dashboard',
    href: '/',
    roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
  },
  {
    label: 'Editorial Queue',
    href: '/articles',
    roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
  },
  {
    label: 'Write New Story',
    href: '/articles/new',
    highlight: true,
    roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
  },
  {
    label: 'Media Assets',
    href: '/media',
    roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
  },
  {
    label: 'Categories',
    href: '/categories',
    roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR],
  },
  {
    label: 'Tags',
    href: '/tags',
    roles: [UserRole.ADMIN, UserRole.CHIEF_EDITOR, UserRole.REPORTER],
  },
  {
    label: 'Staff & Roles',
    href: '/users',
    roles: [UserRole.ADMIN],
  },
];
