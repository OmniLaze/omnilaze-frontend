/**
 * 统一的订单类型定义 - 与后端数据结构对齐
 */

/**
 * 订单元数据
 */
export interface OrderMetadata {
  foodType?: string[];
  orderType?: string;
  eta_estimated_at?: string;
  eta_source?: string;
  [key: string]: any; // 允许其他扩展字段
}

/**
 * 订单反馈
 */
export interface OrderFeedback {
  id: string;
  orderId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

/**
 * 订单语音反馈
 */
export interface OrderVoiceFeedback {
  id: string;
  orderId: string;
  userId: string;
  audioUrl: string;
  durationSec?: number;
  transcript?: string;
  createdAt: string;
}

/**
 * 订单状态类型 - 与后端保持一致
 */
export type OrderStatus = 'draft' | 'submitted' | 'processing' | 'delivering' | 'completed' | 'cancelled';

/**
 * 支付状态类型 - 统一的支付状态管理
 */
export type PaymentStatus = 'unpaid' | 'pending_payment' | 'paid' | 'failed' | 'refunded' | 'partial_refunded';

/**
 * 显示状态类型 - 用于UI展示的简化状态
 */
export type OrderDisplayStatus = 'unpaid' | 'pending_payment' | 'paid' | 'delivering' | 'completed';

/**
 * 订单接口 - 与后端Prisma模型对齐
 */
export interface Order {
  // === 基础信息 ===
  id: string;
  orderNumber: string;
  userId: string;
  phoneNumber: string;
  status: OrderStatus;
  displayStatus: OrderDisplayStatus;
  
  // === 订单内容（使用后端字段名）===
  deliveryAddress: string;
  deliveryTime: string | null;
  dietaryRestrictions: string[];  // 前端解析后的数组
  foodPreferences: string[];      // 前端解析后的数组
  budgetAmount: number;
  budgetCurrency: string;
  metadata: OrderMetadata;
  
  // === 支付信息 ===
  paymentStatus: PaymentStatus;
  paidAt?: string | null;
  paymentId?: string | null;
  
  // === 送达图片 ===
  arrivalImageUrl?: string | null;
  arrivalImageSource?: string | null;
  arrivalImageTakenAt?: string | null;
  
  // === 时间戳 ===
  createdAt: string;
  updatedAt?: string | null;
  submittedAt?: string | null;
  
  // === 关联数据 ===
  feedbacks?: OrderFeedback[];
  voiceFeedbacks?: OrderVoiceFeedback[];
  
  // === 早期订单支持 ===
  isEarlyOrder?: boolean;          // 标记是否为早期创建的订单
  canContinuePayment?: boolean;    // 是否可以从历史订单继续支付
  
  // === 其他 ===
  userSequenceNumber?: number | null;
  isDeleted?: boolean;
}

/**
 * 创建订单的表单数据 - API请求格式
 */
export interface CreateOrderFormData {
  address: string;
  deliveryTime: string;
  allergies: string[];
  preferences: string[];
  budget: string;
  foodType: string[];
  isFreeOrder?: boolean;
  freeOrderType?: 'invite_reward';
}

/**
 * 早期订单创建的表单数据 - 在用户初始化时创建
 */
export interface CreateEarlyOrderData {
  userId: string;
  phoneNumber: string;
  basicInfo?: {
    deliveryAddress?: string;
    budgetAmount?: number;
    budgetCurrency?: string;
  };
}

/**
 * 订单数据更新接口 - 用于更新早期创建的订单
 */
export interface UpdateOrderData {
  address: string;
  deliveryTime: string;
  allergies: string[];
  preferences: string[];
  budget: string;
  foodType: string[];
  isFreeOrder?: boolean;
  freeOrderType?: 'invite_reward';
}

/**
 * 订单列表响应
 */
export interface OrderListResponse {
  orders: Order[];
  count: number;
}

/**
 * 订单分页响应
 */
export interface OrderPageResponse {
  items: Order[];
  page: number;
  page_size: number;
  total: number;
}