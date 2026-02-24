'use client';

import { useState, useEffect } from 'react';
import { useAppSelector } from '../store';
import { selectIsAuthenticated, selectUser } from '../store/authSlice';
import { apiService } from '../services/api';
import { Comment } from '../types';
import LoadingSpinner from './LoadingSpinner';
import styles from './CommentSection.module.css';

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
  return `${days}d ago`;
}

interface CommentSectionProps {
  articleId: number;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [articleId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getComments(articleId);
      setComments(data.results);
    } catch {
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const newComment = await apiService.createComment(articleId, { body: body.trim() });
      setComments((prev) => [newComment, ...prev]);
      setBody('');
    } catch {
      setError('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await apiService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      setError('Failed to delete comment');
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>Comments ({comments.length})</h3>

      {isAuthenticated && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <button
            className={styles.submitBtn}
            type="submit"
            disabled={!body.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}

      {!isAuthenticated && (
        <p className={styles.loginPrompt}>
          <a href="/login">Log in</a> to leave a comment.
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <LoadingSpinner size="small" />
      ) : comments.length === 0 ? (
        <p className={styles.empty}>No comments yet. Be the first!</p>
      ) : (
        <div className={styles.list}>
          {comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <span className={styles.commentAuthor}>{comment.user.username}</span>
                <span className={styles.commentTime}>{timeAgo(comment.created_at)}</span>
                {user?.id === comment.user.id && (
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className={styles.commentBody}>{comment.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
