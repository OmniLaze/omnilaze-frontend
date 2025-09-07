/**
 * 订单数据转换器 - 处理后端数据与前端Order类型之间的转换
 */

import { 
  Order, 
  OrderMetadata, 
  OrderDisplayStatus, 
  CreateOrderFormData,
  OrderFeedback,
  OrderVoiceFeedback 
} from '../types/order';
import { VALUE_MAPPING } from '../data/checkboxOptions';

/**
 * 将后端返回的订单数据转换为前端Order类型
 * @param backendOrder 后端返回的原始订单数据
 * @returns 转换后的Order对象
 */
export function transformBackendOrder(backendOrder: any): Order {
  // 安全解析JSON字符串
  const parseDietaryRestrictions = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const parseFoodPreferences = (data: any): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  // 解析metadata
  const parseMetadata = (metadata: any): OrderMetadata => {
    if (!metadata) return {};
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return {};
      }
    }
    return metadata;
  };

  // 转换反馈数据
  const transformFeedbacks = (feedbacks: any[]): OrderFeedback[] => {
    if (!feedbacks || !Array.isArray(feedbacks)) return [];
    return feedbacks.map(feedback => ({
      id: feedback.id,
      orderId: feedback.orderId || feedback.order_id,
      userId: feedback.userId || feedback.user_id,
      rating: feedback.rating,
      comment: feedback.comment || null,
      createdAt: feedback.createdAt || feedback.created_at
    }));
  };

  // 转换语音反馈数据
  const transformVoiceFeedbacks = (voiceFeedbacks: any[]): OrderVoiceFeedback[] => {
    if (!voiceFeedbacks || !Array.isArray(voiceFeedbacks)) return [];
    return voiceFeedbacks.map(vf => ({
      id: vf.id,
      orderId: vf.orderId || vf.order_id,
      userId: vf.userId || vf.user_id,
      audioUrl: vf.audioUrl || vf.audio_url,
      durationSec: vf.durationSec || vf.duration_sec,
      transcript: vf.transcript || null,
      createdAt: vf.createdAt || vf.created_at
    }));
  };

  const metadata = parseMetadata(backendOrder.metadata);

  return {
    // 基础信息
    id: backendOrder.id,
    orderNumber: backendOrder.orderNumber || backendOrder.order_number,
    userId: backendOrder.userId || backendOrder.user_id,
    phoneNumber: backendOrder.phoneNumber || backendOrder.phone_number,
    status: backendOrder.status || 'draft',
    displayStatus: (backendOrder.displayStatus || 'unpaid') as OrderDisplayStatus,
    
    // 订单内容
    deliveryAddress: backendOrder.deliveryAddress || backendOrder.delivery_address || '',
    deliveryTime: backendOrder.deliveryTime || backendOrder.delivery_time || null,
    dietaryRestrictions: parseDietaryRestrictions(
      backendOrder.dietaryRestrictions || backendOrder.dietary_restrictions
    ),
    foodPreferences: parseFoodPreferences(
      backendOrder.foodPreferences || backendOrder.food_preferences
    ),
    budgetAmount: Number(backendOrder.budgetAmount || backendOrder.budget_amount || 0),
    budgetCurrency: backendOrder.budgetCurrency || backendOrder.budget_currency || 'CNY',
    metadata: metadata,
    
    // 支付信息
    paymentStatus: backendOrder.paymentStatus || backendOrder.payment_status || null,
    paidAt: backendOrder.paidAt || backendOrder.paid_at || null,
    paymentId: backendOrder.paymentId || backendOrder.payment_id || null,
    
    // 送达图片
    arrivalImageUrl: backendOrder.arrivalImageUrl || backendOrder.arrival_image_url || null,
    arrivalImageSource: backendOrder.arrivalImageSource || backendOrder.arrival_image_source || null,
    arrivalImageTakenAt: backendOrder.arrivalImageTakenAt || backendOrder.arrival_image_taken_at || null,
    
    // 时间戳
    createdAt: backendOrder.createdAt || backendOrder.created_at,
    updatedAt: backendOrder.updatedAt || backendOrder.updated_at || null,
    submittedAt: backendOrder.submittedAt || backendOrder.submitted_at || null,
    
    // 关联数据
    feedbacks: transformFeedbacks(backendOrder.feedbacks),
    voiceFeedbacks: transformVoiceFeedbacks(backendOrder.voiceFeedbacks),
    
    // 其他
    userSequenceNumber: backendOrder.userSequenceNumber || backendOrder.user_sequence_number || null,
    isDeleted: backendOrder.isDeleted || backendOrder.is_deleted || false,
  };
}

/**
 * 准备创建订单的表单数据（前端格式→API格式）
 * @param formData 前端收集的表单数据
 * @returns API需要的form_data格式
 */
export function prepareOrderFormData(formData: {
  deliveryAddress: string;
  deliveryTime: string;
  dietaryRestrictions: string[];
  foodPreferences: string[];
  budgetAmount: string;
  foodType: string[];
  isFreeOrder?: boolean;
  freeOrderType?: 'invite_reward';
}): CreateOrderFormData {
  return {
    address: formData.deliveryAddress,
    deliveryTime: formData.deliveryTime,
    allergies: formData.dietaryRestrictions,
    preferences: formData.foodPreferences,
    budget: formData.budgetAmount,
    foodType: formData.foodType,
    isFreeOrder: formData.isFreeOrder,
    freeOrderType: formData.freeOrderType,
  };
}

/**
 * 格式化订单用于显示
 * @param order Order对象
 * @returns 格式化后的显示数据
 */
export function formatOrderForDisplay(order: Order) {
  return {
    ...order,
    // 格式化金额显示
    displayAmount: `¥${order.budgetAmount.toFixed(2)}`,
    // 格式化时间显示
    displayDeliveryTime: formatDeliveryTime(order.deliveryTime),
    // 格式化状态显示
    displayStatusText: getStatusDisplayText(order.displayStatus),
    displayStatusColor: getStatusColor(order.displayStatus),
    // 格式化食物类型
    displayFoodType: formatFoodType(order.metadata.foodType),
    // 格式化忌口
    displayDietaryRestrictions: formatDietaryRestrictions(order.dietaryRestrictions),
    // 格式化偏好
    displayFoodPreferences: formatFoodPreferences(order.foodPreferences),
  };
}

/**
 * 格式化配送时间
 */
function formatDeliveryTime(time: string | null): string {
  if (!time) return '未指定';
  if (time === 'ASAP') return '越快越好';
  return time;
}

/**
 * 获取状态显示文本
 */
function getStatusDisplayText(status: OrderDisplayStatus): string {
  const statusMap: Record<OrderDisplayStatus, string> = {
    'unpaid': '未支付',
    'pending_payment': '支付中',
    'paid': '已支付',
    'delivering': '配送中',
    'completed': '已完成',
  };
  return statusMap[status] || '未知';
}

/**
 * 获取状态颜色
 */
function getStatusColor(status: OrderDisplayStatus): string {
  const colorMap: Record<OrderDisplayStatus, string> = {
    'unpaid': '#6B7280',
    'pending_payment': '#f59e0b',
    'paid': '#4169E1',
    'delivering': '#3b82f6',
    'completed': '#10b981',
  };
  return colorMap[status] || '#999999';
}

/**
 * 格式化食物类型
 */
function formatFoodType(foodType?: string[]): string {
  if (!foodType || foodType.length === 0) return '未指定';
  return foodType.map(type => VALUE_MAPPING[type] || type).join('、');
}

/**
 * 格式化忌口
 */
function formatDietaryRestrictions(restrictions: string[]): string {
  if (!restrictions || restrictions.length === 0) return '无忌口';
  return restrictions.map(r => VALUE_MAPPING[r] || r).join('、');
}

/**
 * 格式化口味偏好
 */
function formatFoodPreferences(preferences: string[]): string {
  if (!preferences || preferences.length === 0) return '无特殊偏好';
  return preferences.map(p => VALUE_MAPPING[p] || p).join('、');
}

/**
 * 批量转换订单数组
 */
export function transformOrderList(orders: any[]): Order[] {
  if (!orders || !Array.isArray(orders)) return [];
  return orders.map(transformBackendOrder);
}

/**
 * 判断订单是否可以继续支付
 */
export function canContinuePayment(order: Order): boolean {
  const validOrderStatuses = ['draft', 'submitted', 'processing'];
  const validPaymentStatuses = ['unpaid', 'failed'];
  
  return validOrderStatuses.includes(order.status) && 
         validPaymentStatuses.includes(order.paymentStatus || 'unpaid');
}

/**
 * 获取订单的优先支付状态（用于状态同步）
 */
export function getOrderPriorityStatus(order: Order): {
  status: string;
  canPayment: boolean;
  statusText: string;
  statusColor: string;
} {
  // 如果有送达图片，优先显示已完成
  if (order.arrivalImageUrl) {
    return {
      status: 'completed',
      canPayment: false,
      statusText: '已送达',
      statusColor: '#10b981'
    };
  }

  // 检查支付状态
  if (order.paymentStatus === 'paid' && order.paidAt) {
    if (order.status === 'delivering') {
      return {
        status: 'delivering',
        canPayment: false,
        statusText: '配送中',
        statusColor: '#3b82f6'
      };
    }
    return {
      status: 'paid',
      canPayment: false,
      statusText: '已支付',
      statusColor: '#4169E1'
    };
  }

  if (order.paymentStatus === 'pending_payment') {
    return {
      status: 'pending_payment',
      canPayment: true,
      statusText: '支付中',
      statusColor: '#f59e0b'
    };
  }

  if (order.paymentStatus === 'failed') {
    return {
      status: 'failed',
      canPayment: true,
      statusText: '支付失败',
      statusColor: '#ef4444'
    };
  }

  // 默认未支付状态
  return {
    status: 'unpaid',
    canPayment: canContinuePayment(order),
    statusText: '未支付',
    statusColor: '#6B7280'
  };
}

/**
 * 更新订单的支付状态
 */
export function updateOrderPaymentStatus(
  order: Order, 
  paymentStatus: string, 
  paymentData?: any
): Order {
  return {
    ...order,
    paymentStatus: paymentStatus as any,
    paidAt: paymentStatus === 'paid' ? (paymentData?.paidAt || new Date().toISOString()) : order.paidAt,
    paymentId: paymentData?.paymentId || order.paymentId,
    updatedAt: new Date().toISOString(),
    // 更新 displayStatus 以反映新的支付状态
    displayStatus: getOrderPriorityStatus({
      ...order,
      paymentStatus: paymentStatus as any,
    }).status as any,
  };
}