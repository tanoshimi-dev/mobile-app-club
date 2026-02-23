import {createSlice} from '@reduxjs/toolkit';

const newsSlice = createSlice({
  name: 'news',
  initialState: {
    articles: [],
    categories: [],
    isLoading: false,
  },
  reducers: {
    setArticles: (state, action) => {
      state.articles = action.payload;
    },
    setCategories: (state, action) => {
      state.categories = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {setArticles, setCategories, setLoading} = newsSlice.actions;
export default newsSlice.reducer;
