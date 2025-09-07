import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Animated, Platform, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { getOrderHistory } from '../services/api';
import { Order } from '../types/order';
import { formatOrderForDisplay, getOrderPriorityStatus } from '../utils/orderTransformer';
import { eventBus } from '../utils/eventBus';
import { ActionButton } from './ActionButton';
import { getOrderDisplayStatus } from '../services/api';

interface OrderHistorySidebarProps {
  isVisible: boolean;
  onClose: () => void;
  onOrderSelect: (order: Order) => void;
  userId: string | null;
}

export const OrderHistorySidebar: React.FC<OrderHistorySidebarProps> = ({
  isVisible,
  onClose,
  onOrderSelect,
  userId,
}) => {
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-400));

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
      
      console.log('📋 API返回结果:', result);
      
      if (result.success) {
        // 数据已经在API层转换过了
        const orders = result.data?.orders || [];
        console.log('✅ 订单历史加载成功，订单数量:', orders.length);
        console.log('📋 订单列表详细:', orders);
        
        // 更新订单缓存到同步管理器
        try {
          const { orderSyncManager } = await import('../utils/orderSyncManager');
          orderSyncManager.batchUpdateOrderCache(orders);
          console.log('📊 已更新订单缓存到同步管理器');
        } catch (error) {
          console.warn('更新订单缓存失败:', error);
        }
        
        setOrders(orders);
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
    
    // 监听订单状态变化事件，实时更新订单显示
    const offOrderStateChanged = eventBus.on('orderStateChanged', (eventData: any) => {
      if (eventData?.order) {
        setOrders(currentOrders => 
          currentOrders.map(order => 
            order.id === eventData.orderId ? eventData.order : order
          )
        );
        console.log('📊 订单状态实时更新:', eventData);
      }
    });
    
    return () => {
      off();
      offOrderStateChanged();
    };
  }, [userId, loadOrderHistory]);

  const getOrderAmount = (order: Order): string => {
    // 直接使用统一的字段名
    return order.budgetAmount?.toString() || '未知';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`;
  };

  const getStatusDisplay = (order: Order) => {
    const statusInfo = getOrderDisplayStatus(order);
    return {
      text: statusInfo.displayStatusText,
      color: statusInfo.displayStatusColor,
      bgColor: statusInfo.displayStatusColor + '20', // 添加透明度
      canContinuePayment: statusInfo.canContinuePayment,
    };
  };

  // 获取订单显示信息
  const getOrderDisplayInfo = (order: Order) => {
    const displayOrder = formatOrderForDisplay(order);
    return {
      foodType: displayOrder.displayFoodType,
      deliveryTime: displayOrder.displayDeliveryTime
    };
  };
  
  // 处理订单点击
  const handleOrderPress = (order: Order) => {
    onOrderSelect(order);
  };

  // 处理继续支付
  const handleContinuePayment = async (order: Order, e: any) => {
    e.stopPropagation(); // 防止触发订单详情
    
    console.log('🔄 开始继续支付，订单:', order);
    
    try {
      // 检查是否在开发模式下跳过支付
      const { DEV_CONFIG } = await import('../constants');
      if (DEV_CONFIG.SKIP_PAYMENT) {
        console.log('🧪 测试模式：模拟历史订单支付成功');
        
        // 模拟支付成功，更新订单状态
        const mockPaymentData = {
          paymentStatus: 'paid',
          paidAt: new Date().toISOString(),
          paymentId: `mock_payment_history_${Date.now()}`,
        };
        
        // 使用订单同步管理器更新支付状态
        const { orderSyncManager } = await import('../utils/orderSyncManager');
        orderSyncManager.syncPaymentStatus(order.id, 'paid', mockPaymentData);
        
        console.log('✅ 测试模式：历史订单支付状态已更新为已支付');
        
        // 延迟刷新订单历史，确保状态更新体现
        setTimeout(() => {
          loadOrderHistory();
        }, 1000);
        return;
      }

      const { createPaymentForHistoryOrder, redirectToAlipayPayment } = await import('../services/api');
      
      const paymentData = {
        provider: 'alipay' as const,
        amount: order.budgetAmount,
        paymentMethod: 'h5' as const,
      };

      console.log('🔄 创建历史订单支付，数据:', paymentData);

      const response = await createPaymentForHistoryOrder(order.id, paymentData);
      
      if (response.success && response.data?.h5_url) {
        console.log('✅ 历史订单支付创建成功');
        redirectToAlipayPayment(response.data.h5_url);
        // 支付创建成功后，刷新订单历史以显示最新状态
        setTimeout(() => {
          loadOrderHistory();
        }, 1000);
      } else {
        console.error('创建支付失败:', response.message);
      }
    } catch (error) {
      console.error('继续支付失败:', error);
    }
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
                orders.map((order) => {
                  const status = getStatusDisplay(order);
                  return (
                    <View key={order.id} style={styles.orderContainer}>
                      <TouchableOpacity 
                        style={styles.orderCard} 
                        activeOpacity={0.7}
                        onPress={() => handleOrderPress(order)}
                      >
                        <View style={styles.orderContent}>
                          {/* 左：时间 */}
                          <View style={styles.cellLeft}>
                            <Text style={styles.orderTimeSimple}>{formatDate(order.createdAt)}</Text>
                          </View>
                          {/* 中：状态徽章 */}
                          <View style={styles.cellMiddle}>
                            <View style={[styles.statusPill, { backgroundColor: status.bgColor }]}>
                              <Text
                                numberOfLines={1}
                                style={[styles.statusText, { color: status.color }]}
                              >
                                {status.text}
                              </Text>
                            </View>
                          </View>
                          {/* 右：金额 */}
                          <View style={styles.cellRight}>
                            <Text style={styles.amountText}>
                              {getOrderAmount(order) === '未知' ? '—' : `¥${getOrderAmount(order)}`}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                      
                    </View>
                  );
                })
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </TouchableOpacity>
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
    width: '65%', // 确保侧边栏只占屏幕65%
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
  orderContainer: {
    marginBottom: 8,
  },
  orderCard: {
    backgroundColor: 'transparent',
    paddingVertical: 16, // 增加垂直间距，确保触摸目标足够大
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    minHeight: 64, // 确保最小触摸目标高度
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    minHeight: 24,
    minWidth: 50, // 确保有足够的宽度
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
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
  paymentButtonContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  continuePaymentButton: {
    backgroundColor: theme.PRIMARY,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continuePaymentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
