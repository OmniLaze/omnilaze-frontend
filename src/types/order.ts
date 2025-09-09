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
 * 订单状态类型 - 新的统一状态系统
 */
export type OrderStatus = 'unpaid' | 'paid' | 'selecting' | 'delivering' | 'delivered' | 'feedback_completed';

/**
 * 支付状态类型 - 统一的支付状态管理
 */
export type PaymentStatus = 'unpaid' | 'pending_payment' | 'paid' | 'failed' | 'refunded' | 'partial_refunded';

/**
 * 状态显示映射
 */
export const ORDER_STATUS_DISPLAY: Record<OrderStatus, string> = {
  'unpaid': '未支付',
  'paid': '已支付',
  'selecting': '正在挑选',
  'delivering': '配送中',
  'delivered': '已送达',
  'feedback_completed': '已完成'
};

/**
 * 状态颜色映射
 */
export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  'unpaid': '#6B7280',      // 灰色
  'paid': '#10B981',         // 绿色
  'selecting': '#F59E0B',    // 橙色
  'delivering': '#3B82F6',   // 蓝色
  'delivered': '#8B5CF6',    // 紫色
  'feedback_completed': '#10B981' // 绿色
};

/**
 * 订单接口 - 与后端Prisma模型对齐
 */
export interface Order {
  // === 基础信息 ===
  id: string;
  orderNumber: string;
  userId: string;
  phoneNumber: string;
  status: OrderStatus;  // 新的统一状态
  
  // === 新增状态字段 ===
  isSelecting?: boolean;         // 是否挑选中
  isDelivering?: boolean;        // 是否配送中  
  isDelivered?: boolean;         // 是否已送达
  isFeedbackCompleted?: boolean; // 是否已反馈
  
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
  orderDate?: string | null;     // 下单日期
  arrivalImageImportedAt?: string | null; // 图片导入时间
  
  // === 关联数据 ===
  feedbacks?: OrderFeedback[];
  voiceFeedbacks?: OrderVoiceFeedback[];
  
  // === 测试订单支持 ===
  isTestOrder?: boolean;            // 标记是否为测试订单
  canContinuePayment?: boolean;     // 是否可以从历史订单继续支付
  
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