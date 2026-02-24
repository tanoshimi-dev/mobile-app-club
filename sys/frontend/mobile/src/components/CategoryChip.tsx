/**
 * Category Chip Component
 * Selectable category chip for filtering
 */
import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle} from 'react-native';
import {colors, spacing, fontSize, categoryColors} from '../theme';
import {Category} from '../types';

interface CategoryChipProps {
  category: Category;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  selected = false,
  onPress,
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

  const categoryColor = getCategoryColor(category.name);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected
          ? {backgroundColor: categoryColor}
          : {backgroundColor: colors.gray[100], borderColor: categoryColor},
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : {color: categoryColor},
        ]}>
        {category.name}
      </Text>
      <Text style={[styles.count, selected && styles.countSelected]}>
        {category.article_count || 0}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginRight: spacing.xs,
  },
  textSelected: {
    color: colors.white,
  },
  count: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  countSelected: {
    color: colors.white,
    opacity: 0.8,
  },
});

export default CategoryChip;
