'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PenSquare,
  Search,
  Eye,
  Trash2,
  RefreshCw,
  Flame,
  Star,
  Clock,
  CheckSquare,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Article, ArticleStatus } from '@/types/article';
import { Category } from '@/types/category';
import { UserRole } from '@/types/user';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { formatTimeAgo } from '@/lib/utils';
import ArticlePreviewModal from '@/components/editor/ArticlePreviewModal';

export default function ArticlesQueuePage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Modals
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [statusModalArticle, setStatusModalArticle] = useState<Article | null>(null);
  const [newStatus, setNewStatus] = useState<ArticleStatus>(ArticleStatus.DRAFT);
  const [deleteModalArticle, setDeleteModalArticle] = useState<Article | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function loadArticles() {
    setIsLoading(true);
    try {
      const res = await apiClient<any>('/articles/editorial/list?limit=50');
      const list = Array.isArray(res) ? res : res.data || [];
      setArticles(list);

      const catRes = await apiClient<any>('/categories');
      const catList = Array.isArray(catRes) ? catRes : catRes.data || [];
      setCategories(catList);
    } catch (err) {
      console.error('Failed to load articles:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  // Filtered list
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Tab filter
      if (activeTab !== 'ALL' && article.status !== activeTab) {
        return false;
      }
      // Category filter
      if (selectedCategory && article.category?.id !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = article.title?.toLowerCase().includes(query);
        const matchExcerpt = article.excerpt?.toLowerCase().includes(query);
        const matchAuthor = `${article.author?.firstName} ${article.author?.lastName}`
          .toLowerCase()
          .includes(query);
        if (!matchTitle && !matchExcerpt && !matchAuthor) return false;
      }
      return true;
    });
  }, [articles, activeTab, selectedCategory, searchQuery]);

  async function handleStatusUpdate() {
    if (!statusModalArticle) return;
    setIsProcessing(true);
    try {
      await apiClient(`/articles/${statusModalArticle.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      // Update local state
      setArticles((prev) =>
        prev.map((a) =>
          a.id === statusModalArticle.id ? { ...a, status: newStatus } : a,
        ),
      );
      toast.show(`Article status updated to ${newStatus.replace('_', ' ')}!`, 'success');
      setStatusModalArticle(null);
    } catch (err: any) {
      toast.show(err.message || 'Failed to update status', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteArticle() {
    if (!deleteModalArticle) return;
    setIsProcessing(true);
    try {
      await apiClient(`/articles/${deleteModalArticle.id}`, {
        method: 'DELETE',
      });
      toast.show(`Article "${deleteModalArticle.title}" deleted.`, 'info');
      setArticles((prev) => prev.filter((a) => a.id !== deleteModalArticle.id));
      setDeleteModalArticle(null);
    } catch (err: any) {
      toast.show(err.message || 'Failed to delete article', 'error');
    } finally {
      setIsProcessing(false);
    }
  }

  const canDelete = hasRole(UserRole.ADMIN, UserRole.CHIEF_EDITOR);
  const canChangeStatus = hasRole(UserRole.ADMIN, UserRole.CHIEF_EDITOR);

  const isAllSelected =
    filteredArticles.length > 0 &&
    filteredArticles.every((a) => selectedIds.has(a.id));

  const isSomeSelected =
    filteredArticles.some((a) => selectedIds.has(a.id)) && !isAllSelected;

  function handleToggleAll() {
    if (isAllSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredArticles.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredArticles.forEach((a) => next.add(a.id));
        return next;
      });
    }
  }

  function handleToggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    const idsToDelete = Array.from(selectedIds);
    try {
      await apiClient('/articles/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: idsToDelete }),
      });
      setArticles((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      toast.show(
        `Successfully deleted ${idsToDelete.length} ${
          idsToDelete.length === 1 ? 'article' : 'articles'
        }.`,
        'success',
      );
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
    } catch (err: any) {
      // Fallback: parallel delete using single endpoints
      try {
        const results = await Promise.allSettled(
          idsToDelete.map((id) =>
            apiClient(`/articles/${id}`, { method: 'DELETE' }),
          ),
        );
        const successfulIds = new Set(
          idsToDelete.filter((_, idx) => results[idx].status === 'fulfilled'),
        );
        if (successfulIds.size > 0) {
          setArticles((prev) => prev.filter((a) => !successfulIds.has(a.id)));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            successfulIds.forEach((id) => next.delete(id));
            return next;
          });
          toast.show(
            `Deleted ${successfulIds.size} of ${idsToDelete.length} articles.`,
            successfulIds.size === idsToDelete.length ? 'success' : 'info',
          );
          if (successfulIds.size === idsToDelete.length) {
            setBulkDeleteModalOpen(false);
          }
        } else {
          toast.show(err.message || 'Failed to delete selected articles', 'error');
        }
      } catch (fallbackErr: any) {
        toast.show(fallbackErr.message || 'Failed to delete selected articles', 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  }

  const tabCounts = {
    ALL: articles.length,
    [ArticleStatus.DRAFT]: articles.filter((a) => a.status === ArticleStatus.DRAFT).length,
    [ArticleStatus.PENDING_REVIEW]: articles.filter(
      (a) => a.status === ArticleStatus.PENDING_REVIEW,
    ).length,
    [ArticleStatus.PUBLISHED]: articles.filter(
      (a) => a.status === ArticleStatus.PUBLISHED,
    ).length,
    [ArticleStatus.ARCHIVED]: articles.filter(
      (a) => a.status === ArticleStatus.ARCHIVED,
    ).length,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Editorial Workflow Queue
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage drafts, review pending stories, and maintain published news catalog.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadArticles}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Link href="/articles/new">
            <Button size="sm" variant="primary" className="gap-1.5">
              <PenSquare className="w-3.5 h-3.5" />
              <span>Write Story</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-px overflow-x-auto">
        {[
          { id: 'ALL', label: 'All Stories', count: tabCounts.ALL },
          { id: ArticleStatus.DRAFT, label: 'Drafts', count: tabCounts[ArticleStatus.DRAFT] },
          {
            id: ArticleStatus.PENDING_REVIEW,
            label: 'Pending Review',
            count: tabCounts[ArticleStatus.PENDING_REVIEW],
            attention: tabCounts[ArticleStatus.PENDING_REVIEW] > 0,
          },
          {
            id: ArticleStatus.PUBLISHED,
            label: 'Published',
            count: tabCounts[ArticleStatus.PUBLISHED],
          },
          {
            id: ArticleStatus.ARCHIVED,
            label: 'Archived',
            count: tabCounts[ArticleStatus.ARCHIVED],
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/5'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  : tab.attention
                  ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs dark:shadow-none transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stories by headline, deck, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        <div className="w-full sm:w-56 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-200 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500/80"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Selection Actions Bar */}
      {canDelete && selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 rounded-xl shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 transition-all">
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
              <strong className="font-bold text-amber-600 dark:text-amber-400">
                {selectedIds.size}
              </strong>{' '}
              {selectedIds.size === 1 ? 'story' : 'stories'} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Article Table */}
      <div className="rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs dark:shadow-none transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
              <tr>
                {canDelete && (
                  <th className="py-3.5 px-4 w-12 text-center align-middle">
                    <input
                      type="checkbox"
                      aria-label="Select all visible stories"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleToggleAll}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 accent-amber-500 focus:ring-amber-500/20 bg-white dark:bg-zinc-900 cursor-pointer transition-colors"
                      title={
                        isAllSelected
                          ? 'Deselect all visible stories'
                          : 'Select all visible stories'
                      }
                    />
                  </th>
                )}
                <th className="py-3.5 px-4 text-left align-middle">Headline / Story</th>
                <th className="py-3.5 px-4 text-center align-middle">Status</th>
                <th className="py-3.5 px-4 text-left align-middle">Section</th>
                <th className="py-3.5 px-4 text-left align-middle">Author</th>
                <th className="py-3.5 px-4 text-center align-middle">Views</th>
                <th className="py-3.5 px-4 text-center align-middle">Updated</th>
                <th className="py-3.5 px-4 text-right align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="py-12 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                      <span>Loading editorial records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={canDelete ? 8 : 7} className="py-12 text-center text-zinc-500">
                    No articles found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => {
                  const isSelected = selectedIds.has(article.id);
                  return (
                    <tr
                      key={article.id}
                      className={`transition-colors group ${
                        isSelected
                          ? 'bg-amber-500/10 dark:bg-amber-500/10 hover:bg-amber-500/15 dark:hover:bg-amber-500/15'
                          : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30'
                      }`}
                    >
                      {canDelete && (
                        <td className="py-3 px-4 text-center align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select article ${article.title}`}
                            checked={isSelected}
                            onChange={() => handleToggleRow(article.id)}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-amber-500 accent-amber-500 focus:ring-amber-500/20 bg-white dark:bg-zinc-900 cursor-pointer transition-colors"
                          />
                        </td>
                      )}
                    <td className="py-3 px-4 min-w-[280px] max-w-[400px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {article.isBreaking && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded border border-rose-200 dark:border-rose-800/60">
                              <Flame className="w-2.5 h-2.5" />
                              BREAKING
                            </span>
                          )}
                          {article.isFeatured && (
                            <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-500/30">
                              <Star className="w-2.5 h-2.5" />
                              FEATURED
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/articles/${article.id}/edit`}
                          className="font-semibold text-zinc-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1 text-sm"
                        >
                          {article.title}
                        </Link>
                        {article.excerpt && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                            {article.excerpt}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                      <StatusBadge status={article.status} />
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300 align-middle">
                      {article.category?.name || 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-zinc-700 dark:text-zinc-300 align-middle">
                      {article.author
                        ? `${article.author.firstName} ${article.author.lastName}`
                        : 'Staff'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-center font-mono text-zinc-600 dark:text-zinc-400 align-middle">
                      {Number(article.viewCount || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-center text-zinc-500 dark:text-zinc-400 align-middle">
                      {formatTimeAgo(article.updatedAt)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right align-middle">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPreviewArticle(article)}
                          title="Preview Story"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {canChangeStatus && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setStatusModalArticle(article);
                              setNewStatus(article.status);
                            }}
                            title="Quick Change Editorial Status"
                          >
                            <Clock className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                          </Button>
                        )}

                        <Link href={`/articles/${article.id}/edit`}>
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                        </Link>

                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteModalArticle(article)}
                            className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Reader Preview Modal */}
    <ArticlePreviewModal
      article={previewArticle}
      isOpen={!!previewArticle}
      onClose={() => setPreviewArticle(null)}
    />

    {/* Status Transition Modal */}
    <Modal
      isOpen={!!statusModalArticle}
      onClose={() => setStatusModalArticle(null)}
      title="Update Editorial Workflow Status"
      description={`Modify the status of: "${statusModalArticle?.title}"`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <Select
          label="Select New Status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as ArticleStatus)}
        >
          <option value={ArticleStatus.DRAFT}>Draft (Working Copy)</option>
          <option value={ArticleStatus.PENDING_REVIEW}>
            Pending Review (Ready for Editor)
          </option>
          <option value={ArticleStatus.PUBLISHED}>
            Published (Live on Portal)
          </option>
          <option value={ArticleStatus.ARCHIVED}>
            Archived (Hidden from Portal)
          </option>
        </Select>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusModalArticle(null)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isProcessing}
            onClick={handleStatusUpdate}
          >
            Apply Status
          </Button>
        </div>
      </div>
    </Modal>

    {/* Delete Single Article Modal */}
    <Modal
      isOpen={!!deleteModalArticle}
      onClose={() => setDeleteModalArticle(null)}
      title="Delete Story Permanently"
      description="Are you sure you want to delete this article? This action cannot be undone."
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {deleteModalArticle?.title}
        </p>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalArticle(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isProcessing}
            onClick={handleDeleteArticle}
          >
            Confirm Delete
          </Button>
        </div>
      </div>
    </Modal>

    {/* Multiple Delete Confirmation Modal */}
    <Modal
      isOpen={bulkDeleteModalOpen}
      onClose={() => !isProcessing && setBulkDeleteModalOpen(false)}
      title={`Delete ${selectedIds.size} Selected ${
        selectedIds.size === 1 ? 'Article' : 'Articles'
      }`}
      description="Are you sure you want to delete these articles? This action cannot be undone."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300">
          <p className="font-semibold flex items-center gap-1.5">
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            Permanent Deletion Warning
          </p>
          <p className="mt-1 opacity-90">
            The selected {selectedIds.size} stories and their editorial records will be permanently removed from the database and public feeds.
          </p>
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Selected Articles ({selectedIds.size})
          </span>
          <div className="max-h-56 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-900/50">
            {articles
              .filter((a) => selectedIds.has(a.id))
              .map((a) => (
                <div
                  key={a.id}
                  className="py-2 px-2 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-white truncate">
                      {a.title}
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {a.category?.name || 'Unassigned'} •{' '}
                      {a.author
                        ? `${a.author.firstName} ${a.author.lastName}`
                        : 'Staff'}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <Button
            variant="outline"
            size="sm"
            disabled={isProcessing}
            onClick={() => setBulkDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isProcessing}
            onClick={handleBulkDelete}
            className="gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              Delete {selectedIds.size} {selectedIds.size === 1 ? 'Article' : 'Articles'}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  </div>
);
}
