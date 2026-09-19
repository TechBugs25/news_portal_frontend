export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  orderIndex: number;
  isActive: boolean;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  orderIndex?: number;
  parentId?: string;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  orderIndex?: number;
  parentId?: string | null;
  isActive?: boolean;
}
