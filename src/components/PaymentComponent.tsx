import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet, Platform } from 'react-native';
import { ActionButton } from './ActionButton';
import { COLORS } from '../constants';
import { useTheme } from '../contexts/ColorThemeContext';

interface PaymentComponentProps {
  budget: string;
  animationValue: Animated.Value;
  onConfirmOrder: () => void;
  isTyping?: boolean; // 新增：是否正在打字
  isFreeOrder?: boolean; // 新增：是否为免单
}

export const PaymentComponent: React.FC<PaymentComponentProps> = ({
  budget,
  animationValue,
  onConfirmOrder,
  isTyping = false,
  isFreeOrder = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [showPaymentContent, setShowPaymentContent] = useState(false);

  // 🔧 性能优化：使用 useRef 避免重复创建 Animated.Value
  const buttonAnimationValue = useRef(new Animated.Value(1)).current;

  // 监听打字机状态，打字完成后延迟显示支付内容
  useEffect(() => {
    if (!isTyping) {
      // 打字机效果完成后，延迟1秒显示支付内容
      const timer = setTimeout(() => {
        setShowPaymentContent(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // 如果正在打字，隐藏支付内容
      setShowPaymentContent(false);
    }
  }, [isTyping]);
  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
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
        ],
      }
    : { style: styles.container };

  return (
    <WrapperComponent {...wrapperProps}>
      {/* 只有在打字机效果完成且showPaymentContent为true时才显示支付内容 */}
      {showPaymentContent && (
        <>
          {/* 支付卡片 - 纵向瘦长布局 */}
          <View style={[styles.paymentCard, isFreeOrder && styles.freeOrderCard]}>
            <View style={styles.cardContent}>
              {isFreeOrder ? (
                // 免单显示
                <View style={styles.freeOrderContainer}>
                  <View style={styles.freeOrderIconContainer}>
                    <Text style={styles.freeOrderIcon}>🎉</Text>
                  </View>
                  <Text style={styles.freeOrderTitle}>恭喜您！</Text>
                  <Text style={styles.freeOrderSubtitle}>邀请奖励免单</Text>
                  <View style={styles.freeOrderAmountContainer}>
                    <Text style={styles.originalPrice}>原价：¥{budget}</Text>
                    <Text style={styles.freePrice}>免单：¥0</Text>
                  </View>
                  <Text style={styles.freeOrderNote}>
                    感谢您的邀请贡献 🧋
                  </Text>
                </View>
              ) : (
                // 正常支付显示
                <>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={require('../../assets/food/支付二维码.png')} 
                      style={styles.qrCodeImage}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.wechatText}>请支付金额：¥{budget}</Text>
                    <Text style={styles.budgetText}>请在付款时备注完整手机号</Text>
                  </View>
                </>
              )}
            </View>
          </View>
          
          {/* 确认按钮 */}
          <View style={styles.buttonContainer}>
            <ActionButton
              onPress={onConfirmOrder}
              title={isFreeOrder ? "确认免单" : "确认下单"}
              isActive={true}
              animationValue={buttonAnimationValue}
            />
          </View>
        </>
      )}
    </WrapperComponent>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 16,
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
  },
  paymentCard: {
    width: 280, // 纵向瘦长的宽度
    height: 400, // 纵向瘦长的高度
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    padding: 24,
    shadowColor: COLORS.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'column', // 纵向布局
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  imageContainer: {
    width: 200, // 纵向布局的二维码容器
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrCodeImage: {
    width: 180, // 纵向布局的二维码大小
    height: 280,
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wechatText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.PRIMARY,
    marginBottom: 8,
  },
  budgetText: {
    fontSize: 20, // 金额文字稍大
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
    marginLeft: 0, // 移除负边距，现在不需要抵消
  },
  // 免单相关样式
  freeOrderCard: {
    borderColor: theme.PRIMARY,
    backgroundColor: theme.PRIMARY,
  },
  freeOrderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    height: '100%',
  },
  freeOrderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  freeOrderIcon: {
    fontSize: 40,
  },
  freeOrderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    }),
  },
  freeOrderSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 1px 1px rgba(0, 0, 0, 0.3)',
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    }),
  },
  freeOrderAmountContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  originalPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'line-through',
    marginBottom: 4,
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 1px 1px rgba(0, 0, 0, 0.5)',
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    }),
  },
  freePrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 2px 4px rgba(0, 0, 0, 0.6)',
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    }),
  },
  freeOrderNote: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
    ...(Platform.OS === 'web' ? {
      textShadow: '0px 1px 1px rgba(0, 0, 0, 0.3)',
    } : {
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    }),
  },
});