/**
 * 数据映射工具 - 统一处理订单数据的中英文转换
 * 注意：订单数据结构转换已移动到 orderTransformer.ts
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
  // 统一状态系统 - 只有4种状态
  const statusMap: Record<string, { text: string; color: string; bgColor?: string }> = {
    'unpaid': { text: '未支付', color: '#6B7280', bgColor: '#F3F4F6' },
    'paid': { text: '已支付', color: '#4169E1', bgColor: '#E0F2FE' },
    'delivering': { text: '配送中', color: '#f59e0b', bgColor: '#FFF3CD' },
    'completed': { text: '完成', color: '#10b981', bgColor: '#D1FAE5' },
  };

  const key = normalizeStatus(status);
  return statusMap[key] || { text: '未知', color: '#999999', bgColor: '#F3F4F6' };
}
