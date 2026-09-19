'use client';

import React, { useEffect, useState } from 'react';
import { Hash, Plus, Trash2, RefreshCw, Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Tag } from '@/types/tag';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate, slugify } from '@/lib/utils';

export default function TagsPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Tag state
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete modal
  const [deleteModalTag, setDeleteModalTag] = useState<Tag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadTags() {
    setIsLoading(true);
    try {
      const res = await apiClient<any>('/tags');
      const list = Array.isArray(res) ? res : res.data || [];
      setTags(list);
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const created = await apiClient<Tag>('/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: newTagName.trim(),
          slug: newTagSlug.trim() || slugify(newTagName),
        }),
      });

      toast.show(`Tag "${created.name}" created successfully!`, 'success');
      setTags((prev) => [created, ...prev]);
      setNewTagName('');
      setNewTagSlug('');
    } catch (err: any) {
      toast.show(err.message || 'Failed to create tag', 'error');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteTag() {
    if (!deleteModalTag) return;
    setIsDeleting(true);
    try {
      await apiClient(`/tags/${deleteModalTag.id}`, { method: 'DELETE' });
      toast.show(`Tag "${deleteModalTag.name}" deleted successfully.`, 'info');
      setTags((prev) => prev.filter((t) => t.id !== deleteModalTag.id));
      setDeleteModalTag(null);
    } catch (err: any) {
      toast.show(err.message || 'Failed to delete tag', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  const canDelete = hasRole(UserRole.ADMIN);

  const filteredTags = tags.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Taxonomy Tags
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Cross-cutting topical keywords and trending tags across news articles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={loadTags}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Add Tag Form */}
      <form
        onSubmit={handleCreateTag}
        className="bg-white dark:bg-zinc-900/40 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs dark:shadow-none space-y-3 transition-colors"
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-300">
          Provision New Tag
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Tag label (e.g. Artificial Intelligence, Climate)"
              value={newTagName}
              onChange={(e) => {
                setNewTagName(e.target.value);
                if (!newTagSlug) setNewTagSlug(slugify(e.target.value));
              }}
              required
              className="text-xs"
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              placeholder="Custom slug (optional)"
              value={newTagSlug}
              onChange={(e) => setNewTagSlug(e.target.value)}
              className="text-xs"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="primary"
            isLoading={isCreating}
            className="w-full sm:w-auto shrink-0 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Tag</span>
          </Button>
        </div>
      </form>

      {/* Search & Tags List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500/80"
            />
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredTags.length} tags registered
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <span>Loading tags...</span>
            </div>
          </div>
        ) : filteredTags.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs shadow-xs dark:shadow-none">
            No tags found matching query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredTags.map((tag) => (
              <div
                key={tag.id}
                className="p-3 rounded-xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs dark:shadow-none transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-zinc-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {tag.name}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 truncate">
                      /{tag.slug}
                    </p>
                  </div>
                </div>

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeleteModalTag(tag)}
                    className="p-1.5 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Tag Modal */}
      <Modal
        isOpen={!!deleteModalTag}
        onClose={() => setDeleteModalTag(null)}
        title="Delete Taxonomy Tag"
        description="Are you sure you want to delete this tag? It will be removed from all attached stories."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-800 dark:text-zinc-300 font-semibold p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            #{deleteModalTag?.name} (/{deleteModalTag?.slug})
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalTag(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteTag}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
