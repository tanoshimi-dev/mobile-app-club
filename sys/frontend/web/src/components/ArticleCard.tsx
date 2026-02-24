'use client';

import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '../store';
import { selectIsAuthenticated } from '../store/authSlice';
import { likeArticle, unlikeArticle, saveArticle, unsaveArticle } from '../store/articlesSlice';
import { Article } from '../types';
import CategoryChip from './CategoryChip';
import styles from './ArticleCard.module.css';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface ArticleCardProps {
  article: Article;
  showUnsave?: boolean;
}

export default function ArticleCard({ article, showUnsave }: ArticleCardProps) {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (article.is_liked) {
      dispatch(unlikeArticle(article.id));
    } else {
      dispatch(likeArticle(article.id));
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (article.is_saved) {
      dispatch(unsaveArticle(article.id));
    } else {
      dispatch(saveArticle(article.id));
    }
  };

  return (
    <article className={styles.card}>
      <Link href={`/articles/${article.id}`} className={styles.link}>
        {article.thumbnail_url && (
          <div className={styles.imageWrapper}>
            <img
              src={article.thumbnail_url}
              alt={article.title}
              className={styles.image}
            />
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.meta}>
            <CategoryChip category={article.category} />
            <span className={styles.source}>{article.source?.name}</span>
            <span className={styles.time}>{timeAgo(article.published_at)}</span>
          </div>
          <h3 className={styles.title}>{article.title}</h3>
          {article.summary && (
            <p className={styles.summary}>{article.summary}</p>
          )}
          <div className={styles.actions}>
            <button
              className={`${styles.actionBtn} ${article.is_liked ? styles.liked : ''}`}
              onClick={handleLike}
              title={isAuthenticated ? (article.is_liked ? 'Unlike' : 'Like') : 'Login to like'}
            >
              {article.is_liked ? '\u2764' : '\u2661'} {article.like_count}
            </button>
            <span className={styles.stat}>
              \uD83D\uDCAC {article.comment_count}
            </span>
            <button
              className={`${styles.actionBtn} ${styles.saveBtn} ${article.is_saved ? styles.saved : ''}`}
              onClick={handleSave}
              title={isAuthenticated ? (article.is_saved ? 'Unsave' : 'Save') : 'Login to save'}
            >
              {article.is_saved ? '\u2605' : '\u2606'}
              {showUnsave && article.is_saved && ' Unsave'}
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
}
