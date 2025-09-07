/**
 * API服务扩展 - 早期订单创建和支付继续功能
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
    // 更新订单支付状态为处理中
    orderSyncManager.syncPaymentStatus(orderId, 'pending_payment');

    const response = await authFetch(buildApiUrl(`/orders/${orderId}/payment`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      // 支付创建失败，恢复为未支付状态
      orderSyncManager.syncPaymentStatus(orderId, 'unpaid');
      throw new Error(data.message || '为历史订单创建支付失败');
    }

    return data;
  } catch (error) {
    // 确保失败时状态正确
    orderSyncManager.syncPaymentStatus(orderId, 'failed');
    
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
  // 订单状态为draft或submitted，且支付状态为unpaid或failed时，可以继续支付
  const validOrderStatuses = ['draft', 'submitted'];
  const validPaymentStatuses = ['unpaid', 'failed'];
  
  return validOrderStatuses.includes(order.status) && 
         validPaymentStatuses.includes(order.paymentStatus);
}

/**
 * 获取订单显示状态的颜色和文本
 */
export function getOrderDisplayStatus(order: any): {
  displayStatusText: string;
  displayStatusColor: string;
  canContinuePayment: boolean;
} {
  // 优先检查送达状态
  if (order.arrivalImageUrl || order.displayStatus === 'completed') {
    return {
      displayStatusText: '已送达',
      displayStatusColor: '#10b981',
      canContinuePayment: false,
    };
  }

  // 检查支付和订单状态
  switch (order.paymentStatus || order.displayStatus) {
    case 'paid':
      if (order.status === 'delivering' || order.displayStatus === 'delivering') {
        return {
          displayStatusText: '配送中',
          displayStatusColor: '#3b82f6',
          canContinuePayment: false,
        };
      }
      return {
        displayStatusText: '已支付',
        displayStatusColor: '#10b981',
        canContinuePayment: false,
      };

    case 'pending_payment':
      return {
        displayStatusText: '支付中',
        displayStatusColor: '#f59e0b',
        canContinuePayment: true,
      };

    case 'failed':
      return {
        displayStatusText: '支付失败',
        displayStatusColor: '#ef4444',
        canContinuePayment: true,
      };

    case 'unpaid':
    default:
      return {
        displayStatusText: '未支付',
        displayStatusColor: '#6b7280',
        canContinuePayment: true,
      };
  }
}