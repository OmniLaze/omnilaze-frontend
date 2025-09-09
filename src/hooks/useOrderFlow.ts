import { useState, useCallback } from 'react';
import { createOrder, submitOrder } from '../services/api';
import { convertToChineseDisplay } from '../data/checkboxOptions';
import { Order } from '../types/order';

interface UseOrderFlowProps {
  authResult: any;
  address: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  budget: string;
  selectedFoodType: string[];
  isFreeOrder: boolean;
  currentStep: number; // 新增
  currentUserSequenceNumber: number | null;
  otherAllergyText: string;
  otherPreferenceText: string;
  selectedAddressSuggestion: any;
  setCurrentOrderId: (id: string | null) => void;
  setCurrentOrderNumber: (num: string | null) => void;
  setCurrentUserSequenceNumber: (num: number | null) => void;
  setIsOrderSubmitting: (submitting: boolean) => void;
  setIsSearchingRestaurant: (searching: boolean) => void;
  setIsOrderCompleted: (completed: boolean) => void;
  setOrderStatus?: (status: string | undefined) => void; // 新增
  setCurrentStep: (step: number) => void;
  setCompletedAnswers: (answers: any) => void;
  setInputError: (error: string) => void;
  setOrderMessage: (message: string) => void;
  triggerShake: () => void;
  changeEmotion: (emotion: string, callback?: () => void) => void;
  typeText: (text: string, options?: any) => void;
  pushOrderMessage: (text: string, avatar: 'assistant' | 'delivery') => void;
}

export const useOrderFlow = ({
  authResult,
  address,
  deliveryTime,
  selectedAllergies,
  selectedPreferences,
  budget,
  selectedFoodType,
  isFreeOrder,
  currentStep, // 新增
  currentUserSequenceNumber,
  otherAllergyText,
  otherPreferenceText,
  selectedAddressSuggestion,
  setCurrentOrderId,
  setCurrentOrderNumber,
  setCurrentUserSequenceNumber,
  setIsOrderSubmitting,
  setIsSearchingRestaurant,
  setIsOrderCompleted,
  setOrderStatus, // 新增
  setCurrentStep,
  setCompletedAnswers,
  setInputError,
  setOrderMessage,
  triggerShake,
  changeEmotion,
  typeText,
  pushOrderMessage,
}: UseOrderFlowProps) => {
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  // Create order summary for display
  const createOrderSummaryAndPush = useCallback((
    address: string,
    deliveryTime: string,
    selectedAllergies: string[],
    selectedPreferences: string[],
    selectedFoodType: string[],
    budget: string
  ) => {
    const foodTypeDisplay = convertToChineseDisplay(selectedFoodType);
    const allergyDisplay = selectedAllergies.length > 0 
      ? convertToChineseDisplay(selectedAllergies) 
      : '无';
    const preferenceDisplay = selectedPreferences.length > 0 
      ? convertToChineseDisplay(selectedPreferences) 
      : '无';
    const deliveryTimeDisplay = deliveryTime === 'ASAP' ? '越快越好' : deliveryTime;

    const orderSummary = `📋 订单详情：
📍 配送地址：${address}
🍔 食物类型：${foodTypeDisplay}
🚫 忌口说明：${allergyDisplay}
👅 口味偏好：${preferenceDisplay}
⏰ 用餐时间：${deliveryTimeDisplay}
💰 预算：¥${budget}`;

    pushOrderMessage(orderSummary, 'assistant');
  }, [pushOrderMessage]);

  // Handle order confirmation
  const handleConfirmOrder = useCallback(async () => {
    if (isProcessingOrder) return;
    setIsProcessingOrder(true);

    try {
      setIsOrderSubmitting(true);
      setInputError('');
      changeEmotion('🤔');

      if (!authResult?.userId) {
        throw new Error('用户未登录');
      }

      const foodTypesList = convertToChineseDisplay(selectedFoodType).split('、');
      const allergiesList = selectedAllergies.length > 0 
        ? convertToChineseDisplay(selectedAllergies).split('、') 
        : [];
      const preferencesList = selectedPreferences.length > 0 
        ? convertToChineseDisplay(selectedPreferences).split('、') 
        : [];
      
      const numericBudget = parseFloat(budget) || 0;

      const orderData = {
        userId: authResult.userId,
        phoneNumber: authResult.phoneNumber,
        address,
        foodType: foodTypesList,
        allergies: allergiesList,
        preferences: preferencesList,
        otherAllergy: otherAllergyText || '',
        otherPreference: otherPreferenceText || '',
        deliveryTime: deliveryTime || 'ASAP',
        budget: numericBudget,
        isFreeOrder,
        addressSuggestion: selectedAddressSuggestion || null,
      };

      const createResponse = await createOrder(orderData);

      if (!createResponse.success) {
        throw new Error(createResponse.message || '创建订单失败');
      }

      const { orderId, orderNumber, userSequenceNumber } = createResponse;
      
      if (!orderId) {
        throw new Error('未获取到订单ID');
      }

      setCurrentOrderId(orderId);
      setCurrentOrderNumber(orderNumber || '');
      setCurrentUserSequenceNumber(userSequenceNumber || currentUserSequenceNumber);

      // 创建一个完整订单对象并缓存到同步管理器
      try {
        const { orderSyncManager } = await import('../utils/orderSyncManager');
        const newOrder: Order = {
          id: orderId,
          orderNumber: orderNumber || '',
          userId: authResult.userId,
          phoneNumber: authResult.phoneNumber,
          status: 'submitted', // 这里应该是submitted，因为已经调用了submitOrder
          displayStatus: 'unpaid',
          deliveryAddress: address,
          deliveryTime: deliveryTime,
          dietaryRestrictions: selectedAllergies,
          foodPreferences: selectedPreferences,
          budgetAmount: parseFloat(budget),
          budgetCurrency: 'CNY',
          metadata: {
            foodType: selectedFoodType,
          },
          paymentStatus: 'unpaid',
          paidAt: null,
          paymentId: null,
          arrivalImageUrl: null,
          arrivalImageSource: null,
          arrivalImageTakenAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          submittedAt: new Date().toISOString(), // 已提交时间
          feedbacks: [],
          voiceFeedbacks: [],
          userSequenceNumber: userSequenceNumber || null,
          isDeleted: false,
        };
        
        // 使用 syncFullOrder 而不是 updateOrderCache 确保完整同步
        orderSyncManager.syncFullOrder(newOrder);
        console.log('✅ 新订单已完整同步到状态管理器:', orderId);
        
        // 触发订单历史更新事件，传递完整订单对象
        const { eventBus } = await import('../utils/eventBus');
        eventBus.emit('orderHistoryUpdate', { 
          orderId: orderId,
          orderNumber: orderNumber,
          orderData: newOrder
        });
      } catch (error) {
        console.warn('⚠️ 同步新订单到状态管理器失败:', error);
      }

      const submitResponse = await submitOrder(orderId);

      if (!submitResponse.success) {
        throw new Error(submitResponse.message || '提交订单失败');
      }

      changeEmotion('✅');
      setIsOrderSubmitting(false);
      
      // Return success to trigger payment flow
      return true;

    } catch (error: any) {
      console.error('订单确认失败:', error);
      setInputError(error.message || '订单确认失败，请重试');
      triggerShake();
      changeEmotion('😰');
      setIsOrderSubmitting(false);
      setIsProcessingOrder(false);
      return false;
    } finally {
      setIsProcessingOrder(false);
    }
  }, [
    isProcessingOrder,
    authResult,
    address,
    deliveryTime,
    selectedAllergies,
    selectedPreferences,
    budget,
    selectedFoodType,
    isFreeOrder,
    currentUserSequenceNumber,
    otherAllergyText,
    otherPreferenceText,
    selectedAddressSuggestion,
    setCurrentOrderId,
    setCurrentOrderNumber,
    setCurrentUserSequenceNumber,
    setIsOrderSubmitting,
    setInputError,
    changeEmotion,
    triggerShake,
  ]);

  // Handle payment completion
  const handlePaymentComplete = useCallback((success: boolean, orderText?: string) => {
    if (success) {
      // 确保只有在订单确认步骤（步骤6）才处理支付完成
      if (currentStep < 6) {
        console.log('⚠️ 支付完成回调被调用，但当前不在订单确认步骤，跳过处理');
        return;
      }
      
      // Save step 6 answer
      const orderConfirmationAnswer = {
        type: 'orderConfirmation' as const,
        value: 'payment_completed',
        orderData: {
          address,
          deliveryTime,
          selectedAllergies,
          selectedPreferences,
          selectedFoodType,
          budget,
        },
        timestamp: Date.now(),
      };
      
      setCompletedAnswers((prev: any) => ({
        ...prev,
        [6]: orderConfirmationAnswer,
      }));
      
      // 同步支付状态到订单管理器
      try {
        import('../utils/orderSyncManager').then(({ handlePaymentStatusChange }) => {
          const orderId = localStorage.getItem('current_order_id');
          if (orderId) {
            handlePaymentStatusChange(orderId, 'paid', {
              paidAt: new Date().toISOString(),
              paymentId: `payment_${Date.now()}`, // 实际场景中应该使用真实的paymentId
            });
            console.log('✅ 支付状态已同步到订单管理器:', orderId);
          }
        });
      } catch (error) {
        console.warn('⚠️ 同步支付状态失败:', error);
      }
      
      // Start order processing flow
      setIsSearchingRestaurant(true);
      setOrderStatus?.('searching'); // 设置订单状态为"正在挑选"
      
      // 不再调用 typeText('正在挑选', ...) 
      // 订单处理状态将由 OrderProcessingStatus 组件显示
      
      setTimeout(() => {
        // Push order summary
        createOrderSummaryAndPush(
          address,
          deliveryTime,
          selectedAllergies,
          selectedPreferences,
          selectedFoodType,
          budget
        );
        
        // End searching state
        setIsSearchingRestaurant(false);
        setIsOrderCompleted(true);
        changeEmotion('✅');
      }, 500);

      if (orderText) {
        setOrderMessage(orderText);
      }
    }
  }, [
    currentStep, // 新增
    address,
    deliveryTime,
    selectedAllergies,
    selectedPreferences,
    selectedFoodType,
    budget,
    setCompletedAnswers,
    setIsSearchingRestaurant,
    setOrderStatus, // 确保这个也在依赖中
    setIsOrderCompleted,
    setOrderMessage,
    typeText,
    changeEmotion,
    createOrderSummaryAndPush,
  ]);

  // Reset order state for new order
  const resetOrderState = useCallback(() => {
    setIsOrderCompleted(false);
    setIsSearchingRestaurant(false);
    setOrderMessage('');
    setCurrentOrderId(null);
    setCurrentOrderNumber(null);
    setIsProcessingOrder(false);
  }, [
    setIsOrderCompleted,
    setIsSearchingRestaurant,
    setOrderMessage,
    setCurrentOrderId,
    setCurrentOrderNumber,
  ]);

  return {
    isProcessingOrder,
    handleConfirmOrder,
    handlePaymentComplete,
    createOrderSummaryAndPush,
    resetOrderState,
  };
};