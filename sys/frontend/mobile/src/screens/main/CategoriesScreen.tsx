/**
 * Categories Screen
 * Browse articles by category
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {RootStackParamList} from '../../navigation/RootNavigator';
import {MainTabParamList} from '../../navigation/MainTabs';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  fetchCategories,
  selectCategories,
  selectCategoriesLoading,
  selectCategoriesError,
} from '../../store/slices/categoriesSlice';
import {
  fetchArticles,
  likeArticle,
  unlikeArticle,
  saveArticle,
  unsaveArticle,
  selectArticles,
  selectArticlesLoading,
  selectHasMore,
} from '../../store/slices/articlesSlice';
import {colors, spacing, fontSize} from '../../theme';
import {
  CategoryChip,
  ArticleCard,
  LoadingSpinner,
  ErrorMessage,
} from '../../components';
import {Article} from '../../types';

type CategoriesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Categories'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: CategoriesScreenNavigationProp;
}

const CategoriesScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();

  const categories = useAppSelector(selectCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const categoriesError = useAppSelector(selectCategoriesError);

  const articles = useAppSelector(selectArticles);
  const articlesLoading = useAppSelector(selectArticlesLoading);
  const hasMore = useAppSelector(selectHasMore);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId !== null) {
      loadArticlesByCategory();
    }
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      await dispatch(fetchCategories()).unwrap();
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const loadArticlesByCategory = async () => {
    if (selectedCategoryId === null) return;
    try {
      await dispatch(
        fetchArticles({filters: {category: selectedCategoryId}}),
      ).unwrap();
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchCategories()).unwrap(),
        selectedCategoryId !== null
          ? dispatch(
              fetchArticles({filters: {category: selectedCategoryId}}),
            ).unwrap()
          : Promise.resolve(),
      ]);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || selectedCategoryId === null) return;

    setLoadingMore(true);
    try {
      await dispatch(
        fetchArticles({filters: {category: selectedCategoryId}, loadMore: true}),
      ).unwrap();
    } catch (err) {
      console.error('Failed to load more articles:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryPress = (categoryId: number) => {
    setSelectedCategoryId(categoryId === selectedCategoryId ? null : categoryId);
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

  const renderCategoryChip = ({item}: {item: any}) => (
    <CategoryChip
      category={item}
      selected={item.id === selectedCategoryId}
      onPress={() => handleCategoryPress(item.id)}
    />
  );

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
    if (articlesLoading) return null;
    if (selectedCategoryId === null) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Select a category</Text>
          <Text style={styles.emptySubtext}>
            Choose a category above to see articles
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No articles found</Text>
        <Text style={styles.emptySubtext}>Try selecting another category</Text>
      </View>
    );
  };

  if (categoriesLoading && categories.length === 0) {
    return <LoadingSpinner fullScreen message="Loading categories..." />;
  }

  if (categoriesError && categories.length === 0) {
    return (
      <ErrorMessage message={categoriesError} onRetry={loadCategories} fullScreen />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryChip}
          keyExtractor={item => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {articlesLoading && articles.length === 0 ? (
        <LoadingSpinner message="Loading articles..." />
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticleCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.articlesList}
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
      )}
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
  categoriesContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
  },
  articlesList: {
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

export default CategoriesScreen;
