/**
 * Saved Screen
 * User's saved articles
 */
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import Icon from '../../components/icons/Icon';
import {RootStackParamList} from '../../navigation/RootNavigator';
import {MainTabParamList} from '../../navigation/MainTabs';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  fetchSavedArticles,
  likeArticle,
  unlikeArticle,
  unsaveArticle,
  selectSavedArticles,
  selectArticlesLoading,
  selectArticlesError,
} from '../../store/slices/articlesSlice';
import {colors, spacing, fontSize} from '../../theme';
import {ArticleCard, LoadingSpinner, ErrorMessage} from '../../components';
import {Article} from '../../types';

type SavedScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Saved'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: SavedScreenNavigationProp;
}

const SavedScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const savedArticles = useAppSelector(selectSavedArticles);
  const loading = useAppSelector(selectArticlesLoading);
  const error = useAppSelector(selectArticlesError);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedArticles();
  }, []);

  const loadSavedArticles = async () => {
    try {
      await dispatch(fetchSavedArticles()).unwrap();
    } catch (err) {
      console.error('Failed to fetch saved articles:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchSavedArticles()).unwrap();
    } catch (err) {
      console.error('Failed to refresh saved articles:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleArticlePress = (articleId: number) => {
    navigation.navigate('ArticleDetail', {articleId});
  };

  const handleLike = async (article: Article) => {
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

  const handleUnsave = async (article: Article) => {
    try {
      await dispatch(unsaveArticle(article.id)).unwrap();
    } catch (err) {
      console.error('Failed to unsave article:', err);
    }
  };

  const renderArticleCard = ({item}: {item: Article}) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item.id)}
      onLike={() => handleLike(item)}
      onSave={() => handleUnsave(item)}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Icon name="bookmark-outline" size={64} color={colors.gray[400]} />
        <Text style={styles.emptyText}>No saved articles</Text>
        <Text style={styles.emptySubtext}>
          Articles you save will appear here
        </Text>
      </View>
    );
  };

  if (loading && savedArticles.length === 0) {
    return <LoadingSpinner fullScreen message="Loading saved articles..." />;
  }

  if (error && savedArticles.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadSavedArticles}
        fullScreen
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Articles</Text>
        {savedArticles.length > 0 && (
          <Text style={styles.headerCount}>
            {savedArticles.length} {savedArticles.length === 1 ? 'article' : 'articles'}
          </Text>
        )}
      </View>

      <FlatList
        data={savedArticles}
        renderItem={renderArticleCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
  },
  headerCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
  },
});

export default SavedScreen;
