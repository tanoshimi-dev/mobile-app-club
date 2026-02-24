/**
 * Search Screen
 * Search for articles
 */
import React, {useState} from 'react';
import {View, Text, StyleSheet, FlatList, TextInput} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from '../../components/icons/Icon';
import {AppStackParamList} from '../../navigation/AppStack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  searchArticles,
  likeArticle,
  unlikeArticle,
  saveArticle,
  unsaveArticle,
  selectSearchResults,
  selectSearchLoading,
} from '../../store/slices/articlesSlice';
import {colors, spacing, fontSize} from '../../theme';
import {ArticleCard, LoadingSpinner} from '../../components';
import {Article} from '../../types';

type SearchScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  'Search'
>;

interface Props {
  navigation: SearchScreenNavigationProp;
}

const SearchScreen: React.FC<Props> = ({navigation}) => {
  const dispatch = useAppDispatch();
  const searchResults = useAppSelector(selectSearchResults);
  const loading = useAppSelector(selectSearchLoading);

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setHasSearched(true);
    try {
      await dispatch(searchArticles(query)).unwrap();
    } catch (err) {
      console.error('Failed to search articles:', err);
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

  const renderArticleCard = ({item}: {item: Article}) => (
    <ArticleCard
      article={item}
      onPress={() => handleArticlePress(item.id)}
      onLike={() => handleLike(item)}
      onSave={() => handleSave(item)}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="search" size={64} color={colors.gray[400]} />
          <Text style={styles.emptyText}>Search for articles</Text>
          <Text style={styles.emptySubtext}>
            Enter keywords to find articles
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Icon name="sad-outline" size={64} color={colors.gray[400]} />
        <Text style={styles.emptyText}>No results found</Text>
        <Text style={styles.emptySubtext}>
          Try different keywords
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search articles..."
          placeholderTextColor={colors.gray[400]}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoFocus
        />
      </View>

      {loading ? (
        <LoadingSpinner message="Searching..." />
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderArticleCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
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
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 44,
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

export default SearchScreen;
