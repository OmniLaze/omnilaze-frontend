import React, { useState, useEffect, useCallback } from 'react';
import { View, Animated, Modal, TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { ActionButton } from './ActionButton';
import { useTheme } from '../contexts/ColorThemeContext';
import { createQuestionStyles } from '../styles/globalStyles';
import { useTypewriterEffect } from '../hooks';
import { TIMING } from '../constants';
import { createPayment, queryPaymentStatus, redirectToAlipayPayment, CreatePaymentResponse } from '../services/api';

interface OrderConfirmationComponentProps {
  // 用户填写的所有信息
  address: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  budget: string;
  isFreeOrder?: boolean;
  
  // 用户信息
  authResult?: any; // 包含userId和phoneNumber
  
  // 动画和状态
  animationValue: Animated.Value;
  onConfirmOrder: () => void;
  onPaymentComplete?: (success: boolean, orderText?: string) => void;
  
  // 处理状态
  isOrderProcessing?: boolean;
  isPaymentModalVisible?: boolean;
  isPaymentCompleted?: boolean; // 新增：指示支付是否已完成
  currentOrderId?: string | null; // 新增：使用已创建的订单ID进行支付
  
  // CurrentQuestion需要的动画参数
  currentQuestionAnimation?: Animated.Value;
  shakeAnimation?: Animated.Value;
  emotionAnimation?: Animated.Value;
  
  // 新增：通知父组件支付按钮应该显示
  onShouldShowPaymentButton?: (shouldShow: boolean) => void;
}

export const OrderConfirmationComponent: React.FC<OrderConfirmationComponentProps> = ({
  address,
  deliveryTime,
  selectedAllergies,
  selectedPreferences,
  selectedFoodType,
  budget,
  isFreeOrder = false,
  authResult,
  animationValue,
  onConfirmOrder,
  onPaymentComplete,
  isOrderProcessing = false,
  isPaymentModalVisible = false,
  isPaymentCompleted = false, // 新增参数
  currentOrderId = null,
  currentQuestionAnimation = new Animated.Value(1),
  shakeAnimation = new Animated.Value(0),
  emotionAnimation = new Animated.Value(1),
  onShouldShowPaymentButton,
}) => {

  const { theme } = useTheme();
  const questionStyles = createQuestionStyles(theme);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // 原有的UI控制状态
  const [showGoToPaymentButton, setShowGoToPaymentButton] = useState(false);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [hasShownSummary, setHasShownSummary] = useState(false);
  const [manualDisplayText, setManualDisplayText] = useState(''); // 备用文字显示
  
  // 独立的打字机效果用于总结文字显示
  const { 
    displayedText: summaryDisplayedText, 
    isTyping: summaryIsTyping, 
    typeText: typeSummaryText,
    clearText: clearSummaryText
  } = useTypewriterEffect();
  
  // 新增的支付状态
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse['data'] | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'checking' | 'success' | 'failed'>('idle');
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  
  // 格式化用户信息为订单确认文字
  const formatOrderConfirmationText = useCallback(() => {
    const foodTypeText = selectedFoodType.includes('drink') ? '奶茶' : '正餐';
    const allergyText = selectedAllergies.length > 0 
      ? Array.from(new Set(selectedAllergies.filter(a => a !== 'none').map(a => {
          // 只包含 checkboxOptions.ts 中原有的选项
          const allergyMap: Record<string, string> = {
            'seafood': '海鲜类',
            'nuts': '坚果类',
            'eggs': '蛋类',
            'soy': '大豆类',
            'dairy': '乳制品类',
            'other-allergy': '其他'
          };
          return allergyMap[a] || a;
        }))).sort((a, b) => a.localeCompare(b, 'zh-CN')).join('、')
      : '';
    
    const preferenceText = selectedPreferences.map(p => {
      const preferenceMap: Record<string, string> = {
        'spicy': '辣',
        'mild': '不辣',
        'sour': '酸',
        'sweet': '甜',
        'light': '清淡',
        'rich': '浓郁',
        'sour-sweet': '酸甜',
        'salty': '咸香',
        'creamy': '奶香',
        'other-preference': '其他'
      };
      return preferenceMap[p] || p;
    }).join('、');
    
    const deliveryTimeText = deliveryTime === 'ASAP' ? '越快越好' : deliveryTime;
    
    let text = `收到，我现在下单\n`;
    text += `为你在 ${address}，\n`;
    text += `安排一份${allergyText ? `不要${allergyText}的` : ''}${preferenceText}口味${foodTypeText}，\n`;
    text += `并且选择${deliveryTimeText}的配送。\n`;
    text += `我会尽力使订单价格逼近${budget}元，\n`;
    text += `若实际下单费用小于${budget}，超出部分将自动退款至你的账户。\n\n`;
    text += `感谢信任！`;
    
    return text;
  }, [address, deliveryTime, selectedAllergies, selectedPreferences, selectedFoodType, budget]);
  
  // 组件挂载时自动显示总结文字
  useEffect(() => {
    // 如果支付已完成，直接显示静态文本，不运行打字机效果
    if (isPaymentCompleted) {
      const summaryText = formatOrderConfirmationText();
      console.log('💰 支付已完成，显示静态文本:', summaryText);
      setManualDisplayText(summaryText);
      setHasShownSummary(true);
      // 支付完成后通知父组件隐藏支付按钮
      onShouldShowPaymentButton?.(false);
      return;
    }
    
    if (!hasShownSummary) {
      const summaryText = formatOrderConfirmationText();
      
      console.log('📋 开始显示总结文字:', summaryText);
      console.log('📋 文字长度:', summaryText.length);
      console.log('📋 typeSummaryText函数:', typeof typeSummaryText);
      
      // 立即设置手动显示文字作为备用
      setManualDisplayText(summaryText);
      
      // 尝试使用打字机效果
      try {
        typeSummaryText(summaryText, {
          instant: false,
          streaming: false,
          // 使出字速度与输入组件一致
          speed: TIMING.TYPING_SPEED,
          onComplete: () => {
            console.log('📝 总结文字显示完成，通知父组件显示支付按钮');
            setHasShownSummary(true);
            // 通知父组件显示悬浮支付按钮
            onShouldShowPaymentButton?.(true);
          }
        });
      } catch (error) {
        console.error('📋 打字机效果错误:', error);
        // 如果打字机效果失败，直接显示按钮
        console.log('📋 使用备用显示方式');
        setTimeout(() => {
          setHasShownSummary(true);
          // 通知父组件显示悬浮支付按钮
          onShouldShowPaymentButton?.(true);
        }, 1000); // 给用户时间看到文字
      }
    }
  }, [isPaymentCompleted]); // 依赖isPaymentCompleted而不是空数组
  
  // 添加调试用的useEffect来监听状态变化
  useEffect(() => {
  }, [hasShownSummary, showGoToPaymentButton, summaryDisplayedText, summaryIsTyping]);
  
  // 处理确认下单 - 现在只触发支付弹窗
  const handleConfirmOrder = () => {
    console.log('💳 触发支付弹窗');
    setShowPaymentModal(true);
  };
  
  // 处理"去支付"按钮点击
  const handleGoToPayment = () => {
    setShowGoToPaymentButton(false);
    setShowPaymentModal(true);
    setPaymentError(null);
    setPaymentStatus('idle');
  };
  
  // 创建支付订单
  const handleCreatePayment = async () => {
    if (isFreeOrder) {
      // 免单订单直接成功
      handlePaymentComplete(true);
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentStatus('processing');

    try {
      // 优先使用上游已创建的订单ID，避免重复创建
      const orderId = currentOrderId;
      if (!orderId) {
        throw new Error('订单未创建，请返回上一步重试');
      }

      // 创建支付
      console.log('💳 创建支付(已有订单):', { orderId, amount: parseFloat(budget) });
      const response = await createPayment({
        orderId,
        provider: 'alipay',
        amount: parseFloat(budget),
        paymentMethod: 'h5',
      });

      if (response.success && response.data) {
        setPaymentData(response.data);

        if (response.data.h5_url) {
          // 支付宝H5支付：跳转到支付页面
          const returnUrl = Platform.OS === 'web'
            ? `${window.location.origin}/payment/callback`
            : 'omnilaze://payment/callback';

          redirectToAlipayPayment(response.data.h5_url, returnUrl);

          // 开始轮询支付状态
          startPaymentStatusCheck(response.data.payment_id);
        } else if (response.data.qr_code) {
          // TODO: 兼容二维码支付
        }
      } else {
        setPaymentError(response.message || '创建支付失败');
        setPaymentStatus('failed');
      }
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : '支付创建失败，请重试');
      setPaymentStatus('failed');
    } finally {
      setPaymentLoading(false);
    }
  };
  
  // 轮询支付状态
  const startPaymentStatusCheck = (paymentId: string) => {
    setPaymentStatus('checking');
    
    // 清除之前的轮询
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }
    
    // 每3秒查询一次支付状态
    const interval = setInterval(async () => {
      try {
        const response = await queryPaymentStatus(paymentId);
        
        if (response.success && response.data) {
          if (response.data.status === 'succeeded') {
            // 支付成功
            clearInterval(interval);
            setPaymentStatus('success');
            handlePaymentComplete(true);
          } else if (response.data.status === 'failed') {
            // 支付失败
            clearInterval(interval);
            setPaymentStatus('failed');
            setPaymentError('支付失败，请重试');
          }
          // 其他状态继续轮询
        }
      } catch (error) {
        console.error('查询支付状态失败:', error);
      }
    }, 3000);
    
    setStatusCheckInterval(interval);
    
    // 5分钟后停止轮询
    setTimeout(() => {
      clearInterval(interval);
      if (paymentStatus === 'checking') {
        setPaymentStatus('failed');
        setPaymentError('支付超时，请检查支付状态');
      }
    }, 5 * 60 * 1000);
  };
  
  // 清理轮询
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);
  
  // 处理支付完成
  const handlePaymentComplete = (success: boolean) => {
    if (success) {
      // 支付成功，仅通知父组件；不再重复创建/提交订单
      const orderText = formatOrderConfirmationText();
      onPaymentComplete?.(true, orderText);
    } else {
      // 支付取消时：1. 通知父组件关闭弹窗 2. 重新显示支付按钮
      onPaymentComplete?.(false);
      onShouldShowPaymentButton?.(true);
    }
  };
  
  const styles = createStyles(theme);
  
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
      
      {/* 总结文字显示区域 - 优先显示打字机效果，备用显示手动文字 */}
      <Animated.View style={{ opacity: 1, marginBottom: 12 }}>
        <Text style={[questionStyles.currentQuestionText, { minHeight: 20 }]}>
          {summaryDisplayedText || manualDisplayText || "正在加载..."}
          {summaryIsTyping && (
            <Animated.Text style={[questionStyles.cursor, { opacity: 1, fontSize: 18, color: questionStyles.cursor.color }]}>|
            </Animated.Text>
          )}
        </Text>
      </Animated.View>
      
      {/* 支付弹窗 */}
      <Modal
        visible={isPaymentModalVisible || false}
        transparent={true}
        animationType="slide"
        onRequestClose={() => onShouldShowPaymentButton?.(true)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>支付宝支付</Text>
            
            {paymentStatus === 'idle' && (
              <>
                <Text style={styles.modalText}>
                  支付金额：¥{budget}
                </Text>
                <Text style={styles.modalNote}>
                  {isFreeOrder ? '免单订单' : '点击下方按钮进行支付宝支付'}
                </Text>
              </>
            )}
            
            {paymentStatus === 'processing' && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.PRIMARY} />
                <Text style={styles.loadingText}>正在创建支付订单...</Text>
              </View>
            )}
            
            {paymentStatus === 'checking' && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.PRIMARY} />
                <Text style={styles.loadingText}>正在等待支付结果...</Text>
                <Text style={styles.modalNote}>请在弹出的页面完成支付</Text>
              </View>
            )}
            
            {paymentStatus === 'success' && (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>支付成功！</Text>
              </View>
            )}
            
            {paymentError && (
              <Text style={styles.errorText}>{paymentError}</Text>
            )}
            
            {/* 支付按钮 */}
            <View style={styles.modalButtons}>
              {paymentStatus === 'idle' && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreatePayment}
                  disabled={paymentLoading}
                >
                  <Text style={styles.confirmButtonText}>
                    {isFreeOrder ? '确认免单' : '去支付'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {paymentStatus === 'checking' && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={() => {
                    // 重新打开支付页面
                    if (paymentData?.h5_url) {
                      redirectToAlipayPayment(paymentData.h5_url);
                    }
                  }}
                >
                  <Text style={styles.confirmButtonText}>重新打开支付页面</Text>
                </TouchableOpacity>
              )}
              
              {paymentStatus === 'failed' && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleCreatePayment}
                >
                  <Text style={styles.confirmButtonText}>重试</Text>
                </TouchableOpacity>
              )}
              
              {paymentStatus !== 'success' && (
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowPaymentModal(false);
                    if (statusCheckInterval) {
                      clearInterval(statusCheckInterval);
                    }
                    handlePaymentComplete(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </WrapperComponent>
  );
};

const createStyles = (theme: any) => {
  const { width } = Dimensions.get('window');
  return StyleSheet.create({
    container: {
      marginTop: width > 768 ? 16 : 8, // 移动端减少顶部间距，与其他组件保持一致
    },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    color: theme.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalNote: {
    fontSize: 14,
    color: theme.TEXT_SECONDARY,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: theme.PRIMARY,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: theme.TEXT_SECONDARY,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.TEXT_PRIMARY,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    color: theme.PRIMARY,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
});
};
