import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Animated, Platform, SafeAreaView, Image } from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { getOrderHistory } from '../services/api';
import { OrderDetailModal } from './OrderDetailModal';
import { normalizeOrderData, formatOrderStatus } from '../utils/orderDataMapper';
import { eventBus } from '../utils/eventBus';

interface Order {
  id: string;
  orderNumber: string;
  address: string;
  budget?: string;
  amount?: string; // 备用字段
  totalAmount?: string; // 备用字段
  status: 'draft' | 'submitted' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'pending';
  createdAt: string;
  deliveryTime?: string;
  foodType?: string[];
  preferences?: string[];
  allergies?: string[];
  // 到达图片字段
  arrivalImageUrl?: string;
  arrivalImageTakenAt?: string;
  arrivalImageSource?: string;
  // 支持嵌套的表单数据结构
  form_data?: {
    budget?: string;
    address?: string;
    deliveryTime?: string;
    allergies?: string[];
    preferences?: string[];
    foodType?: string[];
  };
  formData?: {
    budget?: string;
    address?: string;
    deliveryTime?: string;
    allergies?: string[];
    preferences?: string[];
    foodType?: string[];
  };
}

interface OrderHistorySidebarProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string | null;
}

export const OrderHistorySidebar: React.FC<OrderHistorySidebarProps> = ({
  isVisible,
  onClose,
  userId,
}) => {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-400));
  
  // 订单详情状态
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);

  // 使用 useCallback 包装 loadOrderHistory，避免函数重复创建
  const loadOrderHistory = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      // 调试日志已简化
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 加载订单历史，用户ID:', userId);
      }
      const result = await getOrderHistory(userId);
      
      if (result.success) {
        // 处理后端返回的数据格式
        let rawOrders = result.data?.orders || result.data || result.orders || [];
        
        // 规范化订单数据结构
        const normalizedOrders = rawOrders.map((order: any) => normalizeOrderData(order));
        setOrders(normalizedOrders);
      } else {
        console.error('获取订单历史失败:', result.message);
      }
    } catch (error) {
      console.error('加载订单历史时出错:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isVisible && userId) {
      loadOrderHistory();
      // Slide in animation
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out animation
      Animated.timing(slideAnim, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, userId, loadOrderHistory]); // 添加 loadOrderHistory 作为依赖

  // 监听订单历史更新事件
  useEffect(() => {
    const off = eventBus.on('orderHistoryUpdate', () => {
      if (userId) {
        loadOrderHistory();
      }
    });
    return off;
  }, [userId, loadOrderHistory]);

  const getOrderAmount = (order: Order): string => {
    // 尝试多个可能的字段名和嵌套结构
    let amount = null;
    
    // 直接字段检查
    if (order.budget && order.budget !== '0' && order.budget !== '') {
      amount = order.budget;
    } else if (order.amount && order.amount !== '0' && order.amount !== '') {
      amount = order.amount;
    } else if (order.totalAmount && order.totalAmount !== '0' && order.totalAmount !== '') {
      amount = order.totalAmount;
    }
    
    // 检查嵌套的表单数据 (form_data)
    if (!amount && order.form_data) {
      if (order.form_data.budget && order.form_data.budget !== '0' && order.form_data.budget !== '') {
        amount = order.form_data.budget;
      }
    }
    
    // 检查其他可能的嵌套结构
    if (!amount && order.formData) {
      if (order.formData.budget && order.formData.budget !== '0' && order.formData.budget !== '') {
        amount = order.formData.budget;
      }
    }
    
    // 调试日志已移除，避免性能问题
    // 如需调试，可临时启用：
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('💰 订单金额检查:', {
    //     orderId: order.id,
    //     budget: order.budget,
    //     amount: order.amount,
    //     totalAmount: order.totalAmount,
    //     form_data_budget: order.form_data?.budget,
    //     formData_budget: order.formData?.budget,
    //     finalAmount: amount
    //   });
    // }
    
    if (!amount || amount === '0' || amount === '') {
      return '未知';
    }
    return amount;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`;
  };

  const getStatusText = (status: string) => formatOrderStatus(status).text;
  const getStatusColor = (status: string) => formatOrderStatus(status).color || theme.TEXT_SECONDARY;
  const getStatusBgColor = (status: string) => formatOrderStatus(status).bgColor || theme.GRAY_100;

  // 获取食物类型显示
  const getFoodTypeDisplay = (order: Order): string => {
    const foodType = order.foodType || order.form_data?.foodType || order.formData?.foodType || [];
    if (!foodType || foodType.length === 0) return '未指定';
    
    if (Array.isArray(foodType)) {
      if (foodType.includes('drink')) return '奶茶';
      if (foodType.includes('food')) return '正餐';
    }
    return '未指定';
  };
  
  // 获取送达时间显示
  const getDeliveryTimeDisplay = (order: Order): string => {
    const time = order.deliveryTime || order.form_data?.deliveryTime || order.formData?.deliveryTime;
    if (!time) return '未指定';
    if (time === 'ASAP') return '越快越好';
    return time;
  };
  
  // 处理订单点击
  const handleOrderPress = (order: Order) => {
    console.log('🔍 点击订单，准备显示详情:', order);
    console.log('🔍 订单form_data:', order.form_data);
    console.log('🔍 订单formData:', order.formData);
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // 关闭订单详情
  const handleCloseOrderDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
              <Text style={styles.title}>订单历史</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.PRIMARY} />
                  <Text style={styles.loadingText}>加载中...</Text>
                </View>
              ) : orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>暂无订单记录</Text>
                </View>
              ) : (
                orders.map((order) => (
                  <TouchableOpacity 
                    key={order.id} 
                    style={styles.orderCard} 
                    activeOpacity={0.6}
                    onPress={() => handleOrderPress(order)}
                  >
                    <View style={styles.orderContent}>
                      {/* 左：时间 */}
                      <View style={styles.cellLeft}>
                        <Text style={styles.orderTimeSimple}>{formatDate(order.createdAt)}</Text>
                      </View>
                      {/* 中：状态徽章 */}
                      <View style={styles.cellMiddle}>
                        <View style={[styles.statusPill, { backgroundColor: getStatusBgColor(order.status) }]}>
                          <Text
                            numberOfLines={1}
                            style={[styles.statusText, { color: getStatusColor(order.status) }]}
                          >
                            {getStatusText(order.status)}
                          </Text>
                        </View>
                      </View>
                      {/* 右：金额 */}
                      <View style={styles.cellRight}>
                        <Text style={styles.amountText}>{getOrderAmount(order) === '未知' ? '—' : `¥${getOrderAmount(order)}`}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </TouchableOpacity>
      
      {/* 订单详情模态框 */}
      <OrderDetailModal
        order={selectedOrder}
        isVisible={showOrderDetail}
        onClose={handleCloseOrderDetail}
      />
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? 380 : '85%', // 移动端使用相对宽度
    maxWidth: 400, // 最大宽度限制
    backgroundColor: theme.BACKGROUND,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 16,
    borderBottomWidth: 0, // 移除边框
  },
  title: {
    fontSize: 24,
    fontWeight: '300', // 更轻的字重
    color: theme.TEXT_PRIMARY,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 24,
    right: 24,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.TEXT_SECONDARY,
    fontWeight: '300',
  },
  orderList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    color: theme.TEXT_SECONDARY,
    fontSize: 14,
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: theme.TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 24,
  },
  orderCard: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
  },
  orderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cellLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  cellMiddle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellRight: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    minHeight: 22,
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  foodTypeName: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.TEXT_PRIMARY,
    flex: 1,
  },
  orderTimeSimple: {
    fontSize: 14,
    color: theme.TEXT_SECONDARY,
    fontWeight: '300',
  },
  amountText: {
    fontSize: 14,
    color: theme.TEXT_PRIMARY,
    fontWeight: '400',
  },
});
