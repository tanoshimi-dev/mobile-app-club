/**
 * Home Screen
 * Main news feed with infinite scroll
 */
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import Icon from '../../components/icons/Icon';
import {RootStackParamList} from '../../navigation/RootNavigator';
import {MainTabParamList} from '../../navigation/MainTabs';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  fetchArticles,
  likeArticle,
  unlikeArticle,
  saveArticle,
  unsaveArticle,
  selectArticles,
  selectArticlesLoading,
  selectArticlesError,
  selectHasMore,
} from '../../store/slices/articlesSlice';
import {apiService} from '../../services/api';
import {colors, spacing, fontSize} from '../../theme';
import {ArticleCard, LoadingSpinner, ErrorMessage} from '../../components';
import {Article} from '../../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const reduxArticles = useAppSelector(selectArticles);
  const loading = useAppSelector(selectArticlesLoading);
  const error = useAppSelector(selectArticlesError);
  const hasMore = useAppSelector(selectHasMore);

  // Local state fallback — bypasses Redux to diagnose the issue
  const [localArticles, setLocalArticles] = useState<Article[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Use whichever has data
  const articles = reduxArticles.length > 0 ? reduxArticles : localArticles;

  console.log('[HomeScreen] render — redux:', reduxArticles.length, 'local:', localArticles.length, 'display:', articles.length);

  useEffect(() => {
    loadInitialArticles();
  }, []);

  const loadInitialArticles = async () => {
    // Try Redux first
    try {
      const result = await dispatch(fetchArticles({})).unwrap();
      console.log('[HomeScreen] Redux OK — articles:', result.articles?.length);
      setLocalArticles(result.articles || []);
      return; // Redux worked, done
    } catch (err) {
      console.warn('[HomeScreen] Redux failed:', err);
    }

    // Fallback: direct API call (bypasses auth token issues)
    // try {
    //   console.log('[HomeScreen] Trying direct API call...');
    //   const response = await apiService.getArticles({page: 1, page_size: 20});
    //   console.log('[HomeScreen] Direct API OK — articles:', response.results?.length);
    //   setLocalArticles(response.results || []);
    // } catch (err: any) {
    //   console.error('[HomeScreen] Direct API also failed:', err.message);
    // }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('[HomeScreen] Refreshing articles...');
      await dispatch(fetchArticles({})).unwrap();
    } catch (err) {
      // Fallback
      try {
        // const response = await apiService.getArticles({page: 1, page_size: 20});
        // setLocalArticles(response.results || []);
      } catch (_) {}
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore || articles.length === 0) return;

    setLoadingMore(true);
    try {
      await dispatch(fetchArticles({loadMore: true})).unwrap();
    } catch (err) {
      console.error('Failed to load more articles:', err);
    } finally {
      setLoadingMore(false);
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

  const handleSave = async (article: Article) => {
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

  const handleSearch = () => {
    navigation.navigate('Search');
  };

  const renderArticleCard = ({item}: {item: Article}) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item.id)}
      onLike={() => handleLike(item)}
      onSave={() => handleSave(item)}
    />
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return <LoadingSpinner message="Loading more..." />;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No articles found</Text>
        <Text style={styles.emptySubtext}>Pull down to refresh</Text>
      </View>
    );
  };

  if (loading && articles.length === 0) {
    return <LoadingSpinner fullScreen message="Loading articles..." />;
  }

  if (error && articles.length === 0) {
    return (
      <ErrorMessage
        message={error}
        onRetry={loadInitialArticles}
        fullScreen
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>News Feed</Text>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={articles}
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  searchButton: {
    padding: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
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

export default HomeScreen;
