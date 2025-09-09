/**
 * 订单状态同步管理器
 * 统一管理订单状态在所有界面间的同步
 */

import React from 'react';
import { eventBus } from './eventBus';
import { Order, OrderStatus } from '../types/order';
import { updateOrderPaymentStatus, getOrderPriorityStatus } from './orderTransformer';

export interface OrderStateUpdateEvent {
  orderId: string;
  type: 'status_changed' | 'payment_status' | 'eta_set' | 'delivered' | 'feedback_completed' | 'full_update';
  data: {
    status?: OrderStatus;
    paymentStatus?: string;
    orderStatus?: string;
    paidAt?: string;
    paymentId?: string;
    arrivalImageUrl?: string;
    arrivalImageTakenAt?: string;
    estimatedDeliveryTime?: string;
    updatedAt?: string;
    message?: string;
    // 新增状态字段
    isSelecting?: boolean;
    isDelivering?: boolean;
    isDelivered?: boolean;
    isFeedbackCompleted?: boolean;
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
      case 'status_changed':
        // 处理新的统一状态变更
        updatedOrder = {
          ...currentOrder,
          status: data.status!,
          isSelecting: data.isSelecting ?? currentOrder.isSelecting,
          isDelivering: data.isDelivering ?? currentOrder.isDelivering,
          isDelivered: data.isDelivered ?? currentOrder.isDelivered,
          isFeedbackCompleted: data.isFeedbackCompleted ?? currentOrder.isFeedbackCompleted,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        break;
        
      case 'payment_status':
        updatedOrder = updateOrderPaymentStatus(
          currentOrder,
          data.paymentStatus!,
          {
            paidAt: data.paidAt,
            paymentId: data.paymentId,
          }
        );
        // 支付成功后自动更新状态为paid
        if (data.paymentStatus === 'paid') {
          updatedOrder.status = 'paid';
        }
        break;
      
      case 'eta_set':
        // 设置ETA时自动更新为delivering状态
        updatedOrder = {
          ...currentOrder,
          status: 'delivering',
          isDelivering: true,
          isSelecting: false,
          metadata: {
            ...currentOrder.metadata,
            eta_estimated_at: data.estimatedDeliveryTime,
          },
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        break;
      
      case 'delivered':
        // 送达时更新状态
        updatedOrder = {
          ...currentOrder,
          status: 'delivered',
          isDelivered: true,
          isDelivering: false,
          arrivalImageUrl: data.arrivalImageUrl || currentOrder.arrivalImageUrl,
          arrivalImageTakenAt: data.arrivalImageTakenAt || currentOrder.arrivalImageTakenAt,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        break;
        
      case 'feedback_completed':
        // 反馈完成时更新状态
        updatedOrder = {
          ...currentOrder,
          status: 'feedback_completed',
          isFeedbackCompleted: true,
          isDelivered: true, // 已反馈说明也已送达
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        break;
      
      case 'order_status':
        // 兼容旧的order_status类型
        updatedOrder = {
          ...currentOrder,
          status: (data.orderStatus || data.status) as OrderStatus,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        break;
      
      case 'delivery_status':
        // 兼容旧的delivery_status类型
        updatedOrder = {
          ...currentOrder,
          status: 'delivered',
          isDelivered: true,
          arrivalImageUrl: data.arrivalImageUrl || currentOrder.arrivalImageUrl,
          arrivalImageTakenAt: data.arrivalImageTakenAt || currentOrder.arrivalImageTakenAt,
          updatedAt: data.updatedAt || new Date().toISOString(),
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
   * 同步统一状态变化
   */
  syncStatusChange(orderId: string, status: OrderStatus, stateFields?: {
    isSelecting?: boolean;
    isDelivering?: boolean;
    isDelivered?: boolean;
    isFeedbackCompleted?: boolean;
  }) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'status_changed',
      data: {
        status,
        ...stateFields,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * 同步ETA设置
   */
  syncETASet(orderId: string, estimatedDeliveryTime: string) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'eta_set',
      data: {
        estimatedDeliveryTime,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * 同步订单送达
   */
  syncOrderDelivered(orderId: string, deliveryData: {
    arrivalImageUrl?: string;
    arrivalImageTakenAt?: string;
  }) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'delivered',
      data: {
        ...deliveryData,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  /**
   * 同步反馈完成
   */
  syncFeedbackCompleted(orderId: string) {
    this.broadcastOrderUpdate({
      orderId,
      type: 'feedback_completed',
      data: {
        updatedAt: new Date().toISOString(),
      },
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
 * 便捷函数：处理统一状态变化
 */
export function handleStatusChange(orderId: string, status: OrderStatus, stateFields?: any) {
  orderSyncManager.syncStatusChange(orderId, status, stateFields);
}

/**
 * 便捷函数：处理ETA设置
 */
export function handleETASet(orderId: string, estimatedDeliveryTime: string) {
  orderSyncManager.syncETASet(orderId, estimatedDeliveryTime);
}

/**
 * 便捷函数：处理订单送达
 */
export function handleOrderDelivered(orderId: string, deliveryData: any) {
  orderSyncManager.syncOrderDelivered(orderId, deliveryData);
}

/**
 * 便捷函数：处理反馈完成
 */
export function handleFeedbackCompleted(orderId: string) {
  orderSyncManager.syncFeedbackCompleted(orderId);
}