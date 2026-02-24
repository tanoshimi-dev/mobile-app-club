'use client';

import { Category } from '../types';
import styles from './CategoryChip.module.css';

const CATEGORY_COLORS: Record<string, string> = {
  ios: '#007AFF',
  android: '#3DDC84',
  'react-native': '#61DAFB',
  flutter: '#02569B',
  kotlin: '#7F52FF',
  swift: '#F05138',
  default: '#64748b',
};

interface CategoryChipProps {
  category: Category;
  selected?: boolean;
  onClick?: () => void;
}

export default function CategoryChip({ category, selected, onClick }: CategoryChipProps) {
  const color = CATEGORY_COLORS[category.slug] || CATEGORY_COLORS.default;

  return (
    <span
      className={`${styles.chip} ${selected ? styles.selected : ''} ${onClick ? styles.clickable : ''}`}
      style={{
        '--chip-color': color,
        '--chip-bg': `${color}15`,
      } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {category.name}
      {category.article_count !== undefined && (
        <span className={styles.count}>{category.article_count}</span>
      )}
    </span>
  );
}
