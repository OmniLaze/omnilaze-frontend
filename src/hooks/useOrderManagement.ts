import { useState } from 'react';
import { createOrder, submitOrder, saveUserPreferences } from '../services/api';
import { TIMING } from '../constants';
import type { AuthResult } from '../types';

interface UseOrderManagementProps {
  authResult: AuthResult | null;
  address: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  budget: string;
  selectedFoodType: string[];
  isFreeOrder: boolean;
  currentUserSequenceNumber: number | null;
  
  // 新增偏好相关数据
  otherAllergyText: string;
  otherPreferenceText: string;
  selectedAddressSuggestion: any;
  
  // State setters
  setCurrentOrderId: (value: string | null) => void;
  setCurrentOrderNumber: (value: string | null) => void;
  setCurrentUserSequenceNumber: (value: number | null) => void;
  setIsOrderSubmitting: (value: boolean) => void;
  setIsSearchingRestaurant: (value: boolean) => void;
  setIsOrderCompleted: (value: boolean) => void;
  setCurrentStep: (value: number) => void;
  setCompletedAnswers: (value: any) => void;
  setInputError: (value: string) => void;
  setOrderMessage: (value: string) => void;
  
  // Animation & UI functions
  triggerShake: () => void;
  changeEmotion: (emotion: string) => void;
  typeText: (text: string, options?: { instant?: boolean; onComplete?: () => void; streaming?: boolean }) => void;
}

export const useOrderManagement = (props: UseOrderManagementProps) => {
  const {
    authResult, address, selectedAllergies, selectedPreferences, budget,
    selectedFoodType, isFreeOrder, currentUserSequenceNumber,
    otherAllergyText, otherPreferenceText, selectedAddressSuggestion,
    setCurrentOrderId, setCurrentOrderNumber, setCurrentUserSequenceNumber,
    setIsOrderSubmitting, setIsSearchingRestaurant, setIsOrderCompleted,
    setCurrentStep, setCompletedAnswers, setInputError, setOrderMessage,
    triggerShake, changeEmotion, typeText
  } = props;

  // 创建订单
  const handleCreateOrder = async () => {
    if (!authResult?.userId || !authResult?.phoneNumber) {
      setInputError('用户信息缺失，请重新登录');
      return;
    }

    const orderData = {
      address: address,
      allergies: selectedAllergies,
      preferences: selectedPreferences,
      budget: budget,
      foodType: selectedFoodType,
      isFreeOrder: isFreeOrder,
      freeOrderType: isFreeOrder ? 'invite_reward' as const : undefined
    };

    try {
      setIsOrderSubmitting(true);
      changeEmotion('📝');
      
      const result = await createOrder(authResult.userId, authResult.phoneNumber, orderData);
      
      if (result.success) {
        setCurrentOrderId(result.order_id || null);
        setCurrentOrderNumber(result.order_number || null);
        setCurrentUserSequenceNumber(result.user_sequence_number || null);
        
        // 订单创建成功后，保存用户偏好（异步进行，不阻塞订单流程）
        if (!authResult.isNewUser) {
          // 仅为老用户保存偏好，新用户在首次下单时总是保存
          try {
            const formData = {
              address: address,
              selectedFoodType: selectedFoodType,
              selectedAllergies: selectedAllergies,
              selectedPreferences: selectedPreferences,
              budget: budget,
              otherAllergyText: otherAllergyText,
              otherPreferenceText: otherPreferenceText,
              selectedAddressSuggestion: selectedAddressSuggestion
            };
            
            // 🔧 生产环境日志清理：条件性日志输出
            if (process.env.NODE_ENV === 'development') {
              console.log('💾 保存用户偏好以便下次快速下单...');
            }
            const preferencesResult = await saveUserPreferences(authResult.userId, formData);
            
            if (preferencesResult.success) {
              // 🔧 生产环境日志清理：条件性日志输出
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ 用户偏好保存成功，下次登录可快速下单');
              }
            } else {
              // 🔧 生产环境日志清理：条件性日志输出
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ 偏好保存失败:', preferencesResult.message);
              }
            }
          } catch (preferencesError) {
            // 🔧 生产环境日志清理：条件性日志输出
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ 保存偏好时出错:', preferencesError);
            }
            // 偏好保存失败不影响订单流程
          }
        }
        
        handleSubmitOrder(result.order_id!);
      } else {
        setInputError(result.message);
        triggerShake();
        changeEmotion('😰');
      }
    } catch (error) {
      setInputError('创建订单失败，请重试');
      triggerShake();
      changeEmotion('😰');
    } finally {
      setIsOrderSubmitting(false);
    }
  };

  // 提交订单
  const handleSubmitOrder = async (orderId: string) => {
    try {
      changeEmotion('🚀');
      
      const result = await submitOrder(orderId);
      
      if (result.success) {
        setCurrentStep(5);
        // 订单提交成功，但不显示额外文本，因为handleConfirmOrder已经设置了最终消息
      } else {
        setInputError(result.message);
        triggerShake();
        changeEmotion('😰');
      }
    } catch (error) {
      setInputError('提交订单失败，请重试');
      triggerShake();
      changeEmotion('😰');
    }
  };

  // 确认下单后开始搜索餐厅
  const handleConfirmOrder = async () => {
    setIsSearchingRestaurant(true);
    changeEmotion('🔍');
    
    // 立即标记支付步骤为完成，隐藏PaymentComponent
    setCompletedAnswers((prev: any) => ({
      ...prev,
      [4]: { type: 'payment', value: '已确认支付' } // 假设支付是第4步
    }));
    
    // 创建订单
    try {
      await handleCreateOrder();
      
      // 1.5秒后显示完成消息并持久化
      setTimeout(() => {
        setIsSearchingRestaurant(false);
        setIsOrderCompleted(true);
        changeEmotion('🎉');
        // 构建包含用户注册次序的消息
        let message = '我去下单，记得保持手机畅通，不要错过外卖员电话哦';
        if (authResult?.userSequence) {
          message = `这是我们第${authResult.userSequence}个注册用户的订单！${message}`;
        }
        
        typeText(message, { streaming: true });
        setOrderMessage(message); // 持久化消息
      }, 1500);
    } catch (error) {
      setIsSearchingRestaurant(false);
      changeEmotion('😰');
      setInputError('订单创建失败，请重试');
    }
  };

  return {
    handleCreateOrder,
    handleSubmitOrder,
    handleConfirmOrder
  };
};