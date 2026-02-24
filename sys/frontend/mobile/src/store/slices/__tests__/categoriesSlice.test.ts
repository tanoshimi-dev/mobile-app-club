import categoriesReducer, {
  setSelectedCategory,
  clearError,
  fetchCategories,
  fetchSources,
} from '../categoriesSlice';
import {CategoriesState, Category} from '../../../types';

const initialState: CategoriesState = {
  categories: [],
  sources: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

const mockCategory: Category = {id: 1, name: 'Android', slug: 'android', article_count: 10};

describe('categoriesSlice', () => {
  describe('reducers', () => {
    it('should return initial state', () => {
      expect(categoriesReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });

    it('should handle setSelectedCategory', () => {
      const state = categoriesReducer(initialState, setSelectedCategory(mockCategory));
      expect(state.selectedCategory).toEqual(mockCategory);
    });

    it('should handle setSelectedCategory to null', () => {
      const state = {...initialState, selectedCategory: mockCategory};
      const result = categoriesReducer(state, setSelectedCategory(null));
      expect(result.selectedCategory).toBeNull();
    });

    it('should handle clearError', () => {
      const state = {...initialState, error: 'error'};
      expect(categoriesReducer(state, clearError()).error).toBeNull();
    });
  });

  describe('fetchCategories', () => {
    it('should set loading on pending', () => {
      const action = {type: fetchCategories.pending.type};
      const state = categoriesReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set categories on fulfilled', () => {
      const action = {type: fetchCategories.fulfilled.type, payload: [mockCategory]};
      const state = categoriesReducer(initialState, action);
      expect(state.categories).toHaveLength(1);
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const action = {type: fetchCategories.rejected.type, payload: 'Failed'};
      const state = categoriesReducer(initialState, action);
      expect(state.error).toBe('Failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchSources', () => {
    it('should set loading on pending', () => {
      const action = {type: fetchSources.pending.type};
      const state = categoriesReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should set sources on fulfilled', () => {
      const mockSource = {id: 1, name: 'Blog', url: 'https://blog.com', article_count: 5};
      const action = {type: fetchSources.fulfilled.type, payload: [mockSource]};
      const state = categoriesReducer(initialState, action);
      expect(state.sources).toHaveLength(1);
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const action = {type: fetchSources.rejected.type, payload: 'Failed'};
      const state = categoriesReducer(initialState, action);
      expect(state.error).toBe('Failed');
      expect(state.loading).toBe(false);
    });
  });
});
