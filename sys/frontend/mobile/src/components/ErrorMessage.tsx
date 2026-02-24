/**
 * Error Message Component
 * Displays error state with retry option
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from './icons/Icon';
import {colors, spacing, fontSize} from '../theme';
import Button from './Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen
    ? styles.fullScreenContainer
    : styles.inlineContainer;

  return (
    <View style={containerStyle}>
      <Icon name="alert-circle" size={48} color={colors.error} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button
          title="Retry"
          onPress={onRetry}
          variant="outline"
          size="small"
          style={styles.retryButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  inlineContainer: {
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    minWidth: 120,
  },
});

export default ErrorMessage;
