'use client';

import { X, Calendar, User, Eye, Clock } from 'lucide-react';
import { Article } from '@/types/article';
import { formatDate, calculateReadingTime, resolveBackendUrl } from '@/lib/utils';
import { STATUS_CONFIG } from '@/lib/constants';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ArticlePreviewModalProps {
  article: Partial<Article> | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ArticlePreviewModal({
  article,
  isOpen,
  onClose,
}: ArticlePreviewModalProps) {
  if (!isOpen || !article) return null;

  const readingTime = calculateReadingTime(article.content || '');
  const statusCfg = article.status ? STATUS_CONFIG[article.status] : null;

  let blocks: any[] = [];
  if (article.content) {
    try {
      if (article.content.startsWith('{') && article.content.endsWith('}')) {
        const parsed = JSON.parse(article.content);
        blocks = parsed.blocks || [];
      } else {
        blocks = [{ type: 'paragraph', data: { text: article.content } }];
      }
    } catch {
      blocks = [{ type: 'paragraph', data: { text: article.content } }];
    }
  }

  function renderBlock(block: any, index: number) {
    switch (block.type) {
      case 'header': {
        const level = block.data?.level || 2;
        const text = block.data?.text || '';
        if (level === 1) return <h1 key={index} className="text-3xl font-bold mt-6 mb-3 text-zinc-950 dark:text-white tracking-tight" dangerouslySetInnerHTML={{ __html: text }} />;
        if (level === 2) return <h2 key={index} className="text-2xl font-semibold mt-5 mb-2 text-zinc-900 dark:text-zinc-100" dangerouslySetInnerHTML={{ __html: text }} />;
        if (level === 3) return <h3 key={index} className="text-xl font-medium mt-4 mb-2 text-zinc-800 dark:text-zinc-200" dangerouslySetInnerHTML={{ __html: text }} />;
        return <h4 key={index} className="text-lg font-medium mt-3 mb-1 text-zinc-700 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: text }} />;
      }
      case 'paragraph':
        return (
          <p
            key={index}
            className="text-base text-zinc-700 dark:text-zinc-300 leading-relaxed my-3"
            dangerouslySetInnerHTML={{ __html: block.data?.text || '' }}
          />
        );
      case 'image': {
        const url = block.data?.file?.url || block.data?.url;
        const caption = block.data?.caption;
        return (
          <figure key={index} className="my-6 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {url && (
              <img
                src={url}
                alt={caption || 'Article photo'}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            )}
            {caption && (
              <figcaption className="p-3 text-xs text-zinc-600 dark:text-zinc-400 text-center bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-200 dark:border-zinc-800/80">
                {caption}
              </figcaption>
            )}
          </figure>
        );
      }
      case 'list': {
        const items = block.data?.items || [];
        const isOrdered = block.data?.style === 'ordered';
        const Tag = isOrdered ? 'ol' : 'ul';
        return (
          <Tag
            key={index}
            className={`my-3 pl-6 space-y-1 text-zinc-700 dark:text-zinc-300 ${isOrdered ? 'list-decimal' : 'list-disc'}`}
          >
            {items.map((item: any, i: number) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{
                  __html: typeof item === 'string' ? item : item.content || '',
                }}
              />
            ))}
          </Tag>
        );
      }
      case 'quote':
        return (
          <blockquote
            key={index}
            className="my-5 border-l-4 border-amber-500 pl-4 italic text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-900/40 py-2 rounded-r-lg"
          >
            <p className="text-lg" dangerouslySetInnerHTML={{ __html: block.data?.text || '' }} />
            {block.data?.caption && (
              <cite className="block text-sm text-zinc-500 dark:text-zinc-400 mt-2 not-italic font-normal">
                — {block.data.caption}
              </cite>
            )}
          </blockquote>
        );
      case 'table': {
        const content = block.data?.content || [];
        const withHeadings = block.data?.withHeadings;
        return (
          <div key={index} className="overflow-x-auto my-5 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <tbody>
                {content.map((row: string[], rIdx: number) => (
                  <tr
                    key={rIdx}
                    className={
                      rIdx === 0 && withHeadings
                        ? 'bg-zinc-100 dark:bg-zinc-800/80 font-semibold text-zinc-900 dark:text-white'
                        : 'border-t border-zinc-200 dark:border-zinc-800/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/40'
                    }
                  >
                    {row.map((cell: string, cIdx: number) => (
                      <td key={cIdx} className="p-3" dangerouslySetInnerHTML={{ __html: cell }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'delimiter':
        return <div key={index} className="my-8 text-center text-zinc-400 dark:text-zinc-600 text-2xl font-serif">***</div>;
      case 'code':
        return (
          <pre key={index} className="my-4 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 font-mono text-sm overflow-x-auto">
            <code>{block.data?.code}</code>
          </pre>
        );
      default:
        return null;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Reader Preview
            </span>
            {article.status && <StatusBadge status={article.status} />}
            {article.isBreaking && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-600 text-white animate-pulse">
                BREAKING
              </span>
            )}
            {article.isFeatured && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                FEATURED
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
          {/* Category */}
          {article.category && (
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
              {article.category.name}
            </span>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-950 dark:text-white tracking-tight leading-tight">
            {article.title || 'Untitled Story'}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-serif border-l-2 border-zinc-300 dark:border-zinc-700 pl-4">
              {article.excerpt}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-y border-zinc-200 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <span>
                {article.author
                  ? `${article.author.firstName} ${article.author.lastName}`
                  : 'Editorial Desk'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <span>{formatDate(article.publishedAt || article.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <span>{readingTime} min read</span>
            </div>
            {article.viewCount !== undefined && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Eye className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                <span>{article.viewCount} views</span>
              </div>
            )}
          </div>

          {/* Featured Image */}
          {article.featuredImageUrl && (
            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-[460px]">
              <img
                src={resolveBackendUrl(article.featuredImageUrl)}
                alt={article.title || 'Cover image'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Blocks Content */}
          <div className="article-body text-zinc-800 dark:text-zinc-200">
            {blocks.length > 0 ? (
              blocks.map((block, i) => renderBlock(block, i))
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 italic">No content blocks available.</p>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-zinc-500">Tags:</span>
              {article.tags.map((tag: any, i) => (
                <span
                  key={tag.id || i}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-400 font-medium"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
