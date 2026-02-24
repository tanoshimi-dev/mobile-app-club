/**
 * Home Screen
 * Main news feed with infinite scroll
 */
import React, {useEffect, useState} from 'react';
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
import {AppStackParamList} from '../../navigation/AppStack';
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
import {colors, spacing, fontSize} from '../../theme';
import {ArticleCard, LoadingSpinner, ErrorMessage} from '../../components';
import {Article} from '../../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const articles = useAppSelector(selectArticles);
  const loading = useAppSelector(selectArticlesLoading);
  const error = useAppSelector(selectArticlesError);
  const hasMore = useAppSelector(selectHasMore);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadInitialArticles();
  }, []);

  const loadInitialArticles = async () => {
    try {
      await dispatch(fetchArticles({reset: true})).unwrap();
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchArticles({reset: true})).unwrap();
    } catch (err) {
      console.error('Failed to refresh articles:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

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
