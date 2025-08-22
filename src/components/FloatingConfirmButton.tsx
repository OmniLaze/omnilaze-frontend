import React, { useState, useEffect } from 'react';
import { View, Animated, Platform, StyleSheet, Vibration } from 'react-native';
import { ActionButton } from './ActionButton';
import { useTheme } from '../contexts/ColorThemeContext';

interface FloatingConfirmButtonProps {
  // 当前步骤和状态
  currentStep: number;
  editingStep: number | null;
  
  // 表单数据
  address: string;
  selectedFoodType: string[];
  selectedAllergies: string[];
  selectedPreferences: string[];
  deliveryTime: string;
  budget: string;
  
  // 配送时间步骤特殊状态
  deliveryTimeSelection?: {
    selectedOption: 'asap' | 'scheduled' | null;
    selectedTime: string;
  };
  
  // 操作回调
  onConfirm: () => void;
  onDeliveryTimeConfirm?: (time: string) => void;
  onGoToPayment?: () => void; // 新增：支付按钮回调
  
  // 特殊状态
  isOrderCompleted: boolean;
  isAuthenticated: boolean;
  
  // 新增：支付相关状态
  showGoToPaymentButton?: boolean; // 是否显示去支付按钮（基于打字机效果完成）
  isPaymentCompleted?: boolean; // 支付是否已完成
}

export const FloatingConfirmButton: React.FC<FloatingConfirmButtonProps> = ({
  currentStep,
  editingStep,
  address,
  selectedFoodType,
  selectedAllergies,
  selectedPreferences,
  deliveryTime,
  budget,
  deliveryTimeSelection,
  onConfirm,
  onDeliveryTimeConfirm,
  onGoToPayment,
  isOrderCompleted,
  isAuthenticated,
  showGoToPaymentButton = false,
  isPaymentCompleted = false,
}) => {
  const { theme } = useTheme();
  const [buttonOpacity] = useState(new Animated.Value(0));
  const [shouldShow, setShouldShow] = useState(false);

  // 检测当前步骤是否有有效选择
  const checkHasValidSelection = () => {
    // 如果订单已完成或用户未认证，不显示按钮
    if (isOrderCompleted || !isAuthenticated) {
      return false;
    }

    // 如果在编辑模式，检查编辑步骤的选择状态
    const stepToCheck = editingStep !== null ? editingStep : currentStep;

    switch (stepToCheck) {
      case 0: // 地址步骤
        return address.trim().length >= 5;
      
      case 1: // 食物类型步骤
        return selectedFoodType.length > 0;
      
      case 2: // 过敏源步骤
        return selectedAllergies.length > 0;
      
      case 3: // 口味偏好步骤
        return selectedPreferences.length > 0;
      
      case 4: // 配送时间步骤 
        // 检查用户是否选择了配送选项
        if (deliveryTimeSelection) {
          const { selectedOption, selectedTime } = deliveryTimeSelection;
          if (selectedOption === 'asap') {
            return true; // 选择了"越快越好"
          }
          if (selectedOption === 'scheduled' && selectedTime) {
            return true; // 选择了"预约时间"且选择了具体时间
          }
        }
        return false;
      
      case 5: // 预算步骤
        return budget.trim().length > 0;
      
      case 6: // 订单确认步骤
        // 在订单确认步骤，显示支付按钮的条件：
        // 1. 打字机效果已完成（showGoToPaymentButton为true）
        // 2. 支付尚未完成（!isPaymentCompleted）
        return showGoToPaymentButton && !isPaymentCompleted;
      
      default:
        return false;
    }
  };

  // 监听状态变化，决定是否显示按钮
  useEffect(() => {
    const hasValidSelection = checkHasValidSelection();
    
    if (hasValidSelection !== shouldShow) {
      setShouldShow(hasValidSelection);
      
      // 执行透明度动画
      Animated.timing(buttonOpacity, {
        toValue: hasValidSelection ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [
    currentStep,
    editingStep,
    address,
    selectedFoodType,
    selectedAllergies,
    selectedPreferences,
    deliveryTime,
    budget,
    deliveryTimeSelection,
    isOrderCompleted,
    isAuthenticated,
    showGoToPaymentButton,
    isPaymentCompleted,
    shouldShow
  ]);

  // 获取按钮文案
  const getButtonTitle = () => {
    if (editingStep !== null) {
      return '确认';
    }
    
    switch (currentStep) {
      case 0:
        return '确认';
      case 4:
        return '确认';
      case 6:
        // 订单确认步骤显示"去支付"
        return '去支付';
      default:
        return '确认';
    }
  };

  // 轻触觉反馈（小震动）
  const triggerLightHaptic = () => {
    try {
      // 10ms 轻微震动；Web 端多数情况下无效果但安全
      Vibration.vibrate(10);
    } catch {}
  };

  // 处理按钮点击
  const handleButtonPress = () => {
    // 先触发轻触觉反馈
    triggerLightHaptic();

    if (currentStep === 4 && onDeliveryTimeConfirm && deliveryTimeSelection) {
      // 配送时间步骤的特殊处理
      const { selectedOption, selectedTime } = deliveryTimeSelection;
      if (selectedOption === 'asap') {
        onDeliveryTimeConfirm('ASAP');
      } else if (selectedOption === 'scheduled' && selectedTime) {
        onDeliveryTimeConfirm(selectedTime);
      }
    } else if (currentStep === 6 && onGoToPayment) {
      // 订单确认步骤的支付按钮处理
      onGoToPayment();
    } else {
      // 其他步骤使用通用确认逻辑
      onConfirm();
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.floatingContainer,
        {
          opacity: buttonOpacity,
        }
      ]}
      pointerEvents={shouldShow ? 'auto' : 'none'}
    >
      <ActionButton
        onPress={handleButtonPress}
        title={getButtonTitle()}
        disabled={false}
        isActive={true}
        animationValue={buttonOpacity}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    right: 20,
    zIndex: 1000, // 确保在最上层，悬浮在所有内容之上
  },
});
