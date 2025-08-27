import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

// Memoized Completed Question Component
export const OptimizedCompletedQuestion = memo(({
  index,
  question,
  answer,
  onEdit,
  animation,
  theme,
}: {
  index: number;
  question: string;
  answer: string;
  onEdit: () => void;
  animation: Animated.Value;
  theme: any;
}) => {
  return (
    <Animated.View
      style={[
        styles.questionContainer,
        {
          opacity: animation,
          transform: [{
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.questionHeader}>
        <Text style={[styles.questionText, { color: theme.TEXT_PRIMARY }]}>
          {question}
        </Text>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Text style={[styles.editButtonText, { color: theme.PRIMARY }]}>编辑</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.answerText, { color: theme.TEXT_SECONDARY }]}>
        {answer}
      </Text>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.index === nextProps.index &&
    prevProps.question === nextProps.question &&
    prevProps.answer === nextProps.answer &&
    prevProps.theme === nextProps.theme
  );
});

OptimizedCompletedQuestion.displayName = 'OptimizedCompletedQuestion';

// Memoized Action Button Component
export const OptimizedActionButton = memo(({
  title,
  onPress,
  disabled,
  style,
  textStyle,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionButton,
        disabled && styles.actionButtonDisabled,
        style,
      ]}
    >
      <Text style={[styles.actionButtonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.disabled === nextProps.disabled
  );
});

OptimizedActionButton.displayName = 'OptimizedActionButton';

// Memoized Loading Indicator
export const OptimizedLoadingIndicator = memo(({
  isVisible,
  message,
  theme,
}: {
  isVisible: boolean;
  message?: string;
  theme: any;
}) => {
  if (!isVisible) return null;
  
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.BACKGROUND }]}>
      <View style={styles.loadingContent}>
        <Text style={[styles.loadingText, { color: theme.TEXT_PRIMARY }]}>
          {message || '加载中...'}
        </Text>
      </View>
    </View>
  );
});

OptimizedLoadingIndicator.displayName = 'OptimizedLoadingIndicator';

// Memoized Error Message Component
export const OptimizedErrorMessage = memo(({
  error,
  theme,
}: {
  error: string | null;
  theme: any;
}) => {
  if (!error) return null;
  
  return (
    <View style={[styles.errorContainer, { backgroundColor: theme.ERROR_BG }]}>
      <Text style={[styles.errorText, { color: theme.ERROR }]}>{error}</Text>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.error === nextProps.error;
});

OptimizedErrorMessage.displayName = 'OptimizedErrorMessage';

const styles = StyleSheet.create({
  questionContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    padding: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
});