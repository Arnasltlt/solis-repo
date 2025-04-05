export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CategoryUsage {
  count: number;
}

export interface CreateCategoryResponse {
  success: boolean;
  category?: Category;
  error?: string;
}

export interface DeleteCategoryResponse {
  success: boolean;
  error?: string;
}

export interface GetCategoryUsageResponse {
  success: boolean;
  usage?: CategoryUsage;
  error?: string;
} 