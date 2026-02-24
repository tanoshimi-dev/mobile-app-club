import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}
