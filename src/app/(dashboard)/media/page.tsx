'use client';

import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
} from 'lucide-react';
import { apiClient, uploadMediaAsset } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Media } from '@/types/media';
import { UserRole } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatBytes, formatDate, resolveBackendUrl } from '@/lib/utils';

export default function MediaLibraryPage() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload State
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Inspector / Detail Modal
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteModalMedia, setDeleteModalMedia] = useState<Media | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadMedia(showLoading = false) {
    if (showLoading) setIsLoading(true);
    try {
      const res = await apiClient<Media[] | { data: Media[] }>('/media');
      const list = Array.isArray(res) ? res : res.data || [];
      setMediaList(list);
    } catch (err) {
      console.error('Failed to load media assets:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      loadMedia();
    });
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await uploadMediaAsset(file, uploadCaption.trim() || undefined);
      const mediaItem = uploaded;
      setMediaList((prev) => [mediaItem, ...prev]);
      setUploadCaption('');
      toast.show('Media asset uploaded successfully!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'File upload failed';
      setUploadError(msg);
      toast.show(msg, 'error');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  }

  function handleCopyUrl(url: string, id: string) {
    const fullUrl = resolveBackendUrl(url);
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.show('Media asset URL copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleDeleteMedia() {
    if (!deleteModalMedia) return;
    setIsDeleting(true);
    try {
      await apiClient(`/media/${deleteModalMedia.id}`, { method: 'DELETE' });
      setMediaList((prev) => prev.filter((m) => m.id !== deleteModalMedia.id));
      setDeleteModalMedia(null);
      if (selectedMedia?.id === deleteModalMedia.id) {
        setSelectedMedia(null);
      }
      toast.show('Media asset deleted.', 'info');
    } catch (err: unknown) {
      toast.show(err instanceof Error ? err.message : 'Failed to delete media', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  const canDelete = hasRole(UserRole.ADMIN, UserRole.CHIEF_EDITOR);

  const filteredMedia = mediaList.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.originalName?.toLowerCase().includes(q) ||
      m.caption?.toLowerCase().includes(q) ||
      m.filename?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Media Asset Library
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Store, preview, and manage editorial photography, graphics, and infographics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadMedia(true)}
            isLoading={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Upload Drop Area */}
      <div className="bg-white dark:bg-zinc-900/40 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs dark:shadow-none space-y-4 transition-colors">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-300 uppercase tracking-wider">
          Upload New Photography
        </h3>

        {uploadError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-lg text-xs text-red-800 dark:text-red-300">
            {uploadError}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Input
              placeholder="Photo caption or credits (optional)..."
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="text-xs"
            />
          </div>

          <label className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold cursor-pointer transition-colors shadow-sm shadow-amber-500/20 shrink-0">
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'Uploading asset...' : 'Choose Image File'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Search & Statistics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assets by file name or caption..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 rounded-lg border border-zinc-300 dark:border-zinc-800 focus:outline-none focus:border-amber-500/80"
          />
        </div>

        <span className="text-xs text-zinc-500 font-mono">
          Showing {filteredMedia.length} of {mediaList.length} media assets
        </span>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-zinc-500 text-xs">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span>Loading media catalog...</span>
          </div>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-zinc-900/20 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 text-zinc-500 text-xs shadow-xs dark:shadow-none">
          No media assets found. Upload photos above to populate the catalog.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((media) => {
            const fullUrl = resolveBackendUrl(media.url);
            const isCopied = copiedId === media.id;

            return (
              <div
                key={media.id}
                className="group relative rounded-xl overflow-hidden bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-xs dark:shadow-none transition-all flex flex-col"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 cursor-pointer relative"
                  onClick={() => setSelectedMedia(media)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fullUrl}
                    alt={media.caption || media.originalName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-white px-2 py-1 bg-black/60 rounded-md backdrop-blur-sm">
                      Inspect
                    </span>
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <p
                      className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate cursor-pointer hover:text-amber-600 dark:hover:text-amber-400"
                      onClick={() => setSelectedMedia(media)}
                      title={media.originalName}
                    >
                      {media.originalName}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      {formatBytes(media.sizeBytes)} • {media.mimeType.split('/')[1]?.toUpperCase()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(media.url, media.id)}
                      className={`flex items-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                        isCopied
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400'
                      }`}
                      title="Copy asset URL to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteModalMedia(media)}
                        className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete asset"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Detail Modal */}
      <Modal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        title={selectedMedia?.originalName || 'Media Inspector'}
        maxWidth="2xl"
      >
        {selectedMedia && (
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-[400px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveBackendUrl(selectedMedia.url)}
                alt={selectedMedia.caption || selectedMedia.originalName}
                className="max-h-[400px] w-auto object-contain"
              />
            </div>

            {selectedMedia.caption && (
              <p className="text-xs text-zinc-700 dark:text-zinc-300 italic p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                &ldquo;{selectedMedia.caption}&rdquo;
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">Dimensions / File Size:</span>
                <span className="font-mono text-zinc-900 dark:text-white font-medium">
                  {formatBytes(selectedMedia.sizeBytes)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">Uploaded By:</span>
                <span className="text-zinc-900 dark:text-white font-medium">
                  {selectedMedia.uploader
                    ? `${selectedMedia.uploader.firstName} ${selectedMedia.uploader.lastName}`
                    : 'Newsroom Staff'}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">Upload Date:</span>
                <span className="text-zinc-900 dark:text-white font-medium">
                  {formatDate(selectedMedia.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block">Content Type:</span>
                <span className="font-mono text-zinc-900 dark:text-white font-medium">
                  {selectedMedia.mimeType}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block">
                Direct URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={resolveBackendUrl(selectedMedia.url)}
                  className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-300 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono select-all"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleCopyUrl(selectedMedia.url, selectedMedia.id)}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === selectedMedia.id ? 'Copied' : 'Copy'}</span>
                </Button>
                <a
                  href={resolveBackendUrl(selectedMedia.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteModalMedia}
        onClose={() => setDeleteModalMedia(null)}
        title="Delete Media Asset"
        description="Are you sure you want to delete this media file? Any articles embedding this asset may have broken images."
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-800 dark:text-zinc-300 font-semibold p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 truncate">
            {deleteModalMedia?.originalName}
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalMedia(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteMedia}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
