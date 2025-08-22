import { StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

const { width } = Dimensions.get('window');

// 创建平台特定的阴影样式
const createShadowStyle = (shadowColor: string, shadowOffset: {width: number, height: number}, shadowOpacity: number, shadowRadius: number, elevation: number) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
};

// 创建动态输入样式函数
export const createInputStyles = (theme: any = COLORS) => StyleSheet.create({
  inputSection: {
    marginTop: width > 768 ? 16 : 8, // 响应式设计：桌面端16px，移动端8px
    marginBottom: 20,
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
  },
  simpleInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.WHITE,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    // 保持左右边框一致宽度
    borderLeftWidth: 1,
    borderRadius: width > 768 ? 12 : 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
    width: '100%',
    ...createShadowStyle(theme.SHADOW, { width: 0, height: 4 }, 0.06, 6, 2),
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      outlineWidth: 0,
    }),
  } as any,
  simpleInputIcon: {
    marginRight: 12,
    flexShrink: 0,
    opacity: 0.6,
  },
  simpleTextInput: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? (width > 768 ? 12 : 11) : 11,
    color: '#6B7280',
    paddingVertical: 0,
    paddingHorizontal: 0,
    fontWeight: '400',
    letterSpacing: 0.5,
    borderWidth: 0,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
      outlineWidth: 0,
    }),
  } as any,
  disabledSimpleInputWrapper: {
    backgroundColor: '#F8F9FA',
    opacity: 0.8,
  },
  errorSimpleInputWrapper: {
    backgroundColor: theme.ERROR_BACKGROUND,
    borderColor: theme.ERROR,
    borderLeftColor: theme.ERROR,
    ...createShadowStyle(theme.ERROR, { width: 0, height: 0 }, 0.12, 8, 4),
  },
  simpleInputClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  simpleInputEditButton: {
    padding: 4,
    marginLeft: 8,
  },
  multilineInput: {
    minHeight: 88,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.ERROR,
    marginTop: 8,
    marginLeft: 4,
    fontWeight: '400',
  },
});

// 保持默认导出以向后兼容
export const inputStyles = createInputStyles();

export const createBudgetStyles = (theme: any = COLORS) => StyleSheet.create({
  budgetOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
  },
  budgetOptionButton: {
    backgroundColor: theme.WHITE,
    borderWidth: 1,
    borderColor: theme.BORDER,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedBudgetOptionButton: {
    backgroundColor: theme.PRIMARY_WITH_OPACITY || theme.PRIMARY,
    borderColor: theme.PRIMARY,
  },
  budgetOptionText: {
    fontSize: Platform.OS === 'web' ? (width > 768 ? 13 : 12) : 12,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
  },
  selectedBudgetOptionText: {
    color: theme.WHITE,
  },
});

// 保持默认导出以向后兼容
export const budgetStyles = createBudgetStyles();

export const createButtonStyles = (theme: any = COLORS) => StyleSheet.create({
  simpleButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 120,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 0,
    backgroundColor: theme.WHITE,
    borderWidth: 1,
    borderColor: theme.GRAY_300,
    // 移除默认阴影
  },
  activeSimpleButton: {
    backgroundColor: '#FAFAFA',
    borderColor: theme.GRAY_300,
    // 移除默认阴影
  },
  disabledSimpleButton: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hoverSimpleButton: {
    ...(Platform.OS === 'web' && {
      // hover时才显示阴影
      transform: [{ translateY: 0 }],
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      borderColor: '#D1D5DB',
      backgroundColor: '#FCFCFC',
    } as any),
  } as any,
  simpleButtonText: {
    fontSize: Platform.OS === 'web' ? (width > 768 ? 12 : 11) : 11,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.TEXT_PRIMARY,
  },
  activeSimpleButtonText: {
    color: theme.TEXT_PRIMARY,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disabledSimpleButtonText: {
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  nextSimpleButton: {
    backgroundColor: theme.WHITE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.GRAY_300,
    paddingHorizontal: 24,
    paddingVertical: 12,
    minWidth: 120,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 4,
    marginLeft: 0,
    // 移除默认阴影
  },
  nextSimpleButtonText: {
    color: theme.TEXT_PRIMARY,
    fontSize: Platform.OS === 'web' ? (width > 768 ? 12 : 11) : 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// 保持默认导出以向后兼容
export const buttonStyles = createButtonStyles();