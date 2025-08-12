// 忌口选项配置
export const ALLERGY_OPTIONS = [
  {
    id: 'seafood',
    label: '海鲜类',
    image: require('../../assets/allergies/海鲜类.png'),
  },
  {
    id: 'nuts',
    label: '坚果类', 
    image: require('../../assets/allergies/坚果类.png'),
  },
  {
    id: 'eggs',
    label: '蛋类',
    image: require('../../assets/allergies/蛋类.png'),
  },
  {
    id: 'soy',
    label: '大豆类',
    image: require('../../assets/allergies/大豆类.png'),
  },
  {
    id: 'dairy',
    label: '乳制品类',
    image: require('../../assets/allergies/乳制品类.png'),
  },
  {
    id: 'other-allergy',
    label: '其他',
    image: require('../../assets/food/其他.png'),
  },
  
];

// 偏好选项配置
export const PREFERENCE_OPTIONS = [
  {
    id: 'spicy',
    label: '香辣',
    image: require('../../assets/preferences/香辣.png'),
  },
  {
    id: 'mild',
    label: '清淡',
    image: require('../../assets/preferences/清淡.png'),
  },
  {
    id: 'sweet',
    label: '甜口',
    image: require('../../assets/preferences/甜口.png'),
  },
  {
    id: 'sour-spicy',
    label: '酸辣',
    image: require('../../assets/preferences/酸辣.png'),
  },
  {
    id: 'salty',
    label: '咸鲜',
    image: require('../../assets/preferences/咸鲜.png'),
  },
  {
    id: 'other-preference',
    label: '其他',
    image: require('../../assets/food/其他.png'),
  },
];

// 食物类型选项配置
export const FOOD_TYPE_OPTIONS = [
  {
    id: 'meal',
    label: '吃饭',
    image: require('../../assets/food/美食.png'),
  },
  {
    id: 'drink',
    label: '喝奶茶',
    image: require('../../assets/food/饮品.png'),
  },
];

// 英文值到中文显示的映射
export const VALUE_MAPPING: Record<string, string> = {
  // 忌口映射
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

// 将英文值数组转换为中文显示的函数
export const convertToChineseDisplay = (values: string | string[]): string => {
  if (!values) return '';
  
  if (Array.isArray(values)) {
    if (values.length === 0) return '';
    return values.map(value => VALUE_MAPPING[value] || value).join('、');
  }
  
  // 如果是单个值，检查是否为逗号分隔的字符串
  if (typeof values === 'string') {
    if (values.includes(',')) {
      const valuesArray = values.split(',').map(v => v.trim());
      return valuesArray.map(value => VALUE_MAPPING[value] || value).join('、');
    }
    return VALUE_MAPPING[values] || values;
  }
  
  return String(values);
};