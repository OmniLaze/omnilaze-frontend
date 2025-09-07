/**
 * 订单状态同步管理器
 * 统一管理订单状态在所有界面间的同步
 */

import React from 'react';
import { eventBus } from './eventBus';
import { Order } from '../types/order';
import { updateOrderPaymentStatus, getOrderPriorityStatus } from './orderTransformer';

export interface OrderStateUpdateEvent {
  orderId: string;
  type: 'payment_status' | 'order_status' | 'delivery_status' | 'full_update';
  data: {
    paymentStatus?: string;
    orderStatus?: string;
    paidAt?: string;
    paymentId?: string;
    arrivalImageUrl?: string;
    arrivalImageTakenAt?: string;
    updatedAt?: string;
    order?: Order; // 完整订单对象用于 full_update
  };
}

class OrderSyncManager {
  private orderCache: Map<string, Order> = new Map();
  private updateCallbacks: Map<string, (order: Order) => void> = new Map();

  /**
   * 注册订单更新回调
   */
  subscribeToOrderUpdates(orderId: string, callback: (order: Order) => void): () => void {
    const key = `${orderId}_${Date.now()}_${Math.random()}`;
    this.updateCallbacks.set(key, callback);

    return () => {
      this.updateCallbacks.delete(key);
    };
  }

  /**
   * 更新订单缓存
   */
  updateOrderCache(order: Order) {
    this.orderCache.set(order.id, order);
  }

  /**
   * 获取订单缓存
   */
  getOrderFromCache(orderId: string): Order | null {
    return this.orderCache.get(orderId) || null;
  }

  /**
   * 广播订单状态更新
   */
  broadcastOrderUpdate(event: OrderStateUpdateEvent) {
    const { orderId, type, data } = event;
    
    // 获取当前订单状态
    let currentOrder = this.getOrderFromCache(orderId);
    
    if (!currentOrder && data.order) {
      currentOrder = data.order;
      this.updateOrderCache(currentOrder);
    }

    if (!currentOrder) {
      console.warn('无法找到订单缓存:', orderId);
      return;
    }

    let updatedOrder: Order;

    switch (type) {
      case 'payment_status':
        updatedOrder = updateOrderPaymentStatus(
          currentOrder,
          data.paymentStatus!,
          {
            paidAt: data.paidAt,
            paymentId: data.paymentId,
          }
        );
        break;
      
      case 'order_status':
        updatedOrder = {
          ...currentOrder,
          status: data.orderStatus as any,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        break;
      
      case 'delivery_status':
        updatedOrder = {
          ...currentOrder,
          arrivalImageUrl: data.arrivalImageUrl || currentOrder.arrivalImageUrl,
          arrivalImageTakenAt: data.arrivalImageTakenAt || currentOrder.arrivalImageTakenAt,
          updatedAt: data.updatedAt || new Date().toISOString(),
          displayStatus: 'completed' as any, // 送达完成
        };
        break;
      
      case 'full_update':
        updatedOrder = data.order!;
        break;
      
      default:
        return;
    }

    // 更新缓存
    this.updateOrderCache(updatedOrder);

    // 通知所有相关的回调
    this.updateCallbacks.forEach((callback, key) => {
      if (key.includes(orderId)) {
        try {
          callback(updatedOrder);
        } catch (error) {
          console.error('订单状态更新回调执行失败:', error);
        }
      }
    });

    // 发送全局事件
    eventBus.emit('orderStateChanged', {
      orderId,
      order: updatedOrder,
      changeType: type,
    });

    // 触发订单历史更新
    eventBus.emit('orderHistoryUpdate', {
      orderId,
      orderData: updatedOrder,
    });
  }

  /**
   * 同步支付状态变化
   */
  syncPaymentStatus(orderId: string, paymentStatus: string, paymentData?: any) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'payment_status',
      data: {
        paymentStatus,
        ...paymentData,
      },
    });
  }

  /**
   * 同步订单状态变化
   */
  syncOrderStatus(orderId: string, orderStatus: string) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'order_status',
      data: {
        orderStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * 同步配送状态变化
   */
  syncDeliveryStatus(orderId: string, deliveryData: {
    arrivalImageUrl?: string;
    arrivalImageTakenAt?: string;
  }) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'delivery_status',
      data: deliveryData,
    });
  }

  /**
   * 同步完整订单更新
   */
  syncFullOrder(order: Order) {
    this.broadcastOrderUpdate({
      orderId: order.id,
      type: 'full_update',
      data: {
        order,
      },
    });
  }

  /**
   * 清理订单缓存
   */
  clearOrderCache(orderId?: string) {
    if (orderId) {
      this.orderCache.delete(orderId);
    } else {
      this.orderCache.clear();
    }
  }

  /**
   * 批量更新订单缓存
   */
  batchUpdateOrderCache(orders: Order[]) {
    orders.forEach(order => {
      this.updateOrderCache(order);
    });
  }
}

// 单例模式
export const orderSyncManager = new OrderSyncManager();

/**
 * React Hook：订阅订单状态更新
 */
export function useOrderSync(orderId?: string) {
  const [order, setOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    if (!orderId) return;

    // 从缓存获取初始状态
    const cachedOrder = orderSyncManager.getOrderFromCache(orderId);
    if (cachedOrder) {
      setOrder(cachedOrder);
    }

    // 订阅更新
    const unsubscribe = orderSyncManager.subscribeToOrderUpdates(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
    });

    return unsubscribe;
  }, [orderId]);

  return order;
}

/**
 * 便捷函数：处理支付状态变化
 */
export function handlePaymentStatusChange(orderId: string, paymentStatus: string, paymentData?: any) {
  orderSyncManager.syncPaymentStatus(orderId, paymentStatus, paymentData);
}

/**
 * 便捷函数：处理订单状态变化
 */
export function handleOrderStatusChange(orderId: string, orderStatus: string) {
  orderSyncManager.syncOrderStatus(orderId, orderStatus);
}

/**
 * 便捷函数：处理配送状态变化
 */
export function handleDeliveryStatusChange(orderId: string, deliveryData: any) {
  orderSyncManager.syncDeliveryStatus(orderId, deliveryData);
}