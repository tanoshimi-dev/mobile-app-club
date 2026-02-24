/**
 * Article Detail Screen
 * Full article view with actions (like, save, comment)
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from '../../components/icons/Icon';
import {AppStackParamList} from '../../navigation/AppStack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  fetchArticleDetail,
  likeArticle,
  unlikeArticle,
  saveArticle,
  unsaveArticle,
  selectArticleDetail,
  selectArticleDetailLoading,
  selectArticleDetailError,
} from '../../store/slices/articlesSlice';
import {colors, spacing, fontSize, categoryColors} from '../../theme';
import {LoadingSpinner, ErrorMessage, Button} from '../../components';

type ArticleDetailScreenRouteProp = RouteProp<AppStackParamList, 'ArticleDetail'>;
type ArticleDetailScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'ArticleDetail'
>;

type Props = {
  route: ArticleDetailScreenRouteProp;
  navigation: ArticleDetailScreenNavigationProp;
};

const ArticleDetailScreen: React.FC<Props> = ({route}) => {
  const {articleId} = route.params;
  const dispatch = useAppDispatch();

  const article = useAppSelector(selectArticleDetail);
  const loading = useAppSelector(selectArticleDetailLoading);
  const error = useAppSelector(selectArticleDetailError);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    try {
      await dispatch(fetchArticleDetail(articleId)).unwrap();
    } catch (err) {
      console.error('Failed to fetch article:', err);
    }
  };

  const handleLike = async () => {
    if (!article) return;
    try {
      if (article.is_liked) {
        await dispatch(unlikeArticle(article.id)).unwrap();
      } else {
        await dispatch(likeArticle(article.id)).unwrap();
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleSave = async () => {
    if (!article) return;
    try {
      if (article.is_saved) {
        await dispatch(unsaveArticle(article.id)).unwrap();
      } else {
        await dispatch(saveArticle(article.id)).unwrap();
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const handleReadOriginal = async () => {
    if (!article?.url) return;
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      }
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading article..." />;
  }

  if (error) {
    return (
      <ErrorMessage message={error} onRetry={loadArticle} fullScreen />
    );
  }

  if (!article) {
    return (
      <ErrorMessage message="Article not found" fullScreen />
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {article.image_url && (
        <Image
          source={{uri: article.image_url}}
          style={styles.image}
          resizeMode="cover"
        />
      )}

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

      <Text style={styles.title}>{article.title}</Text>

      <View style={styles.meta}>
        <Text style={styles.date}>{formatDate(article.published_at)}</Text>
        {article.author && (
          <Text style={styles.author}>By {article.author}</Text>
        )}
      </View>

      {article.summary && (
        <Text style={styles.summary}>{article.summary}</Text>
      )}

      {article.content && (
        <Text style={styles.contentText}>{article.content}</Text>
      )}

      {article.tags && article.tags.length > 0 && (
        <View style={styles.tags}>
          <Text style={styles.tagsLabel}>Tags:</Text>
          <View style={styles.tagsList}>
            {article.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Icon
            name={article.is_liked ? 'heart' : 'heart-outline'}
            size={24}
            color={article.is_liked ? colors.error : colors.gray[500]}
          />
          <Text style={styles.actionText}>
            {article.is_liked ? 'Liked' : 'Like'}
          </Text>
          <Text style={styles.actionCount}>({article.likes_count || 0})</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
          <Icon
            name={article.is_saved ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={article.is_saved ? colors.primary : colors.gray[500]}
          />
          <Text style={styles.actionText}>
            {article.is_saved ? 'Saved' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <Button
        title="Read Original Article"
        onPress={handleReadOriginal}
        variant="outline"
        fullWidth
        style={styles.readButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  source: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  author: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  summary: {
    fontSize: fontSize.lg,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 28,
    fontWeight: '500',
  },
  contentText: {
    fontSize: fontSize.base,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  tags: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  tagsLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.xs,
  },
  actionCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  readButton: {
    marginHorizontal: spacing.lg,
  },
});

export default ArticleDetailScreen;
