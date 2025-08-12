/**
 * API服务层 - 处理与后端验证码系统和地址搜索的通信
 * 
 * 功能模块：
 * 1. 手机验证码发送和验证
 * 2. 邀请码验证和用户创建  
 * 3. 高德地图地址搜索（核心功能）
 * 
 * 地址搜索优化策略：
 * - 至少4个汉字才开始搜索
 * - 500ms防抖延迟减少API调用
 * - 5分钟智能缓存机制
 * - 最多返回8个建议
 * - API失败时不显示模拟数据
 */

import { ENV_CONFIG } from '../config/env';
import { Platform } from 'react-native';
import type { AddressSuggestion, AddressSearchResponse } from '../types';
import { CookieManager } from '../utils/cookieManager';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface VerificationResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
  is_new_user?: boolean;
  user_sequence?: number; // 用户注册次序
}

export interface AliyunLoginResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
  is_new_user?: boolean;
  user_sequence?: number;
}

export interface InviteCodeResponse {
  success: boolean;
  message: string;
  user_id?: string;
  phone_number?: string;
  user_invite_code?: string;
  user_sequence?: number; // 用户注册次序
}

export interface UserInviteStatsResponse {
  success: boolean;
  user_invite_code?: string;
  current_uses?: number;
  max_uses?: number;
  remaining_uses?: number;
  message?: string;
  // 免单相关
  eligible_for_free_drink?: boolean;
  free_drink_claimed?: boolean;
  free_drinks_remaining?: number; // 全局免单剩余数量
}

export interface InviteProgressResponse {
  success: boolean;
  invitations?: Array<{
    phone_number: string;
    invited_at: string;
    masked_phone: string;
  }>;
  total_invitations?: number;
  message?: string;
}
export interface OrderData {
  address: string;
  allergies: string[];
  preferences: string[];
  budget: string;
  foodType: string[];
  // 免单相关
  isFreeOrder?: boolean;
  freeOrderType?: 'invite_reward'; // 免单类型：邀请奖励
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  order_id?: string;
  order_number?: string;
  user_sequence_number?: number;
}

export interface SubmitOrderResponse {
  success: boolean;
  message: string;
  order_number?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export interface OrdersResponse {
  success: boolean;
  orders: any[];
  count: number;
}

// API配置
const API_PREFIX = '/v1';
const API_BASE_URL = ENV_CONFIG.API_URL;

// 构建完整的API URL
const buildApiUrl = (endpoint: string) => {
  // 如果endpoint已经包含/v1，不重复添加
  if (endpoint.startsWith('/v1')) {
    return `${API_BASE_URL}${endpoint}`;
  }
  return `${API_BASE_URL}${API_PREFIX}${endpoint}`;
};

/**
 * 统一错误处理函数，提供用户友好的错误信息
 */
function handleApiError(error: any, context: string): string {
  // 🔧 生产环境日志清理：条件性日志输出
  if (process.env.NODE_ENV === 'development') {
    console.error(`API错误 [${context}]:`, error);
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // 网络连接错误
    if (message.includes('network') || message.includes('fetch')) {
      return '网络连接不稳定，请检查网络后重试';
    }
    
    // 服务器错误
    if (message.includes('500') || message.includes('internal server')) {
      return '服务暂时不可用，请稍后再试';
    }
    
    // 超时错误
    if (message.includes('timeout')) {
      return '请求超时，请检查网络后重试';
    }
    
    // 授权错误
    if (message.includes('401') || message.includes('unauthorized')) {
      return '身份验证失败，请重新登录';
    }
    
    // 返回原始错误信息或默认信息
    return error.message || '网络错误，请重试';
  }
  
  // 未知错误类型
  return '网络错误，请重试';
}

/**
 * 增强的fetch函数，包含超时和错误处理
 */
async function enhancedFetch(url: string, options: RequestInit, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('请求超时，请检查网络后重试');
    }
    throw error;
  }
}

/**
 * 带JWT认证的fetch函数
 */
async function authFetch(url: string, options: RequestInit = {}, timeout: number = 10000): Promise<Response> {
  const token = CookieManager.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await enhancedFetch(url, {
    ...options,
    headers
  }, timeout);
  
  // 处理401未授权
  if (response.status === 401) {
    // 清除本地认证信息
    CookieManager.clearSession();
    CookieManager.removeItem('auth_token');
    throw new Error('身份验证失败，请重新登录');
  }
  
  return response;
}

// 带重试的请求（处理移动端偶发的网络抖动）
async function fetchWithRetry(
  request: () => Promise<Response>,
  retries: number = 2,
  retryDelayMs: number = 600
): Promise<Response> {
  try {
    return await request();
  } catch (error) {
    if (retries <= 0) throw error;
    const message = (error instanceof Error ? error.message : '').toLowerCase();
    // 仅在网络/超时错误时重试
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('abort')) {
      await new Promise((r) => setTimeout(r, retryDelayMs));
      return fetchWithRetry(request, retries - 1, retryDelayMs * 1.5);
    }
    throw error;
  }
}


/**
 * 发送手机验证码
 */
export async function sendVerificationCode(phoneNumber: string): Promise<ApiResponse> {
  try {
    const response = await fetchWithRetry(
      () => enhancedFetch(buildApiUrl('/send-verification-code'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber
        })
      }, 12000),
      2,
      700
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '发送验证码失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: handleApiError(error, '发送验证码')
    };
  }
}

/**
 * 验证手机验证码并登录/注册
 */
export async function verifyCodeAndLogin(phoneNumber: string, code: string): Promise<VerificationResponse> {
  try {
    const response = await fetchWithRetry(
      () => enhancedFetch(buildApiUrl('/login-with-phone'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          verification_code: code
        })
      }, 12000),
      2,
      700
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '验证码验证失败');
    }

    // 解包data并保存token
    if (result.success && result.data) {
      const { access_token, user_id, phone_number, is_new_user, user_sequence } = result.data;
      
      // 保存JWT token
      if (access_token) {
        CookieManager.saveItem('auth_token', access_token);
      }
      
      // 返回解包后的数据
      return {
        success: true,
        message: result.message,
        user_id,
        phone_number,
        is_new_user,
        user_sequence
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message: handleApiError(error, '验证码验证')
    };
  }
}

/**
 * 使用阿里云 Dypnsapi 的 SpToken 登录
 */
export async function loginWithAliyunSpToken(spToken: string): Promise<AliyunLoginResponse> {
  try {
    const response = await enhancedFetch(buildApiUrl('/login-with-aliyun-sp-token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sp_token: spToken })
    }, 12000);

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || '一键登录失败');
    }

    if (result.success && result.data) {
      const { access_token, user_id, phone_number, is_new_user, user_sequence } = result.data;
      if (access_token) {
        CookieManager.saveItem('auth_token', access_token);
      }
      return {
        success: true,
        message: result.message,
        user_id,
        phone_number,
        is_new_user,
        user_sequence
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message: handleApiError(error, '阿里云一键登录')
    } as AliyunLoginResponse;
  }
}

/**
 * 验证邀请码并创建新用户
 */
export async function verifyInviteCodeAndCreateUser(phoneNumber: string, inviteCode: string): Promise<InviteCodeResponse> {
  try {
    const response = await fetch(buildApiUrl('/verify-invite-code'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: phoneNumber,
        invite_code: inviteCode
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '邀请码验证失败');
    }

    // 解包data并保存token
    if (result.success && result.data) {
      const { access_token, user_id, phone_number, user_invite_code, user_sequence } = result.data;
      
      // 保存JWT token
      if (access_token) {
        CookieManager.saveItem('auth_token', access_token);
      }
      
      // 返回解包后的数据
      return {
        success: true,
        message: result.message,
        user_id,
        phone_number,
        user_invite_code,
        user_sequence
      };
    }

    return result;
  } catch (error) {
    // 邀请码验证失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**

 * 搜索地址建议 - 集成高德地图API
 * 优化策略：
 * 1. 最少输入4个汉字才开始搜索
 * 2. 防抖延迟500ms减少API调用
 * 3. 缓存搜索结果，相同关键词不重复调用
 * 4. 最多返回8个建议减少界面复杂度
 */

// 缓存搜索结果
const searchCache = new Map<string, { results: AddressSuggestion[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function searchAddresses(query: string): Promise<AddressSearchResponse> {
  try {
    // 输入验证：至少4个汉字
    const trimmedQuery = query.trim();
    const chineseCharCount = (trimmedQuery.match(/[\u4e00-\u9fff]/g) || []).length;
    
    if (!trimmedQuery || chineseCharCount < 4) {
      return {
        success: true,
        message: '请至少输入4个汉字',
        predictions: []
      };
    }

    const keywords = trimmedQuery;

    // 检查缓存
    const cached = searchCache.get(keywords);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return {
        success: true,
        message: '搜索成功（缓存）',
        predictions: cached.results
      };
    }

    // 调用高德地图API
    // 使用配置的API Key
    const AMAP_KEY = ENV_CONFIG.AMAP_KEY;

    if (!AMAP_KEY) {
      // 高德地图API Key未配置，使用模拟数据
      return getFallbackResults(keywords);
    }

    const response = await fetch(`https://restapi.amap.com/v3/assistant/inputtips?key=${AMAP_KEY}&keywords=${encodeURIComponent(keywords)}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 检查高德API返回状态
    if (data.status !== '1') {
      // 高德API返回错误，使用模拟数据
      return getFallbackResults(keywords);
    }

    // 转换高德API数据格式为我们的格式
    const suggestions: AddressSuggestion[] = (data.tips || [])
      .slice(0, 8) // 最多8个建议
      .map((tip: any, index: number) => ({
        place_id: tip.id || `${keywords}_${index}`,
        description: formatAddress(tip),
        structured_formatting: {
          main_text: tip.name || keywords,
          secondary_text: formatSecondaryText(tip)
        }
      }));

    // 缓存结果
    searchCache.set(keywords, {
      results: suggestions,
      timestamp: Date.now()
    });

    // 清理过期缓存（简单的内存管理）
    if (searchCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
        }
      }
    }

    return {
      success: true,
      message: '搜索成功',
      predictions: suggestions
    };

  } catch (error) {
    // 地址搜索失败时静默处理

    // 降级处理：返回模拟数据
    return getFallbackResults(query.trim());
  }
}

/**
 * 格式化地址显示
 */
function formatAddress(tip: any): string {
  const parts = [];

  if (tip.name) parts.push(tip.name);
  if (tip.address && tip.address !== tip.name) parts.push(tip.address);
  if (tip.district) parts.push(tip.district);

  return parts.join(', ') || tip.name || '未知地址';
}

/**
 * 格式化次要文本
 */
function formatSecondaryText(tip: any): string {
  const parts = [];

  if (tip.address && tip.address !== tip.name) parts.push(tip.address);
  if (tip.district) parts.push(tip.district);

  return parts.join(', ') || '详细地址';
}

/**
 * 降级处理：API失败时的模拟数据
 */
function getFallbackResults(keywords: string): AddressSearchResponse {
  // 不再提供模拟的"街道、大道"数据，直接返回空结果
  return {
    success: true,
    message: '搜索服务暂时不可用，请稍后重试',
    predictions: []
  };
}

/**
 * 创建订单
 */
export async function createOrder(userId: string, phoneNumber: string, formData: OrderData): Promise<CreateOrderResponse> {
  try {
    const response = await authFetch(buildApiUrl('/create-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        phone_number: phoneNumber,
        form_data: formData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '创建订单失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: handleApiError(error, '创建订单')
    };
  }
}

/**
 * 提交订单
 */
export async function submitOrder(orderId: string): Promise<SubmitOrderResponse> {
  try {
    const response = await authFetch(buildApiUrl('/submit-order'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '提交订单失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: handleApiError(error, '提交订单')
    };
  }
}

/**
 * 获取用户邀请统计信息
 */
export async function getUserInviteStats(userId: string): Promise<UserInviteStatsResponse> {
  try {
    const response = await fetch(buildApiUrl(`/get-user-invite-stats?user_id=${encodeURIComponent(userId)}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取邀请统计失败');
    }

    return data;
  } catch (error) {
    // 获取邀请统计失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 获取用户邀请进度
 */
export async function getInviteProgress(userId: string): Promise<InviteProgressResponse> {
  try {
    const response = await fetch(buildApiUrl(`/get-invite-progress?user_id=${encodeURIComponent(userId)}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取邀请进度失败');
    }

    return data;
  } catch (error) {
    // 获取邀请进度失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 免单相关接口
 */

export interface FreeDrinkResponse {
  success: boolean;
  message: string;
  free_drinks_remaining?: number;
}

// 用户偏好相关接口
export interface UserPreferences {
  default_address: string;
  default_food_type: string[];
  default_allergies: string[];
  default_preferences: string[];
  default_budget: string;
  other_allergy_text?: string;
  other_preference_text?: string;
  address_suggestion?: any;
}

export interface PreferencesResponse {
  success: boolean;
  message?: string;
  preferences?: UserPreferences;
  has_preferences?: boolean;
}

export interface PreferencesCompletenessResponse {
  success: boolean;
  has_preferences: boolean;
  is_complete: boolean;
  can_quick_order: boolean;
  preferences?: UserPreferences;
  message?: string;
}

export interface FormDataFromPreferencesResponse {
  success: boolean;
  has_preferences: boolean;
  message?: string;
  form_data: {
    address: string;
    selectedFoodType: string[];
    selectedAllergies: string[];
    selectedPreferences: string[];
    budget: string;
    otherAllergyText: string;
    otherPreferenceText: string;
    selectedAddressSuggestion: any;
  };
  can_quick_order?: boolean;
}

/**
 * 领取免单奶茶资格
 */
export async function claimFreeDrink(userId: string): Promise<FreeDrinkResponse> {
  try {
    const response = await fetch(buildApiUrl('/claim-free-drink'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '领取免单失败');
    }

    return data;
  } catch (error) {
    // 领取免单失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 获取免单剩余数量
 */
export async function getFreeDrinksRemaining(): Promise<FreeDrinkResponse> {
  try {
    const response = await fetch(buildApiUrl('/free-drinks-remaining'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取免单信息失败');
    }

    return data;
  } catch (error) {
    // 获取免单信息失败时静默处理
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 用户偏好相关API函数
 */

/**
 * 获取用户偏好设置
 */
export async function getUserPreferences(userId: string): Promise<PreferencesResponse> {
  try {
    const response = await fetch(buildApiUrl(`/preferences/${userId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取用户偏好失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}

/**
 * 保存用户偏好设置
 */
export async function saveUserPreferences(userId: string, formData: any): Promise<PreferencesResponse> {
  try {
    const response = await enhancedFetch(buildApiUrl('/preferences'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        form_data: formData
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '保存用户偏好失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      message: handleApiError(error, '保存用户偏好')
    };
  }
}

/**
 * 检查用户偏好是否完整（用于判断是否可以快速下单）
 */
export async function checkPreferencesCompleteness(userId: string): Promise<PreferencesCompletenessResponse> {
  try {
    const response = await enhancedFetch(buildApiUrl(`/preferences/${userId}/complete`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '检查偏好完整性失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      has_preferences: false,
      is_complete: false,
      can_quick_order: false,
      message: handleApiError(error, '检查偏好完整性')
    };
  }
}

/**
 * 获取用户偏好并转换为表单数据格式
 */
export async function getPreferencesAsFormData(userId: string): Promise<FormDataFromPreferencesResponse> {
  try {
    const response = await fetch(buildApiUrl(`/preferences/${userId}/form-data`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '获取偏好表单数据失败');
    }

    return data;
  } catch (error) {
    return {
      success: false,
      has_preferences: false,
      form_data: {
        address: '',
        selectedFoodType: [],
        selectedAllergies: [],
        selectedPreferences: [],
        budget: '',
        otherAllergyText: '',
        otherPreferenceText: '',
        selectedAddressSuggestion: null
      },
      message: error instanceof Error ? error.message : '网络错误，请重试'
    };
  }
}