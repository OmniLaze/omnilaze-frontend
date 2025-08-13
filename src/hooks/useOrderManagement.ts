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
}

export const useOrderManagement = (props: UseOrderManagementProps) => {
  const {
    authResult, address, deliveryTime, selectedAllergies, selectedPreferences, budget,
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
        // 这里可以使用EventEmitter或者Context来通知OrderHistorySidebar刷新
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('orderHistoryUpdate', { 
            detail: { 
              orderId: result.order_id,
              orderNumber: result.order_number 
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

  // 确认下单后开始搜索餐厅
  const handleConfirmOrder = async (orderText?: string) => {
    setIsSearchingRestaurant(true);
    changeEmotion('🔍');
    
    // 立即标记支付步骤为完成，隐藏PaymentComponent
    setCompletedAnswers((prev: any) => ({
      ...prev,
      [5]: { type: 'payment', value: '已确认支付' } // 预算是第5步
    }));
    
    // 如果有订单文字，显示它
    if (orderText) {
      // 先显示订单确认文字
      typeText(orderText, {
        instant: false,
        streaming: false,
        speed: 30,
        onComplete: () => {
          // 文字显示完成后，等待一会再显示已支付
          setTimeout(() => {
            typeText('\n\n✅ 已支付', {
              instant: false,
              speed: 30,
              append: true,
              onComplete: () => {
                // 2秒后显示正在挑选
                setTimeout(() => {
                  typeText('\n\n正在挑选...', {
                    instant: false,
                    speed: 50,
                    append: true,
                    onComplete: async () => {
                      // 开始创建订单
                      try {
                        await handleCreateOrder();
                        
                        // 5秒后显示送达时间
                        setTimeout(() => {
                          const deliveryTimeDisplay = deliveryTime === 'ASAP' 
                            ? '45分钟内' 
                            : deliveryTime;
                          typeText(`\n\n点好了，预计送达时间为 ${deliveryTimeDisplay}`, {
                            instant: false,
                            speed: 40,
                            append: true,
                            onComplete: () => {
                              // 1秒后显示跟进信息
                              setTimeout(() => {
                                typeText('\n正在持续跟进送达情况，记得保持手机畅通。', {
                                  instant: false,
                                  speed: 40,
                                  append: true,
                                  onComplete: () => {
                                    setIsOrderCompleted(true);
                                    setIsSearchingRestaurant(false);
                                    changeEmotion('✅');
                                    
                                    // 保存最终订单消息
                                    const fullMessage = orderText + '\n\n✅ 已支付' + 
                                      '\n\n点好了，预计送达时间为 ' + deliveryTimeDisplay + 
                                      '\n正在持续跟进送达情况，记得保持手机畅通。';
                                    setOrderMessage(fullMessage);
                                  }
                                });
                              }, 1000);
                            }
                          });
                        }, 5000);
                      } catch (error) {
                        setIsSearchingRestaurant(false);
                        changeEmotion('😰');
                        setInputError('订单创建失败，请重试');
                      }
                    }
                  });
                }, 2000);
              }
            });
          }, 500);
        }
      });
    } else {
      // 没有订单文字时的旧流程（备用）
      try {
        await handleCreateOrder();
      } catch (error) {
        setIsSearchingRestaurant(false);
        changeEmotion('😰');
        setInputError('订单创建失败，请重试');
      }
    }
  };

  return {
    handleCreateOrder,
    handleSubmitOrder,
    handleConfirmOrder
  };
};