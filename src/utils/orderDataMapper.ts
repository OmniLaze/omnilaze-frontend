/**
 * 数据映射工具 - 统一处理订单数据的中英文转换
 */

// 忌口选项映射 - 只包含 checkboxOptions.ts 中原有的选项
export const allergyMap: Record<string, string> = {
  'seafood': '海鲜类',
  'nuts': '坚果类',
  'eggs': '蛋类',
  'soy': '大豆类',
  'dairy': '乳制品类',
  'other-allergy': '其他',
  // 反向映射
  '海鲜类': 'seafood',
  '坚果类': 'nuts',
  '蛋类': 'eggs',
  '大豆类': 'soy',
  '乳制品类': 'dairy',
  '其他': 'other-allergy'
};

// 偏好选项映射
export const preferenceMap: Record<string, string> = {
  'spicy': '辣',
  'mild': '不辣',
  'sour': '酸',
  'sweet': '甜',
  'light': '清淡',
  'rich': '浓郁',
  'other-preference': '其他',
  // 反向映射
  '辣': 'spicy',
  '不辣': 'mild',
  '酸': 'sour',
  '甜': 'sweet',
  '清淡': 'light',
  '浓郁': 'rich',
  '其他': 'other-preference'
};

// 食物类型映射
export const foodTypeMap: Record<string, string> = {
  'food': '正餐',
  'meal': '正餐', // 后端使用 'meal'，前端期望 'food'
  'drink': '奶茶',
  // 反向映射
  '正餐': 'food',
  '奶茶': 'drink'
};

/**
 * 转换数组数据到中文显示 - 支持去重和排序
 */
export function convertToChineseDisplay(items: string | string[], mapData: Record<string, string>): string {
  if (!items) return '';
  
  const itemArray = Array.isArray(items) ? items : [items];
  
  // 转换并收集结果
  const convertedItems = itemArray.map(item => {
    // 如果已经是中文，直接返回
    if (mapData[item]) {
      return mapData[item];
    }
    // 检查是否包含"其他:"前缀
    if (item.includes('其他:') || item.includes('其他：')) {
      return item;
    }
    // 返回原值
    return item;
  }).filter(Boolean); // 过滤掉空值
  
  // 去重：使用 Set 去除重复项
  const uniqueItems = Array.from(new Set(convertedItems));
  
  // 排序：按中文拼音排序，确保显示一致性
  const sortedItems = uniqueItems.sort((a, b) => {
    return a.localeCompare(b, 'zh-CN');
  });
  
  return sortedItems.join('、');
}

/**
 * 转换中文到英文ID
 */
export function convertToEnglishIds(items: string | string[], mapData: Record<string, string>): string[] {
  if (!items) return [];
  
  const itemArray = Array.isArray(items) ? items : items.split(/[,、]/);
  
  return itemArray.map(item => {
    const trimmed = item.trim();
    // 如果有对应的英文映射，使用映射
    if (mapData[trimmed]) {
      return mapData[trimmed];
    }
    // 否则返回原值
    return trimmed;
  });
}

/**
 * 格式化时间显示
 */
export function formatDeliveryTime(time: string | undefined): string {
  if (!time) return '未指定';
  if (time === 'ASAP') return '越快越好 (约45分钟)';
  return time;
}

/**
 * 格式化订单状态
 */
export function normalizeStatus(input: any): string {
  const s = (input ?? '').toString().trim().toLowerCase();
  if (!s) return '';
  // 常见同义与拼写容错
  if (s === 'new' || s === 'created' || s === 'open') return 'draft';
  if (s === 'placed' || s === 'awaiting' || s === 'pending') return 'submitted';
  if (s === 'in_progress' || s === 'inprogress') return 'processing';
  if (s === 'in_delivery' || s === 'shipping' || s === 'shipped') return 'delivering';
  if (s === 'done' || s === 'complete') return 'completed';
  if (s === 'canceled') return 'cancelled';
  return s;
}

export function formatOrderStatus(status: string): { text: string; color: string; bgColor?: string } {
  // 新的统一状态系统：只有4种状态
  const statusMap: Record<string, { text: string; color: string; bgColor?: string }> = {
    // 统一状态系统 - 只有4种状态
    'unpaid': { text: '未支付', color: '#6B7280', bgColor: '#F3F4F6' },
    'paid': { text: '已支付', color: '#4169E1', bgColor: '#E0F2FE' },
    'delivering': { text: '配送中', color: '#f59e0b', bgColor: '#FFF3CD' },
    'completed': { text: '完成', color: '#10b981', bgColor: '#D1FAE5' },
    
    // 保留向后兼容的旧状态映射（逐步迁移）
    'draft': { text: '未支付', color: '#6B7280', bgColor: '#F3F4F6' },
    'submitted': { text: '未支付', color: '#6B7280', bgColor: '#F3F4F6' },
    'processing': { text: '已支付', color: '#4169E1', bgColor: '#E0F2FE' },
    'cancelled': { text: '已取消', color: '#DC143C', bgColor: '#FDE2E2' },
  };

  const key = normalizeStatus(status);
  return statusMap[key] || { text: '未知', color: '#999999', bgColor: '#F3F4F6' };
}

/**
 * 规范化订单数据结构
 */
export function normalizeOrderData(order: any): any {
  // 提取嵌套的表单数据
  const formData = order.form_data || order.formData || {};
  
  // 从 metadata 中提取 foodType
  const metadataFoodType = order.metadata?.foodType || [];
  
  // 解析 JSON 字符串字段
  let parsedAllergies = [];
  let parsedPreferences = [];
  
  try {
    if (order.dietaryRestrictions && typeof order.dietaryRestrictions === 'string') {
      parsedAllergies = JSON.parse(order.dietaryRestrictions);
    }
    if (order.foodPreferences && typeof order.foodPreferences === 'string') {
      parsedPreferences = JSON.parse(order.foodPreferences);
    }
  } catch (error) {
    console.warn('解析订单数据时出错:', error);
  }
  
  // 打印原始数据以便调试
  console.log('🔧 规范化订单 - 原始数据:', {
    id: order.id || order._id || order.order_id,
    rawKeys: Object.keys(order),
    backendFields: {
      deliveryAddress: order.deliveryAddress,
      budgetAmount: order.budgetAmount,
      dietaryRestrictions: order.dietaryRestrictions,
      foodPreferences: order.foodPreferences,
      deliveryTime: order.deliveryTime,
      metadata: order.metadata
    },
    parsedData: {
      allergies: parsedAllergies,
      preferences: parsedPreferences,
      foodType: metadataFoodType
    }
  });
  
  const normalizedOrder = {
    id: order.id || order._id || order.order_id,
    orderNumber: order.orderNumber || order.order_number,
    
    // 基本信息 - 映射后端字段到前端期望的字段
    address: order.deliveryAddress || order.address || formData.address || '',
    budget: (order.budgetAmount ? order.budgetAmount.toString() : '') || order.budget || formData.budget || '',
    deliveryTime: order.deliveryTime || order.delivery_time || formData.deliveryTime || formData.delivery_time || '',
    
    // 数组类型数据 - 从后端的 JSON 字符串和 metadata 中解析
    foodType: metadataFoodType || order.foodType || order.food_type || formData.foodType || formData.food_type || formData.selectedFoodType || [],
    allergies: parsedAllergies || order.allergies || formData.allergies || formData.selectedAllergies || [],
    preferences: parsedPreferences || order.preferences || formData.preferences || formData.selectedPreferences || [],
    
    // 到达图片字段
    arrivalImageUrl: order.arrivalImageUrl || order.arrival_image_url,
    arrivalImageTakenAt: order.arrivalImageTakenAt || order.arrival_image_taken_at,
    arrivalImageSource: order.arrivalImageSource || order.arrival_image_source,
    
    // 状态信息（优先使用后端的displayStatus）
    status: order.displayStatus || normalizeStatus(order.status || 'draft'),
    createdAt: order.createdAt || order.created_at || order.created_time || new Date().toISOString(),
    
    // 重要：保留完整的嵌套数据结构
    form_data: formData,
    formData: formData,
    
    // 其他字段
    amount: order.budgetAmount || order.amount || order.order_amount,
    totalAmount: order.budgetAmount || order.totalAmount || order.total_amount,
    isFreeOrder: order.isFreeOrder || order.is_free_order || formData.isFreeOrder,

    // ETA 预计到达时间（从后端 metadata 或直传字段）
    etaEstimatedAt: order.etaEstimatedAt || order.eta_estimated_at || order.metadata?.eta_estimated_at || null,
    etaSource: order.etaSource || order.eta_source || order.metadata?.eta_source || null,
    
    // 额外文本字段
    otherAllergyText: formData.otherAllergyText || formData.other_allergy_text || '',
    otherPreferenceText: formData.otherPreferenceText || formData.other_preference_text || '',
    
    // 保留原始后端字段以便调试
    _backend: {
      deliveryAddress: order.deliveryAddress,
      budgetAmount: order.budgetAmount,
      dietaryRestrictions: order.dietaryRestrictions,
      foodPreferences: order.foodPreferences,
      metadata: order.metadata,
      etaEstimatedAt: order.etaEstimatedAt || order.metadata?.eta_estimated_at || null,
    }
  };
  
  console.log('🔧 规范化订单 - 结果:', {
    id: normalizedOrder.id,
    hasFormData: !!normalizedOrder.form_data,
    formDataKeys: Object.keys(normalizedOrder.form_data || {}),
    budget: normalizedOrder.budget,
    address: normalizedOrder.address,
    deliveryTime: normalizedOrder.deliveryTime,
    foodType: normalizedOrder.foodType,
    allergies: normalizedOrder.allergies,
    preferences: normalizedOrder.preferences,
    mappingSuccessful: !!(normalizedOrder.address && normalizedOrder.budget)
  });
  
  return normalizedOrder;
}
