/**
 * WebSocket Hook - 订单和支付状态实时更新
 * 连接到omnilaze-backend的WebSocket服务
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../config/env';

export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  updatedAt: string;
  [key: string]: any;
}

export interface PaymentUpdateEvent {
  orderId: string;
  paymentId: string;
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'cancelled';
  updatedAt: string;
  [key: string]: any;
}

// 新增：订单状态变更事件
export interface OrderStatusChangedEvent {
  orderId: string;
  status: string;
  type: 'eta_set' | 'status_changed' | 'delivered';
  message?: string;
  estimatedDeliveryTime?: string;
  arrivalImageUrl?: string;
  updatedAt: string;
}

// 新增：ETA设置事件
export interface OrderETASetEvent {
  orderId: string;
  type: 'eta_set';
  estimatedDeliveryTime: string;
  message: string;
  updatedAt: string;
}

// 新增：订单送达事件
export interface OrderDeliveredEvent {
  orderId: string;
  type: 'delivered';
  arrivalImageUrl?: string;
  message: string;
  updatedAt: string;
}

interface UseOrderSocketOptions {
  userId?: string;
  orderId?: string;
  enabled?: boolean;
  jwtToken?: string; // 新增：JWT认证token
  onOrderUpdate?: (event: OrderUpdateEvent) => void;
  onPaymentUpdate?: (event: PaymentUpdateEvent) => void;
  // 新增事件回调
  onOrderStatusChanged?: (event: OrderStatusChangedEvent) => void;
  onOrderETASet?: (event: OrderETASetEvent) => void;
  onOrderDelivered?: (event: OrderDeliveredEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useOrderSocket({
  userId,
  orderId,
  enabled = true,
  jwtToken,
  onOrderUpdate,
  onPaymentUpdate,
  onOrderStatusChanged,
  onOrderETASet,
  onOrderDelivered,
  onConnect,
  onDisconnect,
  onError,
}: UseOrderSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  // 连接WebSocket
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) return;

    try {
      // 构建WebSocket URL - 连接到 /ws 命名空间
      const baseUrl = ENV_CONFIG.API_URL.replace('/v1', '');
      const wsUrl = baseUrl.replace(/^http/, 'ws');
      
      console.log('[WebSocket] 正在连接到:', `${wsUrl}/ws`);
      
      const socketOptions: any = {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      };

      // 如果有JWT token，添加认证信息
      if (jwtToken) {
        socketOptions.auth = { token: jwtToken };
        console.log('[WebSocket] 使用JWT认证');
      }

      const socket = io(`${baseUrl}/ws`, socketOptions);

      // 连接成功
      socket.on('connect', () => {
        console.log('[WebSocket] 连接成功');
        setIsConnected(true);
        setConnectionError(null);

        // 订阅用户维度的事件
        if (userId) {
          socket.emit('subscribe.user', { userId }, (response: any) => {
            console.log(`[WebSocket] 订阅用户响应: ${userId}`, response);
          });
        }

        // 订阅订单维度的事件
        if (orderId) {
          socket.emit('subscribe.order', { orderId }, (response: any) => {
            console.log(`[WebSocket] 订阅订单响应: ${orderId}`, response);
          });
        }

        onConnect?.();
      });

      // 连接断开
      socket.on('disconnect', (reason) => {
        console.log('[WebSocket] 连接断开:', reason);
        setIsConnected(false);
        onDisconnect?.();
      });

      // 连接错误
      socket.on('connect_error', (error) => {
        console.error('[WebSocket] 连接错误:', error.message);
        setConnectionError(error);
        setIsConnected(false);
        onError?.(error);
      });

      // 原有事件监听
      socket.on('order.updated', (data: OrderUpdateEvent) => {
        console.log('[WebSocket] 订单更新:', data);
        onOrderUpdate?.(data);
      });

      socket.on('payment.updated', (data: PaymentUpdateEvent) => {
        console.log('[WebSocket] 支付更新:', data);
        onPaymentUpdate?.(data);
      });

      // 新增事件监听
      socket.on('order.status.changed', (data: OrderStatusChangedEvent) => {
        console.log('[WebSocket] 订单状态变更:', data);
        onOrderStatusChanged?.(data);
      });

      socket.on('order.eta.set', (data: OrderETASetEvent) => {
        console.log('[WebSocket] 订单ETA设置:', data);
        onOrderETASet?.(data);
      });

      socket.on('order.delivered', (data: OrderDeliveredEvent) => {
        console.log('[WebSocket] 订单送达:', data);
        onOrderDelivered?.(data);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[WebSocket] 初始化失败:', error);
      setConnectionError(error as Error);
      onError?.(error as Error);
    }
  }, [enabled, userId, orderId, jwtToken, onOrderUpdate, onPaymentUpdate, onOrderStatusChanged, onOrderETASet, onOrderDelivered, onConnect, onDisconnect, onError]);

  // 断开WebSocket连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[WebSocket] 主动断开连接');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // 发送自定义事件
  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[WebSocket] 未连接，无法发送事件:', event);
    }
  }, []);

  // 订阅新订单（动态）
  const subscribeToOrder = useCallback((newOrderId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe.order', { orderId: newOrderId }, (response: any) => {
        console.log(`[WebSocket] 订阅新订单响应: ${newOrderId}`, response);
      });
    } else {
      console.warn('[WebSocket] 未连接，无法订阅订单:', newOrderId);
    }
  }, []);

  // 生命周期管理
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // 当userId或orderId变化时重新订阅
  useEffect(() => {
    if (isConnected && socketRef.current) {
      if (userId) {
        socketRef.current.emit('subscribe.user', { userId });
        console.log(`[WebSocket] 重新订阅用户: ${userId}`);
      }
      if (orderId) {
        socketRef.current.emit('subscribe.order', { orderId });
        console.log(`[WebSocket] 重新订阅订单: ${orderId}`);
      }
    }
  }, [isConnected, userId, orderId]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    subscribeToOrder,
  };
}