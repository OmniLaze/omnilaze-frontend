import React, { useState, useEffect, useCallback } from 'react';
import { View, Animated, Modal, TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { ActionButton } from './ActionButton';
import { useTheme } from '../contexts/ColorThemeContext';
import { createQuestionStyles } from '../styles/globalStyles';
import { useTypewriterEffect } from '../hooks';
import { TIMING, DEV_CONFIG } from '../constants';
import { createPayment, queryPaymentStatus, redirectToAlipayPayment, CreatePaymentResponse, createOrder } from '../services/api';

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
  isSearchingRestaurant?: boolean; // 新增：搜索餐厅状态
  isOrderCompleted?: boolean; // 新增：订单完成状态
  currentOrderId?: string | null; // 新增：使用已创建的订单ID进行支付
  setShowPaymentModal?: (show: boolean) => void; // 新增：由父组件控制支付弹窗
  // 父组件订单状态同步
  setCurrentOrderId?: (id: string | null) => void;
  setCurrentOrderNumber?: (no: string | null) => void;
  setCurrentUserSequenceNumber?: (seq: number | null) => void;
  
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
  isSearchingRestaurant = false, // 新增参数
  isOrderCompleted = false, // 新增参数
  currentOrderId = null,
  setShowPaymentModal: setShowPaymentModalProp,
  setCurrentOrderId,
  setCurrentOrderNumber,
  setCurrentUserSequenceNumber,
  currentQuestionAnimation = new Animated.Value(1),
  shakeAnimation = new Animated.Value(0),
  emotionAnimation = new Animated.Value(1),
  onShouldShowPaymentButton,
}) => {

  const { theme } = useTheme();
  const questionStyles = createQuestionStyles(theme);
  
  // 支付弹窗可见性由父组件控制；此处不再维护本地副本
  
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
    
    let text = ``;
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
      // 移除立即显示的手动文字，避免先闪一次完整再进入打字
      // 仅在支付完成或打字机失败时使用手动文字作为兜底
      // 尝试使用打字机效果
      try {
        typeSummaryText(summaryText, {
          instant: false,
          streaming: false,
          // 使出字速度与输入组件一致
          speed: TIMING.TYPING_SPEED,
          onComplete: () => {
            console.log('📝 总结文字显示完成');
            setHasShownSummary(true);
            // 不再使用悬浮按钮
            onShouldShowPaymentButton?.(false);
          }
        });
      } catch (error) {
        console.error('📋 打字机效果错误:', error);
        // 如果打字机效果失败，直接显示按钮
        console.log('📋 使用备用显示方式');
        setTimeout(() => {
          // 兜底：显示手动文字
          setManualDisplayText(summaryText);
          setHasShownSummary(true);
          // 不再使用悬浮按钮
          onShouldShowPaymentButton?.(false);
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
    try { setShowPaymentModalProp?.(true); } catch {}
  };
  
  // 处理"去支付"按钮点击
  const handleGoToPayment = () => {
    setShowGoToPaymentButton(false);
    try { setShowPaymentModalProp?.(true); } catch {}
    setPaymentError(null);
    setPaymentStatus('idle');
  };
  
  // 创建支付订单
  const handleCreatePayment = async () => {
    // 测试模式：模拟成功的支付流程，将订单标记为已支付
    if (DEV_CONFIG.SKIP_PAYMENT) {
      console.log('🧪 测试模式：模拟支付成功流程');
      setPaymentLoading(true);
      setPaymentStatus('processing');
      
      setTimeout(() => {
        setPaymentLoading(false);
        
        // 测试模式：模拟支付成功，设置为已支付状态
        console.log('✅ 测试模式：模拟支付成功，订单标记为已支付');
        setPaymentStatus('success');
        
        // 🎯 关键：模拟支付成功的订单状态同步
        if (currentOrderId) {
          try {
            // 创建模拟的支付完成数据
            const mockPaymentData = {
              paymentStatus: 'paid',
              paidAt: new Date().toISOString(),
              paymentId: `mock_payment_${Date.now()}`,
            };
            
            // 使用订单同步管理器更新状态
            import('../utils/orderSyncManager').then(({ orderSyncManager }) => {
              orderSyncManager.syncPaymentStatus(currentOrderId, 'paid', mockPaymentData);
              console.log('📊 已同步订单支付状态为已支付');
            });
          } catch (error) {
            console.warn('同步支付状态失败:', error);
          }
        }
        
        // 调用 handlePaymentComplete，传递成功状态
        handlePaymentComplete(true, '支付成功！订单已提交处理');
        
        // 🔄 触发历史记录刷新，确保状态更新在历史中体现
        setTimeout(() => {
          try {
            const { eventBus } = require('../utils/eventBus');
            eventBus.emit('orderHistoryUpdate');
            console.log('📢 已触发订单历史更新事件');
          } catch (error) {
            console.warn('触发历史更新事件失败:', error);
          }
        }, 500);
      }, 1000);
      return;
    }

    if (isFreeOrder) {
      // 免单订单直接成功
      handlePaymentComplete(true);
      return;
    }

    setPaymentLoading(true);
    setPaymentError(null);
    setPaymentStatus('processing');

    try {
      // 确保存在订单ID；若不存在，先创建订单或更新已存在的订单
      let orderId = currentOrderId || null;
      
      if (!orderId) {
        // 没有订单ID，需要创建新订单
        if (!authResult?.userId || !authResult?.phoneNumber) {
          throw new Error('用户信息缺失，请重新登录');
        }
        const orderData = {
          address,
          deliveryTime,
          allergies: selectedAllergies,
          preferences: selectedPreferences,
          budget,
          foodType: selectedFoodType,
          isFreeOrder,
          freeOrderType: isFreeOrder ? 'invite_reward' as const : undefined,
        };
        const res = await createOrder(authResult.userId, authResult.phoneNumber, orderData);
        if (!res.success || !res.order_id) {
          throw new Error(res.message || '创建订单失败');
        }
        orderId = res.order_id;
        try {
          setCurrentOrderId?.(res.order_id || null);
          setCurrentOrderNumber?.(res.order_number || null);
          setCurrentUserSequenceNumber?.(res.user_sequence_number || null);
        } catch {}
      } else {
        // 有订单ID，更新订单数据（早期订单模式）
        const { updateOrderData } = await import('../services/api');
        const orderData = {
          address,
          deliveryTime,
          allergies: selectedAllergies,
          preferences: selectedPreferences,
          budget,
          foodType: selectedFoodType,
          isFreeOrder,
          freeOrderType: isFreeOrder ? 'invite_reward' as const : undefined,
        };
        
        const updateResult = await updateOrderData(orderId, orderData);
        if (!updateResult.success) {
          console.warn('订单数据更新失败，但继续支付流程:', updateResult.message);
        }
      }

      // 创建支付
      console.log('💳 创建支付:', { orderId, amount: parseFloat(budget) });
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
            console.log('🎉 轮询检测到支付成功，清理轮询');
            clearInterval(interval);
            setStatusCheckInterval(null);
            setPaymentStatus('success');
            handlePaymentComplete(true);
          } else if (response.data.status === 'failed') {
            // 支付失败
            console.log('❌ 轮询检测到支付失败，清理轮询');
            clearInterval(interval);
            setStatusCheckInterval(null);
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
  
  // 清理轮询 - 增强版本，确保在所有情况下都能正确清理
  useEffect(() => {
    return () => {
      console.log('🧹 OrderConfirmationComponent 卸载，清理轮询');
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    };
  }, [statusCheckInterval]);
  
  // 处理支付完成
  const handlePaymentComplete = (success: boolean) => {
    console.log('🎯 OrderConfirmationComponent handlePaymentComplete:', { success, paymentStatus });
    
    // 关键修复：立即清理轮询，防止继续运行
    if (statusCheckInterval) {
      console.log('🧹 清理支付状态轮询');
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
    
    // 重置支付状态
    setPaymentStatus('idle');
    setPaymentLoading(false);
    setPaymentError(null);
    
    if (success) {
      // 支付成功，仅通知父组件；不再重复创建/提交订单
      const orderText = formatOrderConfirmationText();
      console.log('✅ 支付成功，通知父组件:', orderText?.substring(0, 50) + '...');
      onPaymentComplete?.(true, orderText);
    } else {
      // 支付取消时：1. 通知父组件关闭弹窗 2. 重新显示支付按钮
      console.log('❌ 支付取消或失败');
      onPaymentComplete?.(false);
      onShouldShowPaymentButton?.(false);
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
      
      {/* 根据订单状态显示不同内容 */}
      {isSearchingRestaurant ? (
        // 搜索餐厅状态：显示加载提示
        <Animated.View style={{ opacity: 1, marginBottom: 12 }}>
          <Text style={[questionStyles.currentQuestionText, { minHeight: 20 }]}>
            {summaryDisplayedText || '正在挑选...'}
          </Text>
        </Animated.View>
      ) : isOrderCompleted ? (
        // 订单完成状态：显示完成信息
        <Animated.View style={{ opacity: 1, marginBottom: 12 }}>
          <Text style={[questionStyles.currentQuestionText, { minHeight: 20 }]}>
            {summaryDisplayedText || manualDisplayText || '订单处理中...'}
          </Text>
        </Animated.View>
      ) : (
        // 正常状态：显示订单总结和支付按钮
        <>
          {/* 总结文字显示区域 - 优先显示打字机效果，备用显示手动文字 */}
          <Animated.View style={{ opacity: 1, marginBottom: 12 }}>
            <Text style={[questionStyles.currentQuestionText, { minHeight: 20 }]}>
              {/* 避免闪烁：打字进行中时仅显示打字内容，不回退到完整手动文字 */}
              {summaryDisplayedText || (!summaryIsTyping ? (manualDisplayText || '正在加载...') : '')}
              {summaryIsTyping && (
                <Animated.Text style={[questionStyles.cursor, { opacity: 1, fontSize: 18, color: questionStyles.cursor.color }]}>|
                </Animated.Text>
              )}
            </Text>
          </Animated.View>
          
          {/* 内联"去支付"按钮：与确认按钮一致的内联呈现 */}
          {!isPaymentCompleted && hasShownSummary && (
            <View style={{ paddingTop: 8 }}>
              <ActionButton
                onPress={handleGoToPayment}
                title={isFreeOrder ? '确认免单' : '去支付'}
                disabled={false}
                isActive={true}
              />
            </View>
          )}
        </>
      )}

      {/* 支付弹窗 */}
      <Modal
        visible={isPaymentModalVisible || false}
        transparent={true}
        animationType="slide"
        onRequestClose={() => onShouldShowPaymentButton?.(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>支付宝支付</Text>
            
            {paymentStatus === 'idle' && (
              <>
                <Text style={styles.modalText}>
                  {isFreeOrder ? '免单订单' : `支付金额：¥${budget}`}
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
                    try { setShowPaymentModalProp?.(false); } catch {}
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
