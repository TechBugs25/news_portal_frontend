'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Article } from '@/types/article';
import ArticleStudioForm from '@/components/articles/ArticleStudioForm';

export default function EditArticlePage() {
  const params = useParams();
  const id = params?.id as string;
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchArticle() {
      try {
        let res: Article;
        try {
          res = await apiClient<Article>(`/articles/editorial/${id}`);
        } catch {
          res = await apiClient<Article>(`/articles/${id}`);
        }
        setArticle(res);
      } catch (err: any) {
        setError(err.message || 'Article could not be loaded');
      } finally {
        setIsLoading(false);
      }
    }

    fetchArticle();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-500 gap-2 text-sm">
        <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        <span>Loading story from editorial queue...</span>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800 text-rose-400 text-sm">
        {error || 'Article not found.'}
      </div>
    );
  }

  return <ArticleStudioForm initialArticle={article} mode="edit" />;
}
