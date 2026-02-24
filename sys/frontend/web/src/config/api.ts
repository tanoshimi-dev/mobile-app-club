/**
 * API Configuration
 * Uses relative paths since Next.js rewrites handle proxying to backend
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  AUTH_LOGOUT: '/api/v1/auth/logout',

  // Users
  USERS_ME: '/api/v1/users/me',
  USERS_PREFERENCES: '/api/v1/users/me/preferences',
  USERS_SAVED: '/api/v1/users/me/saved',

  // Categories
  CATEGORIES: '/api/v1/categories',

  // Sources
  SOURCES: '/api/v1/sources',

  // Articles
  ARTICLES: '/api/v1/articles',
  ARTICLES_TRENDING: '/api/v1/articles/trending',
  ARTICLES_SEARCH: '/api/v1/articles/search',
  ARTICLE_DETAIL: (id: number) => `/api/v1/articles/${id}`,
  ARTICLE_LIKE: (id: number) => `/api/v1/articles/${id}/like`,
  ARTICLE_SAVE: (id: number) => `/api/v1/articles/${id}/save`,
  ARTICLE_COMMENTS: (id: number) => `/api/v1/articles/${id}/comments`,

  // Comments
  COMMENT_DETAIL: (id: number) => `/api/v1/comments/${id}`,
};
