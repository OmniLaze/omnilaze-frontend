import React, { useState, useEffect, useCallback } from 'react';
import { View, Animated, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ActionButton } from './ActionButton';
import { useTheme } from '../contexts/ColorThemeContext';
import { createQuestionStyles } from '../styles/globalStyles';
import { useTypewriterEffect } from '../hooks';

interface OrderConfirmationComponentProps {
  // 用户填写的所有信息
  address: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  budget: string;
  isFreeOrder?: boolean;
  
  // 动画和状态
  animationValue: Animated.Value;
  onConfirmOrder: () => void;
  onPaymentComplete?: (success: boolean, orderText?: string) => void;
  
  // 处理状态
  isOrderProcessing?: boolean;
  isPaymentModalVisible?: boolean;
  isPaymentCompleted?: boolean; // 新增：指示支付是否已完成
  
  // CurrentQuestion需要的动画参数
  currentQuestionAnimation?: Animated.Value;
  shakeAnimation?: Animated.Value;
  emotionAnimation?: Animated.Value;
}

export const OrderConfirmationComponent: React.FC<OrderConfirmationComponentProps> = ({
  address,
  deliveryTime,
  selectedAllergies,
  selectedPreferences,
  selectedFoodType,
  budget,
  isFreeOrder = false,
  animationValue,
  onConfirmOrder,
  onPaymentComplete,
  isOrderProcessing = false,
  isPaymentModalVisible = false,
  isPaymentCompleted = false, // 新增参数
  currentQuestionAnimation = new Animated.Value(1),
  shakeAnimation = new Animated.Value(0),
  emotionAnimation = new Animated.Value(1),
}) => {
  console.log('📋 OrderConfirmationComponent 渲染开始，props:', {
    address: address?.substring(0, 20) + '...',
    budget,
    selectedFoodType,
    selectedPreferences,
    selectedAllergies
  });

  const { theme } = useTheme();
  const questionStyles = createQuestionStyles(theme);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  
  console.log('📋 OrderConfirmationComponent 状态:', {
    hasShownSummary,
    showGoToPaymentButton,
    summaryDisplayedTextLength: summaryDisplayedText.length,
    summaryIsTyping
  });
  
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
    console.log('📋 OrderConfirmationComponent useEffect 触发:', { hasShownSummary, isPaymentCompleted });
    
    // 如果支付已完成，直接显示静态文本，不运行打字机效果
    if (isPaymentCompleted) {
      const summaryText = formatOrderConfirmationText();
      console.log('💰 支付已完成，显示静态文本:', summaryText);
      setManualDisplayText(summaryText);
      setHasShownSummary(true);
      // 支付完成后不显示任何按钮
      setShowGoToPaymentButton(false);
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
          speed: 25,
          onComplete: () => {
            console.log('📝 总结文字显示完成，显示去支付按钮');
            setShowGoToPaymentButton(true); // 显示"去支付"按钮而不是"确认下单"按钮
            setHasShownSummary(true);
          }
        });
      } catch (error) {
        console.error('📋 打字机效果错误:', error);
        // 如果打字机效果失败，直接显示按钮
        console.log('📋 使用备用显示方式');
        setTimeout(() => {
          setShowGoToPaymentButton(true); // 显示"去支付"按钮
          setHasShownSummary(true);
        }, 1000); // 给用户时间看到文字
      }
    }
  }, [isPaymentCompleted]); // 依赖isPaymentCompleted而不是空数组
  
  // 添加调试用的useEffect来监听状态变化
  useEffect(() => {
    console.log('📋 OrderConfirmationComponent 状态变化:', {
      hasShownSummary,
      showGoToPaymentButton,
      summaryDisplayedText: summaryDisplayedText.substring(0, 50) + '...',
      summaryIsTyping
    });
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
  };
  
  // 处理支付完成
  const handlePaymentComplete = (success: boolean) => {
    setShowPaymentModal(false);
    
    if (success) {
      // 支付成功，通知父组件创建订单
      const orderText = formatOrderConfirmationText();
      onPaymentComplete?.(true, orderText);
      onConfirmOrder();
      
      // 支付成功后不清理状态，保持总结文字的静态显示
      // setShowSummaryText(false);  // 注释掉这行
      // setShowGoToPaymentButton(false);  // 注释掉这行
      // clearSummaryText();  // 注释掉这行
    } else {
      // 支付取消时显示"去支付"按钮
      setShowGoToPaymentButton(true);
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
      
      {/* "去支付"按钮 - 总结文字完成后显示，但支付完成后隐藏 */}
      {showGoToPaymentButton && !isPaymentCompleted && (
        <View style={styles.goToPaymentContainer}>
          <TouchableOpacity
            style={styles.goToPaymentButton}
            onPress={handleGoToPayment}
            activeOpacity={0.8}
          >
            <Text style={styles.goToPaymentButtonText}>去支付</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 支付弹窗 */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>支付确认</Text>
            <Text style={styles.modalText}>
              支付金额：¥{budget}
            </Text>
            <Text style={styles.modalNote}>
              {isFreeOrder ? '免单订单' : '请在付款时备注完整手机号'}
            </Text>
            
            {/* 这里预留支付接口 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handlePaymentComplete(true)}
              >
                <Text style={styles.confirmButtonText}>模拟支付成功</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => handlePaymentComplete(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WrapperComponent>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 16,
  },
  goToPaymentContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingLeft: 0, // 不需要特殊对齐，CurrentQuestion组件会处理
  },
  goToPaymentButton: {
    backgroundColor: theme.PRIMARY,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goToPaymentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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
});