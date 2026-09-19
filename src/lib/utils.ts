import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import { BACKEND_URL } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  dateString?: string | null,
  formatPattern: string = 'MMM dd, yyyy HH:mm',
): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatPattern);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return dateString;
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function resolveBackendUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes <= 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateReadingTime(content: string): number {
  try {
    let text = content;
    // Check if it's Editor.js JSON
    if (content.startsWith('{') && content.endsWith('}')) {
      const parsed = JSON.parse(content);
      if (parsed.blocks && Array.isArray(parsed.blocks)) {
        text = parsed.blocks
          .map((b: any) => {
            if (b.data?.text) return b.data.text;
            if (b.data?.items) return b.data.items.join(' ');
            return '';
          })
          .join(' ');
      }
    }
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  } catch {
    return 2;
  }
}
