/**
 * API Service Layer
 */
import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios';
import {API_CONFIG, API_ENDPOINTS} from '../config/api';
import {
  Article,
  ArticleFilters,
  ArticleListResponse,
  AuthResponse,
  Category,
  Comment,
  CommentListResponse,
  CreateCommentRequest,
  LikeResponse,
  LoginRequest,
  RegisterRequest,
  Source,
  TokenRefreshResponse,
  User,
  UserPreference,
} from '../types';

class APIService {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async config => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      response => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Skip token refresh for auth endpoints (401 = invalid credentials, not expired token)
        const url = originalRequest.url || '';
        const isAuthEndpoint =
          url.includes(API_ENDPOINTS.AUTH_LOGIN) ||
          url.includes(API_ENDPOINTS.AUTH_REGISTER) ||
          url.includes(API_ENDPOINTS.AUTH_REFRESH);

        // If 401 and not already retried, try to refresh token
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            if (newAccessToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, user needs to log in again
            this.clearTokens();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  private async refreshAccessToken(): Promise<string | null> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.refreshTokenPromise = (async () => {
      try {
        const response = await axios.post<TokenRefreshResponse>(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH_REFRESH}`,
          {refresh: refreshToken},
        );

        const {access} = response.data;
        this.setAccessToken(access);
        return access;
      } finally {
        this.refreshTokenPromise = null;
      }
    })();

    return this.refreshTokenPromise;
  }

  // Token management
  private async getAccessToken(): Promise<string | null> {
    const {storageService} = await import('./storage');
    return storageService.getAccessToken();
  }

  private async getRefreshToken(): Promise<string | null> {
    const {storageService} = await import('./storage');
    return storageService.getRefreshToken();
  }

  private async setAccessToken(token: string): Promise<void> {
    const {storageService} = await import('./storage');
    await storageService.setAccessToken(token);
  }

  private async clearTokens(): Promise<void> {
    const {storageService} = await import('./storage');
    await storageService.clearTokens();
  }

  // Auth API calls
  async register(data: RegisterRequest): Promise<User> {
    const response = await this.client.post<User>(
      API_ENDPOINTS.AUTH_REGISTER,
      data,
    );
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>(
      API_ENDPOINTS.AUTH_LOGIN,
      data,
    );
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.client.post(API_ENDPOINTS.AUTH_LOGOUT, {
      refresh: refreshToken,
    });
  }

  // User API calls
  async getMe(): Promise<User> {
    const response = await this.client.get<User>(API_ENDPOINTS.USERS_ME);
    return response.data;
  }

  async updateMe(data: Partial<User>): Promise<User> {
    const response = await this.client.patch<User>(
      API_ENDPOINTS.USERS_ME,
      data,
    );
    return response.data;
  }

  async getPreferences(): Promise<UserPreference> {
    const response = await this.client.get<UserPreference>(
      API_ENDPOINTS.USERS_PREFERENCES,
    );
    return response.data;
  }

  async updatePreferences(data: UserPreference): Promise<UserPreference> {
    const response = await this.client.put<UserPreference>(
      API_ENDPOINTS.USERS_PREFERENCES,
      data,
    );
    return response.data;
  }

  // Category API calls
  async getCategories(): Promise<Category[]> {
    const response = await this.client.get<{results: Category[]}>(
      API_ENDPOINTS.CATEGORIES,
    );
    return response.data.results;
  }

  // Source API calls
  async getSources(): Promise<Source[]> {
    const response = await this.client.get<{results: Source[]}>(
      API_ENDPOINTS.SOURCES,
    );
    return response.data.results;
  }

  // Article API calls
  async getArticles(filters?: ArticleFilters): Promise<ArticleListResponse> {
    const response = await this.client.get<ArticleListResponse>(
      API_ENDPOINTS.ARTICLES,
      {params: filters},
    );
    return response.data;
  }

  async getArticleDetail(id: number): Promise<Article> {
    const response = await this.client.get<Article>(
      API_ENDPOINTS.ARTICLE_DETAIL(id),
    );
    return response.data;
  }

  async getTrendingArticles(): Promise<ArticleListResponse> {
    const response = await this.client.get<ArticleListResponse>(
      API_ENDPOINTS.ARTICLES_TRENDING,
    );
    return response.data;
  }

  async searchArticles(
    query: string,
    filters?: Omit<ArticleFilters, 'ordering'>,
  ): Promise<ArticleListResponse> {
    const response = await this.client.get<ArticleListResponse>(
      API_ENDPOINTS.ARTICLES_SEARCH,
      {params: {...filters, q: query}},
    );
    return response.data;
  }

  async getSavedArticles(): Promise<ArticleListResponse> {
    const response = await this.client.get<ArticleListResponse>(
      API_ENDPOINTS.USERS_SAVED,
    );
    return response.data;
  }

  // Like API calls
  async likeArticle(id: number): Promise<LikeResponse> {
    const response = await this.client.post<LikeResponse>(
      API_ENDPOINTS.ARTICLE_LIKE(id),
    );
    return response.data;
  }

  async unlikeArticle(id: number): Promise<void> {
    await this.client.delete(API_ENDPOINTS.ARTICLE_LIKE(id));
  }

  // Save API calls
  async saveArticle(id: number): Promise<void> {
    await this.client.post(API_ENDPOINTS.ARTICLE_SAVE(id));
  }

  async unsaveArticle(id: number): Promise<void> {
    await this.client.delete(API_ENDPOINTS.ARTICLE_SAVE(id));
  }

  // Comment API calls
  async getComments(articleId: number): Promise<CommentListResponse> {
    const response = await this.client.get<CommentListResponse>(
      API_ENDPOINTS.ARTICLE_COMMENTS(articleId),
    );
    return response.data;
  }

  async createComment(
    articleId: number,
    data: CreateCommentRequest,
  ): Promise<Comment> {
    const response = await this.client.post<Comment>(
      API_ENDPOINTS.ARTICLE_COMMENTS(articleId),
      data,
    );
    return response.data;
  }

  async updateComment(id: number, data: CreateCommentRequest): Promise<Comment> {
    const response = await this.client.patch<Comment>(
      API_ENDPOINTS.COMMENT_DETAIL(id),
      data,
    );
    return response.data;
  }

  async deleteComment(id: number): Promise<void> {
    await this.client.delete(API_ENDPOINTS.COMMENT_DETAIL(id));
  }
}

export const apiService = new APIService();
