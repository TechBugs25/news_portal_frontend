import React from 'react';
import { CheckCircle2, Clock, FileEdit, Archive, LucideIcon } from 'lucide-react';
import { ArticleStatus } from '@/types/article';
import { STATUS_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

const STATUS_ICONS: Record<ArticleStatus, LucideIcon> = {
  [ArticleStatus.PUBLISHED]: CheckCircle2,
  [ArticleStatus.PENDING_REVIEW]: Clock,
  [ArticleStatus.DRAFT]: FileEdit,
  [ArticleStatus.ARCHIVED]: Archive,
};

export function StatusBadge({
  status,
  className,
  showIcon = true,
}: {
  status: ArticleStatus;
  className?: string;
  showIcon?: boolean;
}) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-500/10',
    border: 'border-zinc-200 dark:border-zinc-500/20',
  };

  const IconComponent = STATUS_ICONS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors shadow-xs dark:shadow-none',
        config.color,
        config.bg,
        config.border,
        className,
      )}
    >
      {showIcon && IconComponent ? (
        <IconComponent className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
      ) : (
        <svg className="w-1.5 h-1.5 fill-current shrink-0" viewBox="0 0 6 6" aria-hidden="true">
          <circle cx="3" cy="3" r="3" />
        </svg>
      )}
      <span>{config.label}</span>
    </span>
  );
}
