/**
 * API服务扩展 - 支付继续功能
 */

import { ENV_CONFIG } from '../config/env';
import { CookieManager } from '../utils/cookieManager';
import { orderSyncManager } from '../utils/orderSyncManager';

// Re-export types from main API file
import type { ApiResponse, CreatePaymentData, CreatePaymentResponse } from './api';

// Build API URL helper
const buildApiUrl = (endpoint: string) => {
  if (endpoint.startsWith('/v1')) {
    return `${ENV_CONFIG.API_URL}${endpoint}`;
  }
  return `${ENV_CONFIG.API_URL}/v1${endpoint}`;
};

// Auth fetch helper
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = CookieManager.getItem('auth_token');
  const headers = {
    ...options.headers,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

/**
 * 为历史订单创建支付 - 支持从订单历史继续支付
 */
export async function createPaymentForHistoryOrder(orderId: string, paymentData: CreatePaymentData): Promise<CreatePaymentResponse> {
  try {
    // 更新订单状态为支付中（保持统一状态系统）
    // 支付中时订单状态仍为unpaid，只是UI上显示处理中
    orderSyncManager.syncStatusChange(orderId, 'unpaid', {
      isSelecting: false,
      isDelivering: false,
      isDelivered: false,
      isFeedbackCompleted: false
    });

    const response = await authFetch(buildApiUrl(`/orders/${orderId}/payment`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      // 支付创建失败，保持unpaid状态
      throw new Error(data.message || '为历史订单创建支付失败');
    }

    return data;
  } catch (error) {
    // 确保失败时状态正确
    orderSyncManager.syncStatusChange(orderId, 'unpaid');
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '为历史订单创建支付失败',
    };
  }
}

/**
 * 获取订单的支付状态和可继续支付信息
 */
export async function getOrderPaymentInfo(orderId: string): Promise<ApiResponse<{
  paymentStatus: string;
  canContinuePayment: boolean;
  existingPaymentId?: string;
  amount: number;
}>> {
  try {
    const response = await authFetch(buildApiUrl(`/orders/${orderId}/payment-info`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取订单支付信息失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '获取订单支付信息失败',
    };
  }
}

/**
 * 检查订单是否可以继续支付
 */
export function canOrderContinuePayment(order: any): boolean {
  // 使用新的统一状态系统
  // 只有unpaid状态的订单可以继续支付
  return order.status === 'unpaid';
}

/**
 * 获取订单显示状态的颜色和文本 - 使用新的统一状态系统
 */
export function getOrderDisplayStatus(order: any): {
  displayStatusText: string;
  displayStatusColor: string;
  canContinuePayment: boolean;
} {
  // 导入状态显示映射
  const ORDER_STATUS_DISPLAY: Record<string, string> = {
    'unpaid': '未支付',
    'paid': '已支付',
    'selecting': '正在挑选',
    'delivering': '配送中',
    'delivered': '已送达',
    'feedback_completed': '已完成'
  };

  const ORDER_STATUS_COLOR: Record<string, string> = {
    'unpaid': '#6B7280',      // 灰色
    'paid': '#10B981',         // 绿色
    'selecting': '#F59E0B',    // 橙色
    'delivering': '#3B82F6',   // 蓝色
    'delivered': '#8B5CF6',    // 紫色
    'feedback_completed': '#10B981' // 绿色
  };

  // 直接使用新的统一状态
  const status = order.status || 'unpaid';
  
  return {
    displayStatusText: ORDER_STATUS_DISPLAY[status] || '未知',
    displayStatusColor: ORDER_STATUS_COLOR[status] || '#999999',
    canContinuePayment: status === 'unpaid',
  };
}