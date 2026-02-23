/**
 * TypeScript type definitions for the app
 */

// User types
export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
  preferred_categories?: number[];
  created_at: string;
}

export interface UserPreference {
  preferred_categories: number[];
  push_notifications: boolean;
  email_digest: 'none' | 'daily' | 'weekly';
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenRefreshResponse {
  access: string;
}

// Category types
export interface Category {
  id: number;
  name: string;
  slug: string;
  article_count?: number;
}

// Source types
export interface Source {
  id: number;
  name: string;
  url: string;
  category?: Category;
  article_count?: number;
}

// Article types
export interface Article {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  original_url: string;
  thumbnail_url?: string;
  source: Source;
  category: Category;
  tags?: string[];
  published_at: string;
  like_count: number;
  comment_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface ArticleListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
}

export interface ArticleFilters {
  category?: number;
  source?: number;
  ordering?: '-published_at' | '-like_count' | '-comment_count';
  page?: number;
  page_size?: number;
}

// Comment types
export interface CommentUser {
  id: number;
  username: string;
  avatar_url?: string;
}

export interface Comment {
  id: number;
  user: CommentUser;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface CommentListResponse {
  count: number;
  results: Comment[];
}

export interface CreateCommentRequest {
  body: string;
}

// Like types
export interface LikeResponse {
  article_id: number;
  like_count: number;
}

// Error types
export interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Navigation types
export type RootStackParamList = {
  MainTabs: undefined;
  ArticleDetail: {articleId: number};
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Categories: undefined;
  Saved: undefined;
  Profile: undefined;
};

// Redux state types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface ArticlesState {
  articles: Article[];
  trendingArticles: Article[];
  savedArticles: Article[];
  currentArticle: Article | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export interface CategoriesState {
  categories: Category[];
  sources: Source[];
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;
}
