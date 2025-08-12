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
};

export const SimpleIcon: React.FC<SimpleIconProps> = ({ 
  name, 
  size = 20, 
  color = '#000', 
  style 
}) => {
  const iconName = iconNameMap[name] || 'help-circle-outline';
  return (
    <Ionicons name={iconName} size={size} color={color} style={style} />
  );
};