import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { useTheme } from '../contexts/ColorThemeContext';

interface OrderDetailSectionProps {
  label: string;
  value: string | React.ReactNode;
  icon?: string;
  action?: () => void;
  actionIcon?: string;
  expandable?: boolean;
  expanded?: boolean;
  children?: React.ReactNode;
  showDivider?: boolean;
}

/**
 * 订单详情区块组件 - 采用CompletedQuestion的简洁风格
 */
export const OrderDetailSection: React.FC<OrderDetailSectionProps> = ({
  label,
  value,
  icon,
  action,
  actionIcon = 'copy',
  expandable = false,
  expanded = false,
  children,
  showDivider = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isExpanded, setIsExpanded] = React.useState(expanded);

  const handlePress = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    } else if (action) {
      action();
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        activeOpacity={expandable || action ? 0.6 : 1}
        disabled={!expandable && !action}
      >
        <View style={styles.content}>
          {/* 左侧图标（可选） */}
          {icon && (
            <View style={styles.iconContainer}>
              <SimpleIcon name={icon} size={16} color={theme.TEXT_SECONDARY} />
            </View>
          )}
          
          {/* 主内容区域 */}
          <View style={styles.mainContent}>
            {/* 标签 - 类似问题文本 */}
            <Text style={styles.label}>{label}</Text>
            
            {/* 值 - 类似答案文本 */}
            <View style={styles.valueContainer}>
              {typeof value === 'string' ? (
                <Text style={styles.value}>{value}</Text>
              ) : (
                value
              )}
              
              {/* 操作按钮 */}
              {action && !expandable && (
                <TouchableOpacity
                  onPress={action}
                  style={styles.actionButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <SimpleIcon name={actionIcon} size={14} color={theme.TEXT_SECONDARY} />
                </TouchableOpacity>
              )}
              
              {/* 展开/收起图标 */}
              {expandable && (
                <View style={styles.expandIcon}>
                  <SimpleIcon 
                    name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                    size={14} 
                    color={theme.TEXT_SECONDARY} 
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* 展开的内容 */}
      {expandable && isExpanded && children && (
        <View style={styles.expandedContent}>
          {children}
        </View>
      )}
      
      {/* 分隔线 */}
      {showDivider && <View style={styles.divider} />}
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 24,
    marginRight: 12,
    paddingTop: 2,
  },
  mainContent: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: theme.TEXT_SECONDARY,
    fontWeight: '400',
    marginBottom: 4,
    lineHeight: 20,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: 16,
    color: theme.TEXT_PRIMARY,
    fontWeight: '400',
    lineHeight: 22,
    flex: 1,
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  expandIcon: {
    padding: 4,
    marginLeft: 8,
  },
  expandedContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingLeft: Platform.OS === 'web' ? 56 : 44, // 对齐内容
  },
  divider: {
    height: 1,
    backgroundColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 20,
    marginVertical: 8,
  },
});