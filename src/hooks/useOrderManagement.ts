import { useState } from 'react';
import { createOrder, submitOrder, saveUserPreferences } from '../services/api';
import { TIMING } from '../constants';
import type { AuthResult } from '../types';

interface UseOrderManagementProps {
  authResult: AuthResult | null;
  address: string;
  deliveryTime: string;
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
  typeText: (text: string, options?: { instant?: boolean; onComplete?: () => void; streaming?: boolean; speed?: number; append?: boolean }) => void;
  // 新增：将完成的消息固定到消息日志（带头像）
  pushOrderMessage: (text: string, avatar: 'assistant' | 'delivery') => void;
}

export const useOrderManagement = (props: UseOrderManagementProps) => {
  const {
    authResult, address, deliveryTime, selectedAllergies, selectedPreferences, budget,
    selectedFoodType, isFreeOrder, currentUserSequenceNumber,
    otherAllergyText, otherPreferenceText, selectedAddressSuggestion,
    setCurrentOrderId, setCurrentOrderNumber, setCurrentUserSequenceNumber,
    setIsOrderSubmitting, setIsSearchingRestaurant, setIsOrderCompleted,
    setCurrentStep, setCompletedAnswers, setInputError, setOrderMessage,
    triggerShake, changeEmotion, typeText, pushOrderMessage
  } = props;

  // 防重复触发：下单消息流程闸门
  const [orderFlowRunning, setOrderFlowRunning] = useState(false);

  // 创建订单
  const handleCreateOrder = async () => {
    if (!authResult?.userId || !authResult?.phoneNumber) {
      setInputError('用户信息缺失，请重新登录');
      return;
    }

    const orderData = {
      address: address,
      deliveryTime: deliveryTime,
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
        
        // 通知订单历史更新 - 触发组件重新获取订单列表
        // 传递更详细的订单信息以便快速更新UI
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('orderHistoryUpdate', { 
            detail: { 
              orderId: result.order_id,
              orderNumber: result.order_number,
              orderData: {
                ...orderData,
                id: result.order_id,
                orderNumber: result.order_number,
                status: 'pending',
                createdAt: new Date().toISOString()
              }
            } 
          }));
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

  // 确认下单后：简化的流程处理
  const handleConfirmOrder = async (orderText?: string) => {
    if (orderFlowRunning) return;
    
    // 如果没有订单文字，说明是支付成功的回调
    if (!orderText) {
      // 支付成功，创建订单并完成流程
      setOrderFlowRunning(true);
      try {
        // 立即标记支付步骤为完成
        setCompletedAnswers((prev: any) => ({
          ...prev,
          [5]: { type: 'payment', value: '已确认支付' }
        }));
        
        // 显示"正在挑选..."问题
        setIsSearchingRestaurant(true);
        typeText("正在挑选", { // 移除省略号，由LoadingDots组件处理
          instant: false,
          streaming: false,
          speed: 30,
          onComplete: () => {
            console.log('正在挑选文字显示完成，开始创建订单');
            // 在显示完成后再创建订单
            setTimeout(async () => {
              try {
                await handleCreateOrder();
                setIsOrderCompleted(true);
                setIsSearchingRestaurant(false);
                changeEmotion('✅');
                setOrderFlowRunning(false);
              } catch (error) {
                setIsSearchingRestaurant(false);
                changeEmotion('😰');
                setInputError('订单创建失败，请重试');
                setOrderFlowRunning(false);
              }
            }, 500);
          }
        });
      } catch (error) {
        setIsSearchingRestaurant(false);
        changeEmotion('😰');
        setInputError('订单创建失败，请重试');
        setOrderFlowRunning(false);
      }
      return;
    }
    
    // 如果有订单文字，说明是支付成功后的订单创建阶段
    setOrderFlowRunning(true);
    try {
      // 立即标记支付步骤为完成
      setCompletedAnswers((prev: any) => ({
        ...prev,
        [5]: { type: 'payment', value: '已确认支付' }
      }));
      
      // 显示"正在挑选..."问题
      setIsSearchingRestaurant(true);
      typeText("正在挑选", { // 移除省略号，由LoadingDots组件处理
        instant: false,
        streaming: false,
        speed: 30,
        onComplete: () => {
          console.log('正在挑选文字显示完成，开始创建订单');
          // 在显示完成后再创建订单
          setTimeout(async () => {
            try {
              await handleCreateOrder();
              setIsOrderCompleted(true);
              setIsSearchingRestaurant(false);
              changeEmotion('✅');
              setOrderFlowRunning(false);
            } catch (error) {
              setIsSearchingRestaurant(false);
              changeEmotion('😰');
              setInputError('订单创建失败，请重试');
              setOrderFlowRunning(false);
            }
          }, 500);
        }
      });
    } catch (error) {
      setIsSearchingRestaurant(false);
      changeEmotion('😰');
      setInputError('订单创建失败，请重试');
      setOrderFlowRunning(false);
    }
  };
  
  return {
    handleCreateOrder,
    handleSubmitOrder,
    handleConfirmOrder
  };
};
