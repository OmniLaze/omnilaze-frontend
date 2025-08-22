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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.BORDER,
    marginTop: 6,
    overflow: 'hidden',
    shadowColor: theme.SHADOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 9999,
    ...Platform.select({
      web: {
        position: 'fixed' as any, // web端使用fixed定位
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      },
    }),
  } as any,
  
  suggestionsList: {
    // 只显示三行的高度由外部slice控制，这里不强制高度
  },
  
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  } as any,
  
  suggestionIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  
  suggestionTextContainer: {
    flex: 1,
  },
  
  suggestionMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
    marginBottom: 2,
  },
  
  suggestionSecondaryText: {
    fontSize: 12,
    color: theme.GRAY_500,
    fontWeight: '400',
  },
  
  loadingContainer: {
    padding: 6,
    marginLeft: 6,
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
      backgroundColor: '#F8FAFC',
    },
    default: {},
  }) as any,
});
