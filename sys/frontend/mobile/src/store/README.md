# Redux Store Documentation

This directory contains the Redux store configuration and slices for the Mobile Dev News app.

## Structure

```
store/
├── index.ts                # Store configuration with persistence
├── hooks.ts                # Typed Redux hooks
└── slices/
    ├── authSlice.ts        # Authentication state
    ├── articlesSlice.ts    # Articles state
    └── categoriesSlice.ts  # Categories state
```

---

## Store Configuration (`index.ts`)

The store is configured with:
- **Redux Toolkit** for simplified Redux logic
- **Redux Persist** for state persistence (auth only)
- **AsyncStorage** as the storage engine
- Three main slices: auth, articles, categories

### Usage

```typescript
import {store, persistor} from './store';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';

<Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
    <App />
  </PersistGate>
</Provider>
```

---

## Typed Hooks (`hooks.ts`)

Use these instead of plain `useDispatch` and `useSelector` for type safety:

```typescript
import {useAppDispatch, useAppSelector} from './store/hooks';

// In components
const dispatch = useAppDispatch();
const user = useAppSelector(selectUser);
```

---

## Auth Slice (`slices/authSlice.ts`)

Manages user authentication and profile state.

### State

```typescript
{
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}
```

### Actions

**Async Thunks:**
- `register(data)` - Register new user
- `login(data)` - Login user
- `logout()` - Logout user
- `loadStoredAuth()` - Load auth from AsyncStorage
- `fetchUserProfile()` - Fetch current user profile
- `updateProfile(data)` - Update user profile

**Sync Actions:**
- `clearError()` - Clear error message
- `setTokens({accessToken, refreshToken})` - Set auth tokens

### Selectors

```typescript
selectAuth          // Entire auth state
selectUser          // Current user
selectIsAuthenticated // Boolean
selectAuthLoading   // Boolean
selectAuthError     // Error string
selectAccessToken   // Access token
```

### Usage Example

```typescript
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {login, selectUser, selectAuthError} from '../store/slices/authSlice';

function LoginScreen() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const error = useAppSelector(selectAuthError);

  const handleLogin = async () => {
    await dispatch(login({email, password}));
  };
}
```

---

## Articles Slice (`slices/articlesSlice.ts`)

Manages articles, trending, saved articles, and interactions.

### State

```typescript
{
  articles: Article[]
  trendingArticles: Article[]
  savedArticles: Article[]
  currentArticle: Article | null
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
}
```

### Actions

**Async Thunks:**
- `fetchArticles({filters, loadMore})` - Fetch articles with pagination
- `fetchTrendingArticles()` - Fetch trending articles
- `fetchSavedArticles()` - Fetch saved articles
- `fetchArticleDetail(id)` - Fetch single article
- `searchArticles({query, filters})` - Search articles
- `likeArticle(id)` - Like an article
- `unlikeArticle(id)` - Unlike an article
- `saveArticle(id)` - Save an article
- `unsaveArticle(id)` - Unsave an article

**Sync Actions:**
- `clearArticles()` - Clear articles and reset pagination
- `clearError()` - Clear error message
- `updateArticleInList(article)` - Update article in list

### Selectors

```typescript
selectArticles          // Main articles list
selectTrendingArticles  // Trending articles
selectSavedArticles     // Saved articles
selectCurrentArticle    // Currently viewed article
selectArticlesLoading   // Boolean
selectArticlesError     // Error string
selectHasMore           // Boolean for pagination
```

### Usage Example

```typescript
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  fetchArticles,
  likeArticle,
  selectArticles,
  selectHasMore,
} from '../store/slices/articlesSlice';

function HomeScreen() {
  const dispatch = useAppDispatch();
  const articles = useAppSelector(selectArticles);
  const hasMore = useAppSelector(selectHasMore);

  useEffect(() => {
    dispatch(fetchArticles({}));
  }, []);

  const loadMore = () => {
    dispatch(fetchArticles({loadMore: true}));
  };

  const handleLike = (id: number) => {
    dispatch(likeArticle(id));
  };
}
```

---

## Categories Slice (`slices/categoriesSlice.ts`)

Manages categories and sources.

### State

```typescript
{
  categories: Category[]
  sources: Source[]
  selectedCategory: Category | null
  loading: boolean
  error: string | null
}
```

### Actions

**Async Thunks:**
- `fetchCategories()` - Fetch all categories
- `fetchSources()` - Fetch all sources

**Sync Actions:**
- `setSelectedCategory(category)` - Set selected category
- `clearError()` - Clear error message

### Selectors

```typescript
selectCategories        // All categories
selectSources           // All sources
selectSelectedCategory  // Currently selected category
selectCategoriesLoading // Boolean
selectCategoriesError   // Error string
```

### Usage Example

```typescript
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {
  fetchCategories,
  setSelectedCategory,
  selectCategories,
} from '../store/slices/categoriesSlice';

function CategoriesScreen() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);

  useEffect(() => {
    dispatch(fetchCategories());
  }, []);

  const handleSelectCategory = (category: Category) => {
    dispatch(setSelectedCategory(category));
  };
}
```

---

## State Persistence

Only the **auth slice** is persisted to AsyncStorage using `redux-persist`. This means:
- User credentials persist across app restarts
- Articles and categories are fetched fresh on each launch
- Logout clears persisted auth state

### Storage Keys

```typescript
'@auth/access_token'    // Access JWT token
'@auth/refresh_token'   // Refresh JWT token
'@auth/user'            // User profile data
```

---

## Error Handling

All slices follow consistent error handling:

1. **Pending**: Set `loading: true`, clear `error`
2. **Fulfilled**: Set `loading: false`, update state
3. **Rejected**: Set `loading: false`, set `error` message

Errors can be displayed to users:

```typescript
const error = useAppSelector(selectAuthError);

{error && <ErrorMessage>{error}</ErrorMessage>}
```

---

## State Updates

### Optimistic Updates

Like/unlike and save/unsave operations update the state immediately for a smooth UX:

```typescript
// When liking an article
builder.addCase(likeArticle.fulfilled, (state, action) => {
  // Updates article in all lists: articles, trending, saved
  // Updates currentArticle if viewing the liked article
});
```

### Automatic Synchronization

Articles are automatically updated across all lists when:
- Liked/unliked
- Saved/unsaved
- Comments added

This ensures UI consistency without manual refetching.

---

## Best Practices

1. **Always use typed hooks** (`useAppDispatch`, `useAppSelector`)
2. **Use selectors** instead of direct state access
3. **Handle loading states** in UI
4. **Display errors** to users
5. **Clear errors** after displaying
6. **Dispatch actions from components**, not services
7. **Keep business logic in thunks**, not components

---

## Testing

To test Redux slices:

```typescript
import {configureStore} from '@reduxjs/toolkit';
import authReducer, {login} from './authSlice';

describe('authSlice', () => {
  it('should handle login', async () => {
    const store = configureStore({
      reducer: {auth: authReducer},
    });

    await store.dispatch(login({email: 'test@example.com', password: 'pass'}));

    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});
```

---

## TypeScript

All actions, selectors, and state are fully typed. No `any` types used.

Type exports:
- `RootState` - Full store state type
- `AppDispatch` - Store dispatch type
- `AuthState`, `ArticlesState`, `CategoriesState` - Slice state types

---

## Performance Considerations

- **Memoization**: Selectors are automatically memoized by Redux
- **Pagination**: Articles use page-based pagination with `hasMore` flag
- **Persistence**: Only auth state persists (small storage footprint)
- **Shallow updates**: Redux Toolkit uses Immer for immutable updates

---

*Last updated: 2026-02-24*
