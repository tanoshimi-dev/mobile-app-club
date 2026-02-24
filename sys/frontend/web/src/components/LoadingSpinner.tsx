import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
}

export default function LoadingSpinner({ size = 'medium' }: LoadingSpinnerProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.spinner} ${styles[size]}`} />
    </div>
  );
}
