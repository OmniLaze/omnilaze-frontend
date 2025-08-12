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

interface UseOrderSocketOptions {
  userId?: string;
  orderId?: string;
  enabled?: boolean;
  onOrderUpdate?: (event: OrderUpdateEvent) => void;
  onPaymentUpdate?: (event: PaymentUpdateEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useOrderSocket({
  userId,
  orderId,
  enabled = true,
  onOrderUpdate,
  onPaymentUpdate,
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
      const socket = io(ENV_CONFIG.API_URL, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // 连接成功
      socket.on('connect', () => {
        console.log('[WebSocket] 连接成功');
        setIsConnected(true);
        setConnectionError(null);

        // 订阅用户维度的事件
        if (userId) {
          socket.emit('subscribe.user', { userId });
          console.log(`[WebSocket] 订阅用户: ${userId}`);
        }

        // 订阅订单维度的事件
        if (orderId) {
          socket.emit('subscribe.order', { orderId });
          console.log(`[WebSocket] 订阅订单: ${orderId}`);
        }

        onConnect?.();
      });

      // 连接断开
      socket.on('disconnect', () => {
        console.log('[WebSocket] 连接断开');
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

      // 订单更新事件
      socket.on('order.updated', (data: OrderUpdateEvent) => {
        console.log('[WebSocket] 订单更新:', data);
        onOrderUpdate?.(data);
      });

      // 支付更新事件
      socket.on('payment.updated', (data: PaymentUpdateEvent) => {
        console.log('[WebSocket] 支付更新:', data);
        onPaymentUpdate?.(data);
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('[WebSocket] 初始化失败:', error);
      setConnectionError(error as Error);
      onError?.(error as Error);
    }
  }, [enabled, userId, orderId, onOrderUpdate, onPaymentUpdate, onConnect, onDisconnect, onError]);

  // 断开WebSocket连接
  const disconnect = useCallback(() => {
    if (socketRef.current) {
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
  };
}