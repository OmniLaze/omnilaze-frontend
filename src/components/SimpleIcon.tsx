import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface SimpleIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const iconNameMap: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  // Existing mappings
  'location-on': 'location-sharp',
  'phone': 'call',
  'check': 'checkmark',
  'close': 'close',
  'edit': 'pencil',
  'sms': 'chatbubble',
  
  // Additional names used across the app
  'gift': 'gift',
  'info': 'information-circle',
  'exit': 'log-out-outline',
  'person': 'person',
  'copy': 'copy',
  'language': 'language',
  'chat': 'chatbubbles',
  
  // Order detail page icons - using verified Ionicons names
  'receipt': 'receipt-outline',          // 发票/收据
  'clock': 'time-outline',               // 时钟
  'dollar-sign': 'cash-outline',         // 金钱/预算
  'map-pin': 'location-outline',         // 地图位置
  'truck': 'car-outline',                // 配送车辆
  'camera': 'camera-outline',            // 相机
  'coffee': 'cafe-outline',              // 咖啡/食物
  'x-circle': 'close-circle-outline',    // 关闭圆圈/忌口
  'heart': 'heart-outline',              // 心形/口味偏好
  'arrow-left': 'arrow-back-outline',    // 返回箭头
  'chevron-up': 'chevron-up-outline',    // 上箭头
  'chevron-down': 'chevron-down-outline', // 下箭头
};

export const SimpleIcon: React.FC<SimpleIconProps> = ({ 
  name, 
  size = 20, 
  color = '#000', 
  style 
}) => {
  const iconName = iconNameMap[name];
  
  // 调试信息 - 生产环境可以移除
  if (process.env.NODE_ENV === 'development' && !iconName) {
    console.warn(`SimpleIcon: Unknown icon name "${name}". Using fallback.`);
  }
  
  const finalIconName = iconName || 'help-circle-outline';
  
  return (
    <Ionicons name={finalIconName} size={size} color={color} style={style} />
  );
};