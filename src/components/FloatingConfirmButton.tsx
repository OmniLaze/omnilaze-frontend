import React, { useState, useEffect } from 'react';
import { View, Animated, Platform, StyleSheet } from 'react-native';
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
  
  // 操作回调
  onConfirm: () => void;
  
  // 特殊状态
  isOrderCompleted: boolean;
  isAuthenticated: boolean;
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
  onConfirm,
  isOrderCompleted,
  isAuthenticated,
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
        return false; // 配送时间步骤有自己的内联按钮
      
      case 5: // 预算步骤
        return budget.trim().length > 0;
      
      case 6: // 订单确认步骤
        return false; // 订单确认页面有自己的支付按钮
      
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
    isOrderCompleted,
    isAuthenticated,
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
      default:
        return '确认';
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
        onPress={onConfirm}
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
    elevation: 10, // Android阴影
    shadowColor: '#000', // iOS阴影
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});