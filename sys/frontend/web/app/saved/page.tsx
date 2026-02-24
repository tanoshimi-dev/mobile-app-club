'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchSavedArticles,
  selectSavedArticles,
  selectArticlesLoading,
  selectArticlesError,
} from '@/store/articlesSlice';
import AuthGuard from '@/components/AuthGuard';
import ArticleCard from '@/components/ArticleCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import styles from './page.module.css';

function SavedContent() {
  const dispatch = useAppDispatch();
  const savedArticles = useAppSelector(selectSavedArticles);
  const loading = useAppSelector(selectArticlesLoading);
  const error = useAppSelector(selectArticlesError);

  useEffect(() => {
    dispatch(fetchSavedArticles());
  }, [dispatch]);

  return (
    <>
      {error && <ErrorMessage message={error} onRetry={() => dispatch(fetchSavedArticles())} />}

      {loading && savedArticles.length === 0 ? (
        <LoadingSpinner />
      ) : savedArticles.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>No saved articles</p>
          <p className={styles.emptyText}>
            Articles you save will appear here. Browse articles and tap the save button to bookmark them.
          </p>
        </div>
      ) : (
        <div className={styles.articleGrid}>
          {savedArticles.map((article) => (
            <ArticleCard key={article.id} article={article} showUnsave />
          ))}
        </div>
      )}
    </>
  );
}

export default function SavedPage() {
  return (
    <AuthGuard>
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Saved Articles</h1>
          <SavedContent />
        </div>
      </main>
    </AuthGuard>
  );
}
