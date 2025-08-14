import React from 'react';
import { OrderConfirmationComponent } from './OrderConfirmationComponent';

interface PaymentComponentProps {
  budget: string;
  animationValue: Animated.Value;
  onConfirmOrder: (orderText?: string) => void;
  isTyping?: boolean;
  isFreeOrder?: boolean;
  
  // 新增：用户所有信息
  address: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  
  // 新增：动画参数用于一致的样式
  currentQuestionAnimation?: Animated.Value;
  shakeAnimation?: Animated.Value;
  emotionAnimation?: Animated.Value;
}

import { Animated } from 'react-native';

export const PaymentComponent: React.FC<PaymentComponentProps> = ({
  budget,
  animationValue,
  onConfirmOrder,
  isTyping = false,
  isFreeOrder = false,
  address,
  deliveryTime,
  selectedAllergies,
  selectedPreferences,
  selectedFoodType,
  currentQuestionAnimation,
  shakeAnimation,
  emotionAnimation,
}) => {
  // 预算选择后，不再直接显示订单确认组件
  // 让预算步骤正常完成，推进到下一步（订单确认步骤）
  return null;
};