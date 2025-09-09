import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Modal,
  Dimensions,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { Order, OrderStatus, ORDER_STATUS_DISPLAY, ORDER_STATUS_COLOR } from '../types/order';
import { useAuth, useForm, useOrder, useUI } from '../contexts/AppContext';
import QuestionWizard from './QuestionWizard';
import { SimpleIcon } from './SimpleIcon';

// Helper functions for status display
const getStatusText = (status: OrderStatus): string => {
  return ORDER_STATUS_DISPLAY[status] || '未知';
};

const getStatusColor = (status: OrderStatus): string => {
  return ORDER_STATUS_COLOR[status] || '#999999';
};

interface OrderDetailModalProps {
  isVisible: boolean;
  order: Order;
  onClose: () => void;
}

/**
 * 订单详情Modal - 显示与主页完全相同的界面
 */
export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isVisible,
  order,
  onClose,
}) => {
  const { theme } = useTheme();
  const { width, height } = Dimensions.get('window');
  
  // Context hooks
  const auth = useAuth();
  const form = useForm();
  const orderContext = useOrder();
  const ui = useUI();
  
  // Local state for order messages
  const [orderMessagesLog, setOrderMessagesLog] = useState<any[]>([]);
  
  // Order message push function
  const pushOrderMessage = useCallback((text: string, avatar: 'assistant' | 'delivery') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setOrderMessagesLog(prev => [...prev, { id, text, avatar }]);
  }, []);
  
  // Load order data into form when modal opens
  useEffect(() => {
    if (isVisible && order) {
      // 🐛 调试：打印订单数据结构
      console.log('📋 历史订单数据:', order);
      console.log('📋 订单元数据:', order.metadata);
      console.log('📋 食物类型:', order.metadata?.foodType);
      console.log('📋 忌口信息:', order.dietaryRestrictions);
      console.log('📋 口味偏好:', order.foodPreferences);
      
      // 设置表单数据为历史订单的数据
      form.setAddress(order.deliveryAddress || '');
      form.setBudget(order.budgetAmount ? String(order.budgetAmount) : '');
      
      // 处理食物类型 - 多种可能的数据结构
      let foodTypes: string[] = [];
      if (Array.isArray(order.metadata?.foodType)) {
        foodTypes = order.metadata.foodType;
      } else if (typeof order.metadata?.foodType === 'string') {
        foodTypes = [order.metadata.foodType];
      } else if (order.foodType) {
        // 检查是否有直接的 foodType 字段
        foodTypes = Array.isArray(order.foodType) ? order.foodType : order.foodType.split('、');
      }
          
      // 处理忌口信息 - 多种可能的数据结构  
      let dietaryRestrictions: string[] = [];
      if (Array.isArray(order.dietaryRestrictions)) {
        dietaryRestrictions = order.dietaryRestrictions;
      } else if (typeof order.dietaryRestrictions === 'string') {
        dietaryRestrictions = order.dietaryRestrictions.split('、');
      }
          
      // 处理口味偏好 - 多种可能的数据结构
      let foodPreferences: string[] = [];
      if (Array.isArray(order.foodPreferences)) {
        foodPreferences = order.foodPreferences;
      } else if (typeof order.foodPreferences === 'string') {
        foodPreferences = order.foodPreferences.split('、');
      }
      
      console.log('🔄 解析后的数据:', { foodTypes, dietaryRestrictions, foodPreferences });
      
      form.setSelectedFoodType(foodTypes);
      form.setSelectedAllergies(dietaryRestrictions);
      form.setSelectedPreferences(foodPreferences);
      form.setDeliveryTime(order.deliveryTime || '');
      
      // 设置订单ID
      orderContext.setCurrentOrderId(order.id);
      
      // 根据订单状态设置支付状态
      if (order.status !== 'unpaid') {
        // 非unpaid状态说明已支付
        orderContext.setIsPaymentCompleted(true);
        orderContext.setIsOrderCompleted(true);
      } else {
        orderContext.setIsPaymentCompleted(false);
        orderContext.setIsOrderCompleted(false);
      }
      
      // 🎯 关键：设置所有步骤为已完成，并构建已完成答案
      const completedAnswers: { [key: number]: string } = {};
      
      // Step 0: 配送地址 - 必须有具体内容
      if (order.deliveryAddress) {
        completedAnswers[0] = order.deliveryAddress;
      }
      
      // Step 1: 食物类型 - 确保有具体内容
      if (foodTypes.length > 0) {
        completedAnswers[1] = foodTypes.join('、');
      } else {
        // 尝试从其他字段获取
        const fallbackFoodType = order.metadata?.orderType || '未知';
        completedAnswers[1] = fallbackFoodType;
      }
      
      // Step 2: 忌口说明 - 有内容就显示，没有就显示默认
      if (dietaryRestrictions.length > 0) {
        completedAnswers[2] = dietaryRestrictions.join('、');
      } else {
        completedAnswers[2] = '无特殊忌口';
      }
      
      // Step 3: 口味偏好 - 有内容就显示
      if (foodPreferences.length > 0) {
        completedAnswers[3] = foodPreferences.join('、');
      } else {
        completedAnswers[3] = '无特殊偏好';
      }
      
      // Step 4: 用餐时间 - 必须有具体内容
      if (order.deliveryTime) {
        completedAnswers[4] = order.deliveryTime;
      } else {
        completedAnswers[4] = '尽快送达';
      }
      
      // Step 5: 预算设置 - 必须有具体内容
      if (order.budgetAmount) {
        completedAnswers[5] = `¥${order.budgetAmount}`;
      }
      
      console.log('✅ 构建的已完成答案:', completedAnswers);
      
      // 🎯 关键：先设置已完成答案，再设置当前步骤
      form.setCompletedAnswers(completedAnswers);
      
      // 设置当前步骤为最后一步（订单确认），这样会显示所有已完成的步骤
      form.setCurrentStep(6);
      form.setEditingStep(null);
      
      // 🔑 强制刷新组件状态，确保答案被正确显示
      setTimeout(() => {
        form.setCompletedAnswers({ ...completedAnswers });
      }, 100);
    }
  }, [isVisible, order]);
  
  // Handle close - reset everything
  const handleClose = useCallback(() => {
    // 重置表单状态
    form.resetForm();
    orderContext.resetOrder();
    setOrderMessagesLog([]);
    onClose();
  }, [onClose, form, orderContext]);
  
  const styles = createStyles(theme);
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.container}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* 顶部导航栏 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <SimpleIcon name="arrow-left" size={24} color={theme.TEXT_PRIMARY} />
            </TouchableOpacity>
            
            <Text style={styles.title}>订单详情</Text>
            
            <View style={styles.headerRight}>
              {order && (
                <View style={[styles.statusPill, { 
                  backgroundColor: getStatusColor(order.status) + '20'
                }]}>
                  <Text style={[styles.statusText, { 
                    color: getStatusColor(order.status)
                  }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 主界面 - 使用与主页完全相同的 QuestionWizard */}
          <QuestionWizard
            theme={theme}
            width={width}
            height={height - 100} // 减去header高度
            orderMessagesLog={orderMessagesLog}
            pushOrderMessage={pushOrderMessage}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    backgroundColor: theme.BACKGROUND,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 12,
    marginLeft: -12,
    borderRadius: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 50,
    justifyContent: 'flex-end',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});