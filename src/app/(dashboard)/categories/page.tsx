'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Folder,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Category, CreateCategoryPayload } from '@/types/category';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/toast-context';
import { slugify } from '@/lib/utils';

export default function CategoriesPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteModalCategory, setDeleteModalCategory] = useState<Category | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [parentId, setParentId] = useState<string>('');

  async function loadCategories(showLoading = false) {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient<Category[] | { data: Category[] }>('/categories');
      const list = Array.isArray(res) ? res : res.data || [];
      setCategories(list);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadCategories();
    });
  }, []);

  function openCreateModal(parent?: Category) {
    setName('');
    setSlug('');
    setDescription('');
    setOrderIndex(0);
    setParentId(parent ? parent.id : '');
    setIsCreateModalOpen(true);
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setOrderIndex(cat.orderIndex || 0);
    setParentId(cat.parent?.id || '');
  }

  async function handleCreateCategory() {
    if (!name.trim()) return;
    setIsProcessing(true);
    try {
      const payload: CreateCategoryPayload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || undefined,
        orderIndex: Number(orderIndex) || 0,
        parentId: parentId || undefined,
      };

      await apiClient('/categories', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setIsCreateModalOpen(false);
      await loadCategories();
      toast.success(`Category "${name.trim()}" created successfully`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleUpdateCategory() {
    if (!editingCategory || !name.trim()) return;
    setIsProcessing(true);
    try {
      await apiClient(`/categories/${editingCategory.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || slugify(name),
          description: description.trim() || undefined,
          orderIndex: Number(orderIndex) || 0,
          parentId: parentId || null,
        }),
      });

      setEditingCategory(null);
      await loadCategories();
      toast.success(`Category "${name.trim()}" updated successfully`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteModalCategory) return;
    const catName = deleteModalCategory.name;
    setIsProcessing(true);
    try {
      await apiClient(`/categories/${deleteModalCategory.id}`, {
        method: 'DELETE',
      });
      setDeleteModalCategory(null);
      await loadCategories();
      toast.success(`Category "${catName}" deleted`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsProcessing(false);
    }
  }

  const canManage = hasRole(UserRole.ADMIN, UserRole.CHIEF_EDITOR);
  const canDelete = hasRole(UserRole.ADMIN);

  // Flatten tree or list all categories for parent selector
  const allFlattenedCategories: Category[] = [];
  function collect(cats: Category[]) {
    for (const c of cats) {
      allFlattenedCategories.push(c);
      if (c.children && c.children.length > 0) {
        collect(c.children);
      }
    }
  }
  collect(categories);

  function renderCategoryItem(category: Category, depth = 0) {
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="space-y-1">
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 shadow-xs dark:shadow-none transition-colors ${
            depth > 0 ? 'ml-6' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <Folder
              className={`w-4 h-4 ${
                depth === 0 ? 'text-amber-500' : 'text-zinc-400 dark:text-zinc-500'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-900 dark:text-white">
                  {category.name}
                </span>
                <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.2 rounded">
                  /{category.slug}
                </span>
                {category.isActive ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    Inactive
                  </span>
                )}
              </div>
              {category.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canManage && depth === 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openCreateModal(category)}
                title="Add sub-category"
                className="text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sub-section</span>
              </Button>
            )}

            {canManage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditModal(category)}
                title="Edit category"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}

            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDeleteModalCategory(category)}
                className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {hasChildren && (
          <div className="space-y-1">
            {category.children!.map((child) =>
              renderCategoryItem(child, depth + 1),
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Category Taxonomy
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Organize the portal into hierarchical editorial desks and news sections.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadCategories(true)}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => openCreateModal()}
              className="gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Category</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category List Tree */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
              <span>Loading category tree...</span>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900/30 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-xs space-y-3 shadow-xs dark:shadow-none">
            <p>No categories defined yet.</p>
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => openCreateModal()}>
                Create first category
              </Button>
            )}
          </div>
        ) : (
          categories.map((cat) => renderCategoryItem(cat))
        )}
      </div>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create News Section / Category"
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. World News, Technology, Sports"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            required
          />

          <Input
            label="URL Slug"
            placeholder="e.g. world-news"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <Textarea
            label="Description"
            placeholder="Editorial focus or scope of this section..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <Select
            label="Parent Category (Optional)"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">None (Top-Level Category)</option>
            {allFlattenedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>

          <Input
            label="Display Order Index"
            type="number"
            value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              onClick={handleCreateCategory}
            >
              Create Category
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={`Edit Category: ${editingCategory?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <Select
            label="Parent Category"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">None (Top-Level Category)</option>
            {allFlattenedCategories
              .filter((c) => c.id !== editingCategory?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </Select>

          <Input
            label="Display Order Index"
            type="number"
            value={orderIndex}
            onChange={(e) => setOrderIndex(Number(e.target.value))}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingCategory(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isProcessing}
              onClick={handleUpdateCategory}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalCategory}
        onClose={() => setDeleteModalCategory(null)}
        title="Delete Category"
        description="Are you sure you want to delete this category? Articles assigned to this category must be reassigned."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-800 dark:text-zinc-300 font-semibold p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {deleteModalCategory?.name} (/{deleteModalCategory?.slug})
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalCategory(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isProcessing}
              onClick={handleDeleteCategory}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
