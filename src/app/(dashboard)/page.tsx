'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  CheckCircle2,
  Clock,
  FileEdit,
  Eye,
  ArrowUpRight,
  PenSquare,
  Activity,
  Layers,
  Flame,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { BACKEND_URL } from '@/lib/constants';
import { Article, ArticleStatus } from '@/types/article';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { formatTimeAgo } from '@/lib/utils';
import ArticlePreviewModal from '@/components/editor/ArticlePreviewModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [healthInfo, setHealthInfo] = useState<any>(null);
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const res = await apiClient<any>('/articles/editorial/list?limit=20');
        const list = Array.isArray(res) ? res : res.data || [];
        setArticles(list);

        const readyRes = await fetch(`${BACKEND_URL}/health/ready`);
        if (readyRes.ok) {
          const readyJson = await readyRes.json();
          setHealthInfo(readyJson.data || readyJson);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const totalCount = articles.length;
  const publishedCount = articles.filter(
    (a) => a.status === ArticleStatus.PUBLISHED,
  ).length;
  const pendingCount = articles.filter(
    (a) => a.status === ArticleStatus.PENDING_REVIEW,
  ).length;
  const draftCount = articles.filter(
    (a) => a.status === ArticleStatus.DRAFT,
  ).length;
  const totalViews = articles.reduce(
    (acc, a) => acc + Number(a.viewCount || 0),
    0,
  );

  const recentArticles = articles.slice(0, 6);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-zinc-100 via-zinc-50 to-white dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-900/50 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden transition-colors shadow-xs dark:shadow-none">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Newsroom Command
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">•</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Welcome back, {user?.firstName || 'Journalist'}
          </h2>
          <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
            Monitor breaking headlines, review pending draft submissions, and publish stories.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <Link href="/articles/new">
            <Button variant="primary" size="md" className="gap-2 shadow-lg shadow-amber-500/20">
              <PenSquare className="w-4 h-4" />
              <span>Draft New Story</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Stories</span>
            <Newspaper className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {isLoading ? '—' : totalCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-medium uppercase tracking-wider">Published</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {isLoading ? '—' : publishedCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-xs font-medium uppercase tracking-wider">In Review</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {isLoading ? '—' : pendingCount}
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-500/30">
                Needs Attention
              </span>
            )}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
            <FileEdit className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {isLoading ? '—' : draftCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between col-span-2 md:col-span-1 shadow-xs dark:shadow-none transition-colors">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Views</span>
            <Eye className="w-4 h-4" />
          </div>
          <div className="mt-3">
            <span className="text-2xl md:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {isLoading ? '—' : totalViews.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Backend Diagnostics & Recent Submissions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Articles Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>Recent Editorial Queue</span>
            </h3>
            <Link
              href="/articles"
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>View full queue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/60 shadow-xs dark:shadow-none transition-colors">
            {isLoading ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Loading recent queue...
              </div>
            ) : recentArticles.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No articles found in the newsroom.</p>
                <Link href="/articles/new">
                  <Button size="sm" variant="outline">
                    Write your first story
                  </Button>
                </Link>
              </div>
            ) : (
              recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={article.status} />
                      {article.category && (
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                          {article.category.name}
                        </span>
                      )}
                      {article.isBreaking && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/60">
                          <Flame className="w-2.5 h-2.5" />
                          BREAKING
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/articles/${article.id}/edit`}
                      className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors block truncate"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      By {article.author?.firstName} {article.author?.lastName} • Updated{' '}
                      {formatTimeAgo(article.updatedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPreviewArticle(article)}
                      title="Preview story layout"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Link href={`/articles/${article.id}/edit`}>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Infrastructure & Shortcuts */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Infrastructure Status</span>
          </h3>

          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 space-y-4 text-xs shadow-xs dark:shadow-none transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
              <span className="text-zinc-600 dark:text-zinc-400">NestJS Core API:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-medium border border-emerald-500/20">
                Port 8080 • Ready
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
              <span className="text-zinc-600 dark:text-zinc-400">PostgreSQL 18:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">
                {healthInfo?.services?.database
                  ? `${healthInfo.services.database.status.toUpperCase()} (${healthInfo.services.database.latencyMs}ms)`
                  : 'Active'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
              <span className="text-zinc-600 dark:text-zinc-400">Redis 7 Cache:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">
                {healthInfo?.services?.redis
                  ? `${healthInfo.services.redis.status.toUpperCase()} (${healthInfo.services.redis.latencyMs}ms)`
                  : 'Active'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
              <span className="text-zinc-600 dark:text-zinc-400">File Storage:</span>
              <span className="font-mono text-zinc-900 dark:text-zinc-200">
                Local Disk (/uploads)
              </span>
            </div>

            <div className="pt-2">
              <a
                href="http://localhost:8080/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-transparent transition-colors"
              >
                Inspect OpenAPI / Swagger
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Reader Preview Modal */}
      <ArticlePreviewModal
        article={previewArticle}
        isOpen={!!previewArticle}
        onClose={() => setPreviewArticle(null)}
      />
    </div>
  );
}
