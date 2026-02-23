import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Article {
  id: number;
  title: string;
  summary: string;
  thumbnail_url: string;
  published_at: string;
  like_count: number;
  comment_count: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  article_count: number;
}

interface NewsState {
  articles: Article[];
  categories: Category[];
  isLoading: boolean;
}

const initialState: NewsState = {
  articles: [],
  categories: [],
  isLoading: false,
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setArticles: (state, action: PayloadAction<Article[]>) => {
      state.articles = action.payload;
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setArticles, setCategories, setLoading } = newsSlice.actions;
export default newsSlice.reducer;
