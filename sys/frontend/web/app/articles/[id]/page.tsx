'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchArticleDetail,
  likeArticle,
  unlikeArticle,
  saveArticle,
  unsaveArticle,
  selectCurrentArticle,
  selectArticlesLoading,
  selectArticlesError,
} from '@/store/articlesSlice';
import { selectIsAuthenticated } from '@/store/authSlice';
import CategoryChip from '@/components/CategoryChip';
import CommentSection from '@/components/CommentSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import styles from './page.module.css';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const article = useAppSelector(selectCurrentArticle);
  const loading = useAppSelector(selectArticlesLoading);
  const error = useAppSelector(selectArticlesError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const articleId = Number(params.id);

  useEffect(() => {
    if (articleId) {
      dispatch(fetchArticleDetail(articleId));
    }
  }, [dispatch, articleId]);

  const handleLike = () => {
    if (!isAuthenticated || !article) return;
    if (article.is_liked) {
      dispatch(unlikeArticle(article.id));
    } else {
      dispatch(likeArticle(article.id));
    }
  };

  const handleSave = () => {
    if (!isAuthenticated || !article) return;
    if (article.is_saved) {
      dispatch(unsaveArticle(article.id));
    } else {
      dispatch(saveArticle(article.id));
    }
  };

  const handleShare = async () => {
    if (!article) return;
    const shareData = {
      title: article.title,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch {
      // User cancelled share
    }
  };

  if (loading && !article) return <LoadingSpinner size="large" />;
  if (error) return <div className={styles.page}><ErrorMessage message={error} onRetry={() => dispatch(fetchArticleDetail(articleId))} /></div>;
  if (!article) return null;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <article className={styles.article}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            &larr; Back
          </button>

          <div className={styles.meta}>
            <CategoryChip category={article.category} />
            <span className={styles.source}>{article.source?.name}</span>
            <span className={styles.date}>{formatDate(article.published_at)}</span>
          </div>

          <h1 className={styles.title}>{article.title}</h1>

          {article.thumbnail_url && (
            <div className={styles.imageWrapper}>
              <img
                src={article.thumbnail_url}
                alt={article.title}
                className={styles.image}
              />
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${article.is_liked ? styles.liked : ''}`}
              onClick={handleLike}
              title={isAuthenticated ? (article.is_liked ? 'Unlike' : 'Like') : 'Login to like'}
            >
              {article.is_liked ? '\u2764' : '\u2661'} {article.like_count}
            </button>
            <button
              className={`${styles.actionBtn} ${article.is_saved ? styles.saved : ''}`}
              onClick={handleSave}
              title={isAuthenticated ? (article.is_saved ? 'Unsave' : 'Save') : 'Login to save'}
            >
              {article.is_saved ? '\u2605' : '\u2606'} Save
            </button>
            <button className={styles.actionBtn} onClick={handleShare}>
              &#x1F517; Share
            </button>
            <a
              href={article.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtn}
            >
              &#x2197; Original
            </a>
          </div>

          <div className={styles.content}>
            {article.content ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : article.summary ? (
              <p>{article.summary}</p>
            ) : (
              <p className={styles.noContent}>
                No content available.{' '}
                <a href={article.original_url} target="_blank" rel="noopener noreferrer">
                  Read the original article
                </a>
              </p>
            )}
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className={styles.tags}>
              {article.tags.map((tag) => (
                <span key={tag} className={styles.tag}>#{tag}</span>
              ))}
            </div>
          )}

          <CommentSection articleId={article.id} />
        </article>
      </div>
    </main>
  );
}
