/**
 * Article Card Component
 * Displays article preview in list
 */
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Icon from './icons/Icon';
import {colors, spacing, fontSize, categoryColors} from '../theme';
import {Article} from '../types';

interface ArticleCardProps {
  article: Article;
  onPress: () => void;
  onLike?: () => void;
  onSave?: () => void;
  style?: ViewStyle;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onPress,
  onLike,
  onSave,
  style,
}) => {
  const getCategoryColor = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('android')) return categoryColors.android;
    if (lowerName.includes('ios')) return categoryColors.ios;
    if (lowerName.includes('react')) return categoryColors.reactNative;
    if (lowerName.includes('flutter')) return categoryColors.flutter;
    return colors.gray[600];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.7}>
      {article.thumbnail_url && (
        <Image
          source={{uri: article.thumbnail_url}}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <View
            style={[
              styles.categoryBadge,
              {backgroundColor: getCategoryColor(article.category.name)},
            ]}>
            <Text style={styles.categoryText}>{article.category.name}</Text>
          </View>
          {article.source && (
            <Text style={styles.source}>{article.source.name}</Text>
          )}
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {article.title}
        </Text>

        {article.summary && (
          <Text style={styles.summary} numberOfLines={2}>
            {article.summary}
          </Text>
        )}

        {article.tags && article.tags.length > 0 && (
          <View style={styles.tags}>
            {article.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.date}>{formatDate(article.published_at)}</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onLike}
              disabled={!onLike}>
              <Icon
                name={article.is_liked ? 'heart' : 'heart-outline'}
                size={20}
                color={article.is_liked ? colors.error : colors.gray[500]}
              />
              <Text style={styles.actionText}>{article.like_count || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSave}
              disabled={!onSave}>
              <Icon
                name={article.is_saved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={article.is_saved ? colors.primary : colors.gray[500]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray[200],
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.white,
  },
  source: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 24,
  },
  summary: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
    gap: 4,
  },
  actionText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
});

export default ArticleCard;
