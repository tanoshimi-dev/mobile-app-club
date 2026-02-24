/**
 * Articles Redux Slice
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/api';
import { Article, ArticlesState, ArticleFilters } from '../types';

const initialState: ArticlesState = {
  articles: [],
  trendingArticles: [],
  savedArticles: [],
  currentArticle: null,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
};

// Async thunks
export const fetchArticles = createAsyncThunk(
  'articles/fetchArticles',
  async (
    { filters, loadMore }: { filters?: ArticleFilters; loadMore?: boolean },
    { getState, rejectWithValue },
  ) => {
    try {
      const state = getState() as { articles: ArticlesState };
      const page = loadMore ? state.articles.page + 1 : 1;

      const response = await apiService.getArticles({
        ...filters,
        page,
        page_size: 20,
      });

      return {
        articles: response.results,
        hasMore: response.next !== null,
        page,
        loadMore: loadMore || false,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch articles',
      );
    }
  },
);

export const fetchTrendingArticles = createAsyncThunk(
  'articles/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getTrendingArticles();
      return response.results;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch trending articles',
      );
    }
  },
);

export const fetchSavedArticles = createAsyncThunk(
  'articles/fetchSaved',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.getSavedArticles();
      return response.results;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch saved articles',
      );
    }
  },
);

export const fetchArticleDetail = createAsyncThunk(
  'articles/fetchDetail',
  async (id: number, { rejectWithValue }) => {
    try {
      const article = await apiService.getArticleDetail(id);
      return article;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch article detail',
      );
    }
  },
);

export const searchArticles = createAsyncThunk(
  'articles/search',
  async (
    { query, filters }: { query: string; filters?: Omit<ArticleFilters, 'ordering'> },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiService.searchArticles(query, filters);
      return response.results;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to search articles',
      );
    }
  },
);

export const likeArticle = createAsyncThunk(
  'articles/like',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await apiService.likeArticle(id);
      return { articleId: id, likeCount: response.like_count };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to like article',
      );
    }
  },
);

export const unlikeArticle = createAsyncThunk(
  'articles/unlike',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.unlikeArticle(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to unlike article',
      );
    }
  },
);

export const saveArticle = createAsyncThunk(
  'articles/save',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.saveArticle(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to save article',
      );
    }
  },
);

export const unsaveArticle = createAsyncThunk(
  'articles/unsave',
  async (id: number, { rejectWithValue }) => {
    try {
      await apiService.unsaveArticle(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to unsave article',
      );
    }
  },
);

// Slice
const articlesSlice = createSlice({
  name: 'articles',
  initialState,
  reducers: {
    clearArticles: (state) => {
      state.articles = [];
      state.page = 1;
      state.hasMore = true;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateArticleInList: (state, action: PayloadAction<Article>) => {
      const index = state.articles.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.articles[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch articles
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.loadMore) {
          state.articles = [...state.articles, ...action.payload.articles];
        } else {
          state.articles = action.payload.articles;
        }
        state.hasMore = action.payload.hasMore;
        state.page = action.payload.page;
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch trending articles
    builder
      .addCase(fetchTrendingArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.trendingArticles = action.payload;
      })
      .addCase(fetchTrendingArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch saved articles
    builder
      .addCase(fetchSavedArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.savedArticles = action.payload;
      })
      .addCase(fetchSavedArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch article detail
    builder
      .addCase(fetchArticleDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArticleDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.currentArticle = action.payload;
      })
      .addCase(fetchArticleDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search articles
    builder
      .addCase(searchArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
        state.hasMore = false;
      })
      .addCase(searchArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Like article
    builder.addCase(likeArticle.fulfilled, (state, action) => {
      const updateArticle = (articles: Article[]) => {
        const index = articles.findIndex((a) => a.id === action.payload.articleId);
        if (index !== -1) {
          articles[index].is_liked = true;
          articles[index].like_count = action.payload.likeCount;
        }
      };

      updateArticle(state.articles);
      updateArticle(state.trendingArticles);
      updateArticle(state.savedArticles);

      if (state.currentArticle?.id === action.payload.articleId) {
        state.currentArticle.is_liked = true;
        state.currentArticle.like_count = action.payload.likeCount;
      }
    });

    // Unlike article
    builder.addCase(unlikeArticle.fulfilled, (state, action) => {
      const updateArticle = (articles: Article[]) => {
        const index = articles.findIndex((a) => a.id === action.payload);
        if (index !== -1) {
          articles[index].is_liked = false;
          articles[index].like_count = Math.max(0, articles[index].like_count - 1);
        }
      };

      updateArticle(state.articles);
      updateArticle(state.trendingArticles);
      updateArticle(state.savedArticles);

      if (state.currentArticle?.id === action.payload) {
        state.currentArticle.is_liked = false;
        state.currentArticle.like_count = Math.max(
          0,
          state.currentArticle.like_count - 1,
        );
      }
    });

    // Save article
    builder.addCase(saveArticle.fulfilled, (state, action) => {
      const updateArticle = (articles: Article[]) => {
        const index = articles.findIndex((a) => a.id === action.payload);
        if (index !== -1) {
          articles[index].is_saved = true;
        }
      };

      updateArticle(state.articles);
      updateArticle(state.trendingArticles);

      if (state.currentArticle?.id === action.payload) {
        state.currentArticle.is_saved = true;
      }
    });

    // Unsave article
    builder.addCase(unsaveArticle.fulfilled, (state, action) => {
      const updateArticle = (articles: Article[]) => {
        const index = articles.findIndex((a) => a.id === action.payload);
        if (index !== -1) {
          articles[index].is_saved = false;
        }
      };

      updateArticle(state.articles);
      updateArticle(state.trendingArticles);

      state.savedArticles = state.savedArticles.filter(
        (a) => a.id !== action.payload,
      );

      if (state.currentArticle?.id === action.payload) {
        state.currentArticle.is_saved = false;
      }
    });
  },
});

export const { clearArticles, clearError, updateArticleInList } =
  articlesSlice.actions;

// Selectors
export const selectArticles = (state: { articles: ArticlesState }) =>
  state.articles?.articles ?? [];
export const selectTrendingArticles = (state: { articles: ArticlesState }) =>
  state.articles?.trendingArticles ?? [];
export const selectSavedArticles = (state: { articles: ArticlesState }) =>
  state.articles?.savedArticles ?? [];
export const selectCurrentArticle = (state: { articles: ArticlesState }) =>
  state.articles?.currentArticle ?? null;
export const selectArticlesLoading = (state: { articles: ArticlesState }) =>
  state.articles?.loading ?? false;
export const selectArticlesError = (state: { articles: ArticlesState }) =>
  state.articles?.error ?? null;
export const selectHasMore = (state: { articles: ArticlesState }) =>
  state.articles?.hasMore ?? true;

export default articlesSlice.reducer;
