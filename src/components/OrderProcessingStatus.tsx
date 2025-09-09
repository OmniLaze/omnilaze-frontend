import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { createQuestionStyles } from '../styles/globalStyles';
import { LoadingDots } from './LoadingDots';

interface OrderProcessingStatusProps {
  currentOrderId: string | null;
  isPaymentCompleted: boolean;
  orderStatus?: string;
  animationValue?: Animated.Value;
}

export const OrderProcessingStatus: React.FC<OrderProcessingStatusProps> = ({
  currentOrderId,
  isPaymentCompleted,
  orderStatus,
  animationValue = new Animated.Value(1),
}) => {
  const { theme } = useTheme();
  const questionStyles = createQuestionStyles(theme);
  const [statusText, setStatusText] = useState('正在挑选');
  
  useEffect(() => {
    // 根据订单状态更新显示文本
    if (orderStatus === 'searching') {
      setStatusText('正在挑选');
    } else if (orderStatus === 'confirmed') {
      setStatusText('餐厅已确认订单');
    } else if (orderStatus === 'preparing') {
      setStatusText('正在准备中');
    } else if (orderStatus === 'delivering') {
      setStatusText('正在配送中');
    } else if (orderStatus === 'delivered') {
      setStatusText('已送达');
    }
  }, [orderStatus]);

  // 只有在支付完成且有订单ID时才显示
  if (!isPaymentCompleted || !currentOrderId) {
    return null;
  }

  const styles = createStyles(theme);
  const { width } = Dimensions.get('window');
  const isMobileLayout = Platform.OS !== 'web' || (Platform.OS === 'web' && width <= 768);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.statusCard}>
        {/* 头像区域 */}
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
        
        {/* 状态文本区域 */}
        <View style={styles.contentContainer}>
          <LoadingDots
            text={statusText}
            style={[questionStyles.currentQuestionText, styles.statusText]}
            dotStyle={questionStyles.currentQuestionText}
            speed={500}
          />
          
          {/* 订单信息 */}
          {currentOrderId && (
            <Text style={styles.orderInfo}>
              订单号: {currentOrderId.slice(0, 8)}...
            </Text>
          )}
        </View>
      </View>
      
      {/* 提示信息 */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          请耐心等待，我们正在为您精心挑选最合适的餐厅
        </Text>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: any) => {
  const { width } = Dimensions.get('window');
  const isMobile = width <= 768;
  
  return StyleSheet.create({
    container: {
      paddingHorizontal: isMobile ? 16 : 24,
      paddingVertical: 20,
    },
    statusCard: {
      flexDirection: 'row',
      backgroundColor: theme.BACKGROUND_SECONDARY,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      ...Platform.select({
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
        default: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        },
      }),
    },
    avatarContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.PRIMARY_LIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    avatarEmoji: {
      fontSize: 24,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    statusText: {
      fontSize: isMobile ? 18 : 20,
      fontWeight: '600',
      color: theme.TEXT_PRIMARY,
      marginBottom: 4,
    },
    orderInfo: {
      fontSize: 14,
      color: theme.TEXT_SECONDARY,
      marginTop: 4,
    },
    hintContainer: {
      paddingHorizontal: 8,
    },
    hintText: {
      fontSize: 14,
      color: theme.TEXT_SECONDARY,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
};