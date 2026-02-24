'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchCategories,
  fetchSources,
  setSelectedCategory,
  selectCategories,
  selectSources,
  selectSelectedCategory,
  selectCategoriesLoading,
  selectCategoriesError,
} from '@/store/categoriesSlice';
import {
  fetchArticles,
  clearArticles,
  selectArticles,
  selectArticlesLoading,
  selectHasMore,
} from '@/store/articlesSlice';
import ArticleCard from '@/components/ArticleCard';
import CategoryChip from '@/components/CategoryChip';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import Pagination from '@/components/Pagination';
import styles from './page.module.css';

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const sources = useAppSelector(selectSources);
  const selectedCategory = useAppSelector(selectSelectedCategory);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const categoriesError = useAppSelector(selectCategoriesError);
  const articles = useAppSelector(selectArticles);
  const articlesLoading = useAppSelector(selectArticlesLoading);
  const hasMore = useAppSelector(selectHasMore);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchSources());
  }, [dispatch]);

  const handleSelectCategory = (category: typeof selectedCategory) => {
    if (selectedCategory?.id === category?.id) {
      dispatch(setSelectedCategory(null));
      dispatch(clearArticles());
    } else {
      dispatch(setSelectedCategory(category));
      dispatch(clearArticles());
      dispatch(fetchArticles({ filters: { category: category!.id } }));
    }
  };

  const handleLoadMore = () => {
    if (selectedCategory) {
      dispatch(fetchArticles({ filters: { category: selectedCategory.id }, loadMore: true }));
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Categories</h1>

        {categoriesError && (
          <ErrorMessage message={categoriesError} onRetry={() => dispatch(fetchCategories())} />
        )}

        {categoriesLoading && categories.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <div className={styles.grid}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.categoryCard} ${selectedCategory?.id === cat.id ? styles.selected : ''}`}
                onClick={() => handleSelectCategory(cat)}
              >
                <h3 className={styles.categoryName}>{cat.name}</h3>
                {cat.article_count !== undefined && (
                  <span className={styles.articleCount}>{cat.article_count} articles</span>
                )}
              </button>
            ))}
          </div>
        )}

        {sources.length > 0 && (
          <section className={styles.sourcesSection}>
            <h2 className={styles.sectionTitle}>Sources</h2>
            <div className={styles.sourcesList}>
              {sources.map((source) => (
                <div key={source.id} className={styles.sourceCard}>
                  <h4 className={styles.sourceName}>{source.name}</h4>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceUrl}
                  >
                    {source.url}
                  </a>
                  {source.category && (
                    <CategoryChip category={source.category} />
                  )}
                  {source.article_count !== undefined && (
                    <span className={styles.sourceCount}>{source.article_count} articles</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {selectedCategory && (
          <section className={styles.articlesSection}>
            <h2 className={styles.sectionTitle}>
              Articles in {selectedCategory.name}
            </h2>

            {articlesLoading && articles.length === 0 ? (
              <LoadingSpinner />
            ) : articles.length === 0 ? (
              <p className={styles.empty}>No articles in this category.</p>
            ) : (
              <>
                <div className={styles.articleGrid}>
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                <Pagination hasMore={hasMore} loading={articlesLoading} onLoadMore={handleLoadMore} />
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
