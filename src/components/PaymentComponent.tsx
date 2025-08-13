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
}) => {
  // 处理支付完成
  const handlePaymentComplete = (success: boolean, orderText?: string) => {
    if (success && orderText) {
      // 调用父组件的确认订单函数，传递订单文字
      onConfirmOrder(orderText);
    }
  };
  
  // 预算选择后，直接显示订单确认组件
  if (!isTyping && budget) {
    return (
      <OrderConfirmationComponent
        address={address}
        deliveryTime={deliveryTime}
        selectedAllergies={selectedAllergies}
        selectedPreferences={selectedPreferences}
        selectedFoodType={selectedFoodType}
        budget={budget}
        isFreeOrder={isFreeOrder}
        animationValue={animationValue}
        onConfirmOrder={() => {}}  // 空函数，实际逻辑在onPaymentComplete中
        onPaymentComplete={handlePaymentComplete}
      />
    );
  }
  
  return null;
};