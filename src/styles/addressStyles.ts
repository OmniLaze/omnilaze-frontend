import { StyleSheet, Platform } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

export const addressAutocompleteStyles = (theme: any = COLORS) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 9999, // 提高z-index
  },
  
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.WHITE,
    borderRadius: LAYOUT.BORDER_RADIUS,
    marginTop: 4,
    shadowColor: theme.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 999, // 提高elevation
    zIndex: 9999, // 添加高z-index
    maxHeight: 200,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
        position: 'fixed' as any, // web端使用fixed定位
      },
    }),
  } as any,
  
  suggestionsList: {
    maxHeight: 200,
  },
  
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.GRAY_100,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  } as any,
  
  suggestionIcon: {
    marginRight: 12,
    flexShrink: 0,
  },
  
  suggestionTextContainer: {
    flex: 1,
  },
  
  suggestionMainText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    marginBottom: 2,
  },
  
  suggestionSecondaryText: {
    fontSize: 14,
    color: theme.GRAY_500,
    fontWeight: '400',
  },
  
  loadingContainer: {
    padding: 8,
    marginLeft: 8,
  },
  
  // 确保下拉框在web端正确显示
  webDropdown: Platform.select({
    web: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 9999,
      backgroundColor: theme.WHITE,
      borderRadius: LAYOUT.BORDER_RADIUS,
      marginTop: 4,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
      maxHeight: 200,
      overflow: 'auto',
    },
    default: {},
  }) as any,
  
  // 鼠标悬停效果 (仅web)
  suggestionItemHover: Platform.select({
    web: {
      backgroundColor: theme.GRAY_50,
    },
    default: {},
  }) as any,
});