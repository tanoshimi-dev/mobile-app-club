import articlesReducer, {
  clearArticles,
  clearError,
  fetchArticles,
  fetchTrendingArticles,
  fetchSavedArticles,
  fetchArticleDetail,
  searchArticles,
  likeArticle,
  unlikeArticle,
  saveArticle,
  unsaveArticle,
} from '../articlesSlice';
import { ArticlesState, Article } from '../../types';

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

const mockArticle: Article = {
  id: 1,
  title: 'Test Article',
  summary: 'Summary',
  original_url: 'https://example.com',
  source: { id: 1, name: 'Source', url: 'https://source.com' },
  category: { id: 1, name: 'Android', slug: 'android' },
  published_at: '2026-02-24T12:00:00Z',
  like_count: 5,
  comment_count: 2,
  is_liked: false,
  is_saved: false,
};

describe('articlesSlice', () => {
  describe('reducers', () => {
    it('should return initial state', () => {
      expect(articlesReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearArticles', () => {
      const state = { ...initialState, articles: [mockArticle], page: 3, hasMore: false };
      const result = articlesReducer(state, clearArticles());
      expect(result.articles).toEqual([]);
      expect(result.page).toBe(1);
      expect(result.hasMore).toBe(true);
    });

    it('should handle clearError', () => {
      const state = { ...initialState, error: 'an error' };
      expect(articlesReducer(state, clearError()).error).toBeNull();
    });
  });

  describe('fetchArticles', () => {
    it('should set loading on pending', () => {
      const action = { type: fetchArticles.pending.type };
      const state = articlesReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should replace articles on fulfilled (no loadMore)', () => {
      const action = {
        type: fetchArticles.fulfilled.type,
        payload: { articles: [mockArticle], hasMore: true, page: 1, loadMore: false },
      };
      const state = articlesReducer(initialState, action);
      expect(state.articles).toHaveLength(1);
      expect(state.page).toBe(1);
      expect(state.loading).toBe(false);
    });

    it('should append articles on fulfilled (loadMore)', () => {
      const existing = { ...initialState, articles: [mockArticle] };
      const newArticle = { ...mockArticle, id: 2 };
      const action = {
        type: fetchArticles.fulfilled.type,
        payload: { articles: [newArticle], hasMore: false, page: 2, loadMore: true },
      };
      const state = articlesReducer(existing, action);
      expect(state.articles).toHaveLength(2);
      expect(state.page).toBe(2);
      expect(state.hasMore).toBe(false);
    });

    it('should set error on rejected', () => {
      const action = { type: fetchArticles.rejected.type, payload: 'Failed' };
      const state = articlesReducer(initialState, action);
      expect(state.error).toBe('Failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchTrendingArticles', () => {
    it('should set trending articles on fulfilled', () => {
      const action = { type: fetchTrendingArticles.fulfilled.type, payload: [mockArticle] };
      const state = articlesReducer(initialState, action);
      expect(state.trendingArticles).toHaveLength(1);
    });
  });

  describe('fetchSavedArticles', () => {
    it('should set saved articles on fulfilled', () => {
      const action = { type: fetchSavedArticles.fulfilled.type, payload: [mockArticle] };
      const state = articlesReducer(initialState, action);
      expect(state.savedArticles).toHaveLength(1);
    });
  });

  describe('fetchArticleDetail', () => {
    it('should set currentArticle on fulfilled', () => {
      const action = { type: fetchArticleDetail.fulfilled.type, payload: mockArticle };
      const state = articlesReducer(initialState, action);
      expect(state.currentArticle).toEqual(mockArticle);
    });
  });

  describe('searchArticles', () => {
    it('should replace articles and disable hasMore on fulfilled', () => {
      const action = { type: searchArticles.fulfilled.type, payload: [mockArticle] };
      const state = articlesReducer(initialState, action);
      expect(state.articles).toHaveLength(1);
      expect(state.hasMore).toBe(false);
    });
  });

  describe('likeArticle', () => {
    it('should update like status and count', () => {
      const existing = { ...initialState, articles: [{ ...mockArticle }] };
      const action = {
        type: likeArticle.fulfilled.type,
        payload: { articleId: 1, likeCount: 6 },
      };
      const state = articlesReducer(existing, action);
      expect(state.articles[0].is_liked).toBe(true);
      expect(state.articles[0].like_count).toBe(6);
    });

    it('should update currentArticle if matching', () => {
      const existing = { ...initialState, currentArticle: { ...mockArticle } };
      const action = {
        type: likeArticle.fulfilled.type,
        payload: { articleId: 1, likeCount: 6 },
      };
      const state = articlesReducer(existing, action);
      expect(state.currentArticle?.is_liked).toBe(true);
    });
  });

  describe('unlikeArticle', () => {
    it('should decrement like count and set is_liked false', () => {
      const liked = { ...mockArticle, is_liked: true, like_count: 5 };
      const existing = { ...initialState, articles: [liked] };
      const action = { type: unlikeArticle.fulfilled.type, payload: 1 };
      const state = articlesReducer(existing, action);
      expect(state.articles[0].is_liked).toBe(false);
      expect(state.articles[0].like_count).toBe(4);
    });

    it('should not go below 0', () => {
      const liked = { ...mockArticle, is_liked: true, like_count: 0 };
      const existing = { ...initialState, articles: [liked] };
      const action = { type: unlikeArticle.fulfilled.type, payload: 1 };
      const state = articlesReducer(existing, action);
      expect(state.articles[0].like_count).toBe(0);
    });
  });

  describe('saveArticle', () => {
    it('should set is_saved true', () => {
      const existing = { ...initialState, articles: [{ ...mockArticle }] };
      const action = { type: saveArticle.fulfilled.type, payload: 1 };
      const state = articlesReducer(existing, action);
      expect(state.articles[0].is_saved).toBe(true);
    });
  });

  describe('unsaveArticle', () => {
    it('should set is_saved false and remove from savedArticles', () => {
      const saved = { ...mockArticle, is_saved: true };
      const existing = {
        ...initialState,
        articles: [saved],
        savedArticles: [saved],
      };
      const action = { type: unsaveArticle.fulfilled.type, payload: 1 };
      const state = articlesReducer(existing, action);
      expect(state.articles[0].is_saved).toBe(false);
      expect(state.savedArticles).toHaveLength(0);
    });
  });
});
