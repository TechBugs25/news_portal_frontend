import { Category } from './category';
import { Tag } from './tag';
import { User } from './user';

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface EditorJsBlock {
  id?: string;
  type: string;
  data: any;
}

export interface EditorJsOutput {
  time?: number;
  blocks: EditorJsBlock[];
  version?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string; // Serialized EditorJsOutput or raw text
  featuredImageUrl?: string | null;
  status: ArticleStatus;
  author: User;
  reviewer?: User | null;
  category: Category;
  tags: Tag[];
  publishedAt?: string | null;
  scheduledAt?: string | null;
  viewCount: number | string;
  isFeatured: boolean;
  isBreaking: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticlePayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  featuredImageUrl?: string;
  categoryId: string;
  tags?: string[];
  status?: ArticleStatus;
  isFeatured?: boolean;
  isBreaking?: boolean;
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface UpdateArticlePayload extends Partial<CreateArticlePayload> {}

export interface UpdateArticleStatusPayload {
  status: ArticleStatus;
}
