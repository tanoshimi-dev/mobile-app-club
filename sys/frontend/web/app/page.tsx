'use client';

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchArticles,
  fetchTrendingArticles,
  searchArticles,
  clearArticles,
  selectArticles,
  selectTrendingArticles,
  selectArticlesLoading,
  selectArticlesError,
  selectHasMore,
} from '@/store/articlesSlice';
import {
  fetchCategories,
  setSelectedCategory,
  selectCategories,
  selectSelectedCategory,
} from '@/store/categoriesSlice';
import ArticleCard from '@/components/ArticleCard';
import SearchBar from '@/components/SearchBar';
import CategoryChip from '@/components/CategoryChip';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination';
import styles from './page.module.css';

export default function HomePage() {
  const dispatch = useAppDispatch();
  const articles = useAppSelector(selectArticles);
  const trendingArticles = useAppSelector(selectTrendingArticles);
  const loading = useAppSelector(selectArticlesLoading);
  const error = useAppSelector(selectArticlesError);
  const hasMore = useAppSelector(selectHasMore);
  const categories = useAppSelector(selectCategories);
  const selectedCategory = useAppSelector(selectSelectedCategory);

  useEffect(() => {
    dispatch(fetchArticles({ filters: {} }));
    dispatch(fetchTrendingArticles());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleSearch = useCallback(
    (query: string) => {
      if (query) {
        dispatch(searchArticles({ query }));
      } else {
        dispatch(clearArticles());
        dispatch(fetchArticles({ filters: selectedCategory ? { category: selectedCategory.id } : {} }));
      }
    },
    [dispatch, selectedCategory],
  );

  const handleCategoryFilter = (category: typeof selectedCategory) => {
    if (selectedCategory?.id === category?.id) {
      dispatch(setSelectedCategory(null));
      dispatch(clearArticles());
      dispatch(fetchArticles({ filters: {} }));
    } else {
      dispatch(setSelectedCategory(category));
      dispatch(clearArticles());
      dispatch(fetchArticles({ filters: { category: category!.id } }));
    }
  };

  const handleLoadMore = useCallback(() => {
    const filters = selectedCategory ? { category: selectedCategory.id } : {};
    dispatch(fetchArticles({ filters, loadMore: true }));
  }, [dispatch, selectedCategory]);

  const handleRefresh = () => {
    dispatch(clearArticles());
    const filters = selectedCategory ? { category: selectedCategory.id } : {};
    dispatch(fetchArticles({ filters }));
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <SearchBar onSearch={handleSearch} />
            <button className={styles.refreshBtn} onClick={handleRefresh} title="Refresh">
              &#x21BB;
            </button>
          </div>

          {categories.length > 0 && (
            <div className={styles.categories}>
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  category={cat}
                  selected={selectedCategory?.id === cat.id}
                  onClick={() => handleCategoryFilter(cat)}
                />
              ))}
            </div>
          )}

          {error && <ErrorMessage message={error} onRetry={handleRefresh} />}

          {!loading && articles.length === 0 && !error && (
            <p className={styles.empty}>No articles found.</p>
          )}

          <div className={styles.articleGrid}>
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          <Pagination hasMore={hasMore} loading={loading} onLoadMore={handleLoadMore} />

          {loading && articles.length === 0 && <LoadingSpinner />}
        </div>

        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Trending</h2>
          {trendingArticles.length === 0 ? (
            <p className={styles.sidebarEmpty}>No trending articles</p>
          ) : (
            <div className={styles.trendingList}>
              {trendingArticles.slice(0, 5).map((article, i) => (
                <a
                  key={article.id}
                  href={`/articles/${article.id}`}
                  className={styles.trendingItem}
                >
                  <span className={styles.trendingRank}>{i + 1}</span>
                  <div>
                    <p className={styles.trendingTitle}>{article.title}</p>
                    <span className={styles.trendingMeta}>
                      {article.like_count} likes
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
