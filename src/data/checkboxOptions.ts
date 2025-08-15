// 忌口选项配置
export const ALLERGY_OPTIONS = [
  {
    id: 'seafood',
    label: '海鲜类',
    image: require('../../assets/allergies/seafood-bf.png'),
  },
  {
    id: 'nuts',
    label: '坚果类', 
    image: require('../../assets/allergies/nuts-bf.png'),
  },
  {
    id: 'eggs',
    label: '蛋类',
    image: require('../../assets/allergies/eggs-bf.png'),
  },
  {
    id: 'soy',
    label: '大豆类',
    image: require('../../assets/allergies/beans-bf.png'),
  },
  {
    id: 'dairy',
    label: '乳制品类',
    image: require('../../assets/allergies/dairy-bf.png'),
  },
  {
    id: 'other-allergy',
    label: '其他',
    image: require('../../assets/food/other-bf.png'),
  },
  
];

// 偏好选项配置
export const PREFERENCE_OPTIONS = [
  {
    id: 'spicy',
    label: '香辣',
    image: require('../../assets/preferences/spicy-flavor-bf.png'),
  },
  {
    id: 'mild',
    label: '清淡',
    image: require('../../assets/preferences/light-flavor-bf.png'),
  },
  {
    id: 'sweet',
    label: '甜口',
    image: require('../../assets/preferences/sweet-flavor-bf.png'),
  },
  {
    id: 'sour-spicy',
    label: '酸辣',
    image: require('../../assets/preferences/sour-spicy-flavor-bf.png'),
  },
  {
    id: 'salty',
    label: '咸鲜',
    image: require('../../assets/preferences/salty-fresh-flavor-bf.png'),
  },
  {
    id: 'other-preference',
    label: '其他',
    image: require('../../assets/food/other-bf.png'),
  },
];

// 食物类型选项配置
export const FOOD_TYPE_OPTIONS = [
  {
    id: 'meal',
    label: '吃饭',
    image: require('../../assets/food/rice-bf.png'),
  },
  {
    id: 'drink',
    label: '喝奶茶',
    image: require('../../assets/food/milk-tea-bf.png'),
  },
];

// 英文值到中文显示的映射 - 保持原有的选项
export const VALUE_MAPPING: Record<string, string> = {
  // 忌口映射 - 只包含原有的选项
  'seafood': '海鲜类',
  'nuts': '坚果类',
  'eggs': '蛋类',
  'soy': '大豆类',
  'dairy': '乳制品类',
  'other-allergy': '其他',
  
  // 偏好映射
  'spicy': '香辣',
  'mild': '清淡',
  'sweet': '甜口',
  'sour-spicy': '酸辣',
  'salty': '咸鲜',
  'other-preference': '其他',
  
  // 食物类型映射
  'meal': '吃饭',
  'drink': '喝奶茶',
};

// 将英文值数组转换为中文显示的函数 - 支持去重和排序
export const convertToChineseDisplay = (values: string | string[]): string => {
  if (!values) return '';
  
  let valueArray: string[] = [];
  
  if (Array.isArray(values)) {
    if (values.length === 0) return '';
    valueArray = values;
  } else if (typeof values === 'string') {
    // 如果是单个值，检查是否为逗号分隔的字符串
    if (values.includes(',')) {
      valueArray = values.split(',').map(v => v.trim());
    } else {
      valueArray = [values];
    }
  } else {
    return String(values);
  }
  
  // 转换并收集结果
  const convertedValues = valueArray.map(value => {
    return VALUE_MAPPING[value] || value;
  }).filter(Boolean); // 过滤掉空值
  
  // 去重：使用 Set 去除重复项
  const uniqueValues = Array.from(new Set(convertedValues));
  
  // 排序：按中文拼音排序，确保显示一致性
  const sortedValues = uniqueValues.sort((a, b) => {
    return a.localeCompare(b, 'zh-CN');
  });
  
  return sortedValues.join('、');
};