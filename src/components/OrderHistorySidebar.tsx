import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Animated, Platform, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { getOrderHistory } from '../services/api';
import { OrderDetailModal } from './OrderDetailModal';
import { normalizeOrderData } from '../utils/orderDataMapper';

interface Order {
  id: string;
  orderNumber: string;
  address: string;
  budget?: string;
  amount?: string; // 备用字段
  totalAmount?: string; // 备用字段
  status: 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
  createdAt: string;
  deliveryTime?: string;
  foodType?: string[];
  preferences?: string[];
  allergies?: string[];
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
  }, [isVisible, userId]);

  // 监听订单历史更新事件
  useEffect(() => {
    const handleOrderHistoryUpdate = () => {
      if (userId) {
        loadOrderHistory();
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('orderHistoryUpdate', handleOrderHistoryUpdate);
      return () => {
        window.removeEventListener('orderHistoryUpdate', handleOrderHistoryUpdate);
      };
    }
  }, [userId]);

  const loadOrderHistory = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      console.log('🔄 开始加载订单历史，用户ID:', userId);
      const result = await getOrderHistory(userId);
      console.log('🔄 API返回结果:', result);
      
      if (result.success) {
        // 处理后端返回的数据格式
        let rawOrders = result.data?.orders || result.data || result.orders || [];
        console.log('📦 原始订单历史数据 (未规范化):', rawOrders);
        
        if (rawOrders.length > 0) {
          console.log('📦 第一个原始订单完整结构:', JSON.stringify(rawOrders[0], null, 2));
        }
        
        // 规范化订单数据结构
        const normalizedOrders = rawOrders.map((order: any) => normalizeOrderData(order));
        
        if (normalizedOrders.length > 0) {
          console.log('📦 第一个规范化订单详情:', normalizedOrders[0]);
          console.log('📦 规范化订单完整结构:', JSON.stringify(normalizedOrders[0], null, 2));
        }
        setOrders(normalizedOrders);
      } else {
        console.error('❌ API返回失败:', result.message);
      }
    } catch (error) {
      console.error('❌ 加载订单历史失败:', error);
    } finally {
      setLoading(false);
    }
  };

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
    
    console.log('💰 订单金额检查:', {
      orderId: order.id,
      budget: order.budget,
      amount: order.amount,
      totalAmount: order.totalAmount,
      form_data_budget: order.form_data?.budget,
      formData_budget: order.formData?.budget,
      finalAmount: amount
    });
    
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'processing': return '处理中';
      case 'delivering': return '配送中';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'processing': return '#4169E1';
      case 'delivering': return '#32CD32';
      case 'completed': return '#228B22';
      case 'cancelled': return '#DC143C';
      default: return theme.TEXT_SECONDARY;
    }
  };

  // 获取食物类型显示
  const getFoodTypeDisplay = (order: Order): string => {
    const foodType = order.foodType || order.form_data?.foodType || order.formData?.foodType || [];
    if (!foodType || foodType.length === 0) return '🍽️ 未指定';
    
    if (Array.isArray(foodType)) {
      if (foodType.includes('drink')) return '🧋 奶茶';
      if (foodType.includes('food')) return '🍱 正餐';
    }
    return '🍽️ 未指定';
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
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                      <View style={styles.statusContainer}>
                        {(order.status === 'processing' || order.status === 'delivering') && (
                          <ActivityIndicator 
                            size="small" 
                            color={getStatusColor(order.status)} 
                            style={styles.statusSpinner}
                          />
                        )}
                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                          {getStatusText(order.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <Text style={styles.orderTime}>{formatDate(order.createdAt)}</Text>
                    <Text style={styles.orderAddress} numberOfLines={2}>{order.address}</Text>
                    
                    <View style={styles.orderDetails}>
                      <View style={styles.orderMeta}>
                        <Text style={styles.detailText}>
                          {getFoodTypeDisplay(order)}
                        </Text>
                        <Text style={styles.detailText}>
                          {getDeliveryTimeDisplay(order)}
                        </Text>
                      </View>
                      <Text style={styles.amountText}>¥{getOrderAmount(order)}</Text>
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
    backgroundColor: 'transparent', // 透明背景
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.TEXT_PRIMARY,
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  statusSpinner: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  orderTime: {
    fontSize: 12,
    color: theme.TEXT_SECONDARY,
    marginBottom: 6,
    fontWeight: '300',
  },
  orderAddress: {
    fontSize: 14,
    color: theme.TEXT_PRIMARY,
    marginBottom: 12,
    lineHeight: 20,
    fontWeight: '300',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  orderMeta: {
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: theme.TEXT_SECONDARY,
    fontWeight: '300',
    marginBottom: 2,
  },
  amountText: {
    fontSize: 16,
    color: theme.TEXT_PRIMARY,
    fontWeight: '500',
    textAlign: 'right',
  },
});