'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Send,
  CheckCircle,
  Archive,
  Eye,
  ArrowLeft,
  Flame,
  Star,
  UploadCloud,
  X,
  Plus,
  Calendar,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { apiClient, uploadMediaAsset } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Article, ArticleStatus, EditorJsOutput } from '@/types/article';
import { Category } from '@/types/category';
import { Tag } from '@/types/tag';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { slugify, resolveBackendUrl } from '@/lib/utils';
import ArticlePreviewModal from '@/components/editor/ArticlePreviewModal';

// Dynamically import EditorJsWrapper with SSR disabled
const EditorJsWrapper = dynamic(
  () => import('@/components/editor/EditorJsWrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[400px] w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 p-8 flex items-center justify-center text-zinc-500 text-sm gap-2 shadow-xs dark:shadow-none">
        <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <span>Loading Editor.js Engine...</span>
      </div>
    ),
  },
);

interface ArticleStudioFormProps {
  initialArticle?: Article;
  mode: 'create' | 'edit';
}

export default function ArticleStudioForm({
  initialArticle,
  mode,
}: ArticleStudioFormProps) {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const toast = useToast();

  // Form State
  const [title, setTitle] = useState(initialArticle?.title || '');
  const [slug, setSlug] = useState(initialArticle?.slug || '');
  const [excerpt, setExcerpt] = useState(initialArticle?.excerpt || '');
  const [content, setContent] = useState(initialArticle?.content || '');
  const [categoryId, setCategoryId] = useState(initialArticle?.category?.id || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialArticle?.tags?.map((t) => t.name) || [],
  );
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    initialArticle?.featuredImageUrl || '',
  );
  const [isFeatured, setIsFeatured] = useState(initialArticle?.isFeatured || false);
  const [isBreaking, setIsBreaking] = useState(initialArticle?.isBreaking || false);
  const [metaTitle, setMetaTitle] = useState(initialArticle?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(
    initialArticle?.metaDescription || '',
  );
  const [scheduledAt, setScheduledAt] = useState(
    initialArticle?.scheduledAt ? initialArticle.scheduledAt.substring(0, 16) : '',
  );
  const [status, setStatus] = useState<ArticleStatus>(
    initialArticle?.status || ArticleStatus.DRAFT,
  );

  // Taxonomy Lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Status & Feedback
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const catRes = await apiClient<any>('/categories');
        const catList = Array.isArray(catRes) ? catRes : catRes.data || [];
        setCategories(catList);
        if (!categoryId && catList.length > 0) {
          setCategoryId(catList[0].id);
        }

        const tagRes = await apiClient<any>('/tags');
        const tagList = Array.isArray(tagRes) ? tagRes : tagRes.data || [];
        setAvailableTags(tagList);
      } catch (err) {
        console.error('Failed to load categories or tags:', err);
      }
    }

    loadTaxonomies();
  }, []);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (mode === 'create' || !slug) {
      setSlug(slugify(val));
    }
  }

  function handleEditorChange(output: EditorJsOutput) {
    setContent(JSON.stringify(output));
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCover(true);
    setFeedback(null);
    try {
      const res = await uploadMediaAsset(file, `${title || 'Article'} cover image`);
      const url = res.url || res.data?.url;
      setFeaturedImageUrl(url);
      setFeedback({ type: 'success', message: 'Cover image uploaded successfully' });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to upload cover image',
      });
    } finally {
      setIsUploadingCover(false);
    }
  }

  function toggleTag(tagName: string) {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  }

  function addNewTag() {
    if (!newTagInput.trim()) return;
    const cleanTag = newTagInput.trim();
    if (!selectedTags.includes(cleanTag)) {
      setSelectedTags([...selectedTags, cleanTag]);
    }
    setNewTagInput('');
  }

  async function handleSubmit(targetStatus: ArticleStatus) {
    if (!title.trim()) {
      const msg = 'Article title is required';
      setFeedback({ type: 'error', message: msg });
      toast.show(msg, 'error');
      return;
    }
    if (!categoryId) {
      const msg = 'Please select a category';
      setFeedback({ type: 'error', message: msg });
      toast.show(msg, 'error');
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const payload: any = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      excerpt: excerpt.trim() || undefined,
      content: content.trim() || JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: title } }] }),
      categoryId,
      tags: selectedTags,
      featuredImageUrl: featuredImageUrl || undefined,
      isFeatured,
      isBreaking,
      status: targetStatus,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
    };

    try {
      if (mode === 'create') {
        const created = await apiClient<Article>('/articles', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        const successMsg = `Story created successfully with status: ${targetStatus}`;
        setFeedback({
          type: 'success',
          message: successMsg,
        });
        toast.show(successMsg, 'success');
        setTimeout(() => {
          router.push(`/articles/${created.id}/edit`);
        }, 800);
      } else if (initialArticle) {
        // Update article details
        await apiClient<Article>(`/articles/${initialArticle.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        // If status changed, transition status
        if (targetStatus !== initialArticle.status) {
          await apiClient<Article>(`/articles/${initialArticle.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: targetStatus }),
          });
          setStatus(targetStatus);
        }

        const successMsg = `Article updated successfully (${targetStatus})`;
        setFeedback({
          type: 'success',
          message: successMsg,
        });
        toast.show(successMsg, 'success');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save article';
      setFeedback({
        type: 'error',
        message: errorMsg,
      });
      toast.show(errorMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  const canPublish = hasRole(UserRole.ADMIN, UserRole.CHIEF_EDITOR);

  const currentPreviewData: Partial<Article> = {
    title,
    excerpt,
    content,
    status,
    featuredImageUrl,
    isBreaking,
    isFeatured,
    category: categories.find((c) => c.id === categoryId),
    tags: selectedTags.map((t) => ({ id: t, name: t, slug: slugify(t), createdAt: '' })),
    author: initialArticle?.author || user || undefined,
    publishedAt: initialArticle?.publishedAt || new Date().toISOString(),
    viewCount: initialArticle?.viewCount || 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Studio Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/articles"
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white shadow-xs dark:shadow-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-amber-600 dark:text-amber-500 font-semibold">
                {mode === 'create' ? 'Author New Story' : 'Story Studio'}
              </span>
              <span className="text-zinc-400 dark:text-zinc-600">•</span>
              <StatusBadge status={status} />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mt-0.5">
              {title || 'Untitled Story'}
            </h2>
          </div>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewOpen(true)}
            className="gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reader Preview</span>
          </Button>

          {/* Save as Draft */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSubmit(ArticleStatus.DRAFT)}
            className="gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Draft</span>
          </Button>

          {/* Submit for Review (Reporter / Editor) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            isLoading={isSaving}
            onClick={() => handleSubmit(ArticleStatus.PENDING_REVIEW)}
            className="gap-1.5 border-blue-300 dark:border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit for Review</span>
          </Button>

          {/* Publish Directly (Editor / Admin) */}
          {canPublish && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={() => handleSubmit(ArticleStatus.PUBLISHED)}
              className="gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Publish Story</span>
            </Button>
          )}

          {/* Archive / Unpublish */}
          {mode === 'edit' && canPublish && status === ArticleStatus.PUBLISHED && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSaving}
              onClick={() => handleSubmit(ArticleStatus.ARCHIVED)}
              className="gap-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4 text-zinc-400 hover:text-zinc-900 dark:hover:text-white" />
          </button>
        </div>
      )}

      {/* Main Studio Grid: Editor Workspace + Metadata Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Editor & Headline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Headline Input */}
          <div className="space-y-1.5 bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs dark:shadow-none transition-colors">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Headline / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter compelling headline..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full text-2xl md:text-3xl font-bold bg-transparent text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 focus:border-amber-500 pb-2 focus:outline-none placeholder-zinc-400 dark:placeholder-zinc-600 transition-colors"
            />
          </div>

          {/* Deck / Excerpt */}
          <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs dark:shadow-none transition-colors">
            <Textarea
              label="Article Deck / Excerpt"
              placeholder="One or two sentence summary displayed on feeds and search cards..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
            />
          </div>

          {/* Editor.js Workspace */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                Editorial Block Studio (Editor.js)
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                Tab / Slash / + to insert blocks
              </span>
            </div>
            <EditorJsWrapper
              initialData={content}
              onChange={handleEditorChange}
            />
          </div>
        </div>

        {/* Right 1 Col: Story Settings & Taxonomy Drawer */}
        <div className="space-y-6 bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 sticky top-20 shadow-xs dark:shadow-none transition-colors">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            Story Metadata & Settings
          </h3>

          {/* Category Selector */}
          <Select
            label="Section / Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>

          {/* Tags Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Taxonomy Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addNewTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500"
              />
              <Button type="button" size="sm" variant="secondary" onClick={addNewTag}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Selected Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-xs font-medium"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="hover:text-amber-950 dark:hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Suggested existing tags */}
            {availableTags.length > 0 && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 block mb-1">
                  Active tags in newsroom:
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {availableTags.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTag(t.name)}
                      className={`text-[10px] px-2 py-0.5 rounded transition-colors ${
                        selectedTags.includes(t.name)
                          ? 'bg-amber-500 text-zinc-950 font-semibold'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Featured Cover Image */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
              Featured Cover Image
            </label>

            {featuredImageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group">
                <img
                  src={resolveBackendUrl(featuredImageUrl)}
                  alt="Cover preview"
                  className="w-full h-36 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImageUrl('')}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-zinc-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl cursor-pointer bg-zinc-50 dark:bg-zinc-900/30 transition-colors">
                <UploadCloud className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mb-2" />
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {isUploadingCover ? 'Uploading photo...' : 'Upload Lead Photography'}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-0.5">
                  JPEG, PNG, WebP up to 10MB
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                  disabled={isUploadingCover}
                />
              </label>
            )}

            <Input
              placeholder="Or paste image URL directly..."
              value={featuredImageUrl}
              onChange={(e) => setFeaturedImageUrl(e.target.value)}
              className="text-xs mt-1"
            />
          </div>

          {/* Newsroom Placement Toggles */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Featured Top Story
                </span>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-800 text-amber-500 focus:ring-amber-500 bg-white dark:bg-zinc-900 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Breaking News Alert
                </span>
              </div>
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-800 text-rose-500 focus:ring-rose-500 bg-white dark:bg-zinc-900 cursor-pointer"
              />
            </label>
          </div>

          {/* SEO & Meta Fields */}
          <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                SEO & Social Meta
              </span>
            </div>
            <Input
              label="Meta Title"
              placeholder="Search engine title..."
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="text-xs"
            />
            <Textarea
              label="Meta Description"
              placeholder="Search engine description..."
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          {/* Publishing Schedule */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Schedule Publish (Optional)</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Reader Preview Modal */}
      <ArticlePreviewModal
        article={currentPreviewData}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
