import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Platform } from 'react-native';
import { SimpleIcon } from './SimpleIcon';

interface ColorPaletteProps {
  primaryColor: string;
  backgroundColor: string;
  primaryOpacity: number;
  backgroundOpacity: number;
  onPrimaryColorChange: (color: string) => void;
  onBackgroundColorChange: (color: string) => void;
  onPrimaryOpacityChange: (opacity: number) => void;
  onBackgroundOpacityChange: (opacity: number) => void;
  onTextColorsChange?: (primaryText: string, secondaryText?: string, mutedText?: string) => void;
  onAllColorsChange?: (colors: Record<string, string>) => void;
  onClose: () => void;
}

interface OpacitySliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
}

const OpacitySlider: React.FC<OpacitySliderProps> = ({ label, value, onValueChange }) => {
  const [sliderWidth] = useState(150);
  const position = new Animated.Value(value * sliderWidth);
  const [isDragging, setIsDragging] = useState(false);

  // 同步position与value
  useEffect(() => {
    if (!isDragging) {
      const newPosition = value * sliderWidth;
      position.setValue(newPosition);
    }
  }, [value, sliderWidth, isDragging]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      // 使用当前位置加上手势偏移
      const startPosition = value * sliderWidth;
      const newPosition = Math.max(0, Math.min(sliderWidth, startPosition + gestureState.dx));
      position.setValue(newPosition);
      const newValue = newPosition / sliderWidth;
      onValueChange(newValue);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
    },
  });

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}: {Math.round(value * 100)}%</Text>
      <View style={styles.opacitySliderTrack}>
        {/* 透明度背景（棋盘格效果） */}
        <View style={styles.opacityBackground} />
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              backgroundColor: '#666',
              transform: [{ translateX: position }],
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

interface ColorSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  color: 'r' | 'g' | 'b';
}

const ColorSlider: React.FC<ColorSliderProps> = ({ label, value, onValueChange, color }) => {
  const [sliderWidth] = useState(150);
  const position = new Animated.Value((value / 255) * sliderWidth);
  const [isDragging, setIsDragging] = useState(false);

  // 同步position与value
  useEffect(() => {
    if (!isDragging) {
      const newPosition = (value / 255) * sliderWidth;
      position.setValue(newPosition);
    }
  }, [value, sliderWidth, isDragging]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      setIsDragging(true);
    },
    onPanResponderMove: (evt, gestureState) => {
      // 使用当前位置加上手势偏移
      const startPosition = (value / 255) * sliderWidth;
      const newPosition = Math.max(0, Math.min(sliderWidth, startPosition + gestureState.dx));
      position.setValue(newPosition);
      const newValue = Math.round((newPosition / sliderWidth) * 255);
      onValueChange(newValue);
    },
    onPanResponderRelease: () => {
      setIsDragging(false);
    },
    onPanResponderTerminate: () => {
      setIsDragging(false);
    },
  });

  const getSliderColor = () => {
    switch (color) {
      case 'r': return '#ff6b6b';
      case 'g': return '#51cf66';
      case 'b': return '#339af0';
      default: return '#999';
    }
  };

  return (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>{label}: {value}</Text>
      <View style={styles.sliderTrack}>
        <Animated.View
          style={[
            styles.sliderThumb,
            {
              backgroundColor: getSliderColor(),
              transform: [{ translateX: position }],
            },
          ]}
          {...panResponder.panHandlers}
        />
      </View>
    </View>
  );
};

const ColorPalette: React.FC<ColorPaletteProps> = ({
  primaryColor,
  backgroundColor,
  primaryOpacity,
  backgroundOpacity,
  onPrimaryColorChange,
  onBackgroundColorChange,
  onPrimaryOpacityChange,
  onBackgroundOpacityChange,
  onClose,
}) => {
  const [primaryRgb, setPrimaryRgb] = useState(() => {
    const hex = primaryColor.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
    };
  });

  const [backgroundRgb, setBackgroundRgb] = useState(() => {
    const hex = backgroundColor.replace('#', '');
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16),
    };
  });

  const [activeTab, setActiveTab] = useState<'primary' | 'background' | 'text' | 'status' | 'opacity'>('primary');
  
  // 文本颜色状态
  const [textColors, setTextColors] = useState({
    primary: '#444444',
    secondary: '#6b7280', 
    muted: '#9ca3af'
  });
  
  // 状态颜色
  const [statusColors, setStatusColors] = useState({
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#339af0'
  });

  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const updatePrimaryColor = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...primaryRgb, [component]: value };
    setPrimaryRgb(newRgb);
    onPrimaryColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const updateBackgroundColor = (component: 'r' | 'g' | 'b', value: number) => {
    const newRgb = { ...backgroundRgb, [component]: value };
    setBackgroundRgb(newRgb);
    onBackgroundColorChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  };

  const updateTextColor = (type: 'primary' | 'secondary' | 'muted', color: string) => {
    const newTextColors = { ...textColors, [type]: color };
    setTextColors(newTextColors);
    onTextColorsChange?.(newTextColors.primary, newTextColors.secondary, newTextColors.muted);
  };
  
  const updateStatusColor = (type: 'success' | 'error' | 'warning' | 'info', color: string) => {
    const newStatusColors = { ...statusColors, [type]: color };
    setStatusColors(newStatusColors);
    onAllColorsChange?.(newStatusColors);
  };

  const presetThemes = [
    { name: '新色卡主题', primary: '#FF9944', bg: '#FEFCF4', text: '#000000' },
    { name: '金色主题', primary: '#F4D03F', bg: '#CCCCCC', text: '#000000' },
    { name: '原始绿色', primary: '#66CC99', bg: '#F2F2F2', text: '#444444' },
    { name: '红色主题', primary: '#FF6B6B', bg: '#FFE5E5', text: '#8B0000' },
    { name: '青色主题', primary: '#4ECDC4', bg: '#E8F8F7', text: '#2C5530' },
    { name: '蓝色主题', primary: '#45B7D1', bg: '#E8F4FD', text: '#1E3A8A' },
    { name: '薄荷绿', primary: '#96CEB4', bg: '#F0F9F4', text: '#065F46' },
    { name: '黄色主题', primary: '#FFEAA7', bg: '#FFFBF0', text: '#92400E' },
    { name: '紫色主题', primary: '#DDA0DD', bg: '#F8F0F8', text: '#581C87' },
    { name: '橙色主题', primary: '#FFA07A', bg: '#FFF4F0', text: '#C2410C' },
    { name: '深色模式', primary: '#10b981', bg: '#1f2937', text: '#f9fafb' },
    { name: '高对比度', primary: '#000000', bg: '#ffffff', text: '#000000' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>调色板</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <SimpleIcon name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'primary' && styles.activeTab]}
          onPress={() => setActiveTab('primary')}
        >
          <Text style={[styles.tabText, activeTab === 'primary' && styles.activeTabText]}>主色</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'background' && styles.activeTab]}
          onPress={() => setActiveTab('background')}
        >
          <Text style={[styles.tabText, activeTab === 'background' && styles.activeTabText]}>背景</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'text' && styles.activeTab]}
          onPress={() => setActiveTab('text')}
        >
          <Text style={[styles.tabText, activeTab === 'text' && styles.activeTabText]}>文本</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'status' && styles.activeTab]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabText, activeTab === 'status' && styles.activeTabText]}>状态</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'opacity' && styles.activeTab]}
          onPress={() => setActiveTab('opacity')}
        >
          <Text style={[styles.tabText, activeTab === 'opacity' && styles.activeTabText]}>透明</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.colorPreview}>
        <View style={styles.colorSwatchContainer}>
          {activeTab === 'text' ? (
            <View style={styles.textPreview}>
              <View style={[styles.textSwatch, { backgroundColor: textColors.primary }]} />
              <View style={[styles.textSwatch, { backgroundColor: textColors.secondary }]} />
              <View style={[styles.textSwatch, { backgroundColor: textColors.muted }]} />
            </View>
          ) : activeTab === 'status' ? (
            <View style={styles.statusPreview}>
              <View style={[styles.statusSwatch, { backgroundColor: statusColors.success }]} />
              <View style={[styles.statusSwatch, { backgroundColor: statusColors.error }]} />
              <View style={[styles.statusSwatch, { backgroundColor: statusColors.warning }]} />
              <View style={[styles.statusSwatch, { backgroundColor: statusColors.info }]} />
            </View>
          ) : (
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: activeTab === 'primary' ? primaryColor : backgroundColor },
              ]}
            />
          )}
        </View>
        <Text style={styles.colorCode}>
          {activeTab === 'opacity' 
            ? `透明度: 主色 ${Math.round(primaryOpacity * 100)}% | 背景 ${Math.round(backgroundOpacity * 100)}%`
            : activeTab === 'text'
            ? `文本颜色: 主要 ${textColors.primary} 次要 ${textColors.secondary}`
            : activeTab === 'status'
            ? '状态颜色: 成功 错误 警告 信息'
            : (activeTab === 'primary' ? primaryColor : backgroundColor)
          }
        </Text>
      </View>

      <View style={styles.slidersContainer}>
        {activeTab === 'primary' ? (
          <>
            <ColorSlider label="红" value={primaryRgb.r} onValueChange={(value) => updatePrimaryColor('r', value)} color="r" />
            <ColorSlider label="绿" value={primaryRgb.g} onValueChange={(value) => updatePrimaryColor('g', value)} color="g" />
            <ColorSlider label="蓝" value={primaryRgb.b} onValueChange={(value) => updatePrimaryColor('b', value)} color="b" />
          </>
        ) : activeTab === 'background' ? (
          <>
            <ColorSlider label="红" value={backgroundRgb.r} onValueChange={(value) => updateBackgroundColor('r', value)} color="r" />
            <ColorSlider label="绿" value={backgroundRgb.g} onValueChange={(value) => updateBackgroundColor('g', value)} color="g" />
            <ColorSlider label="蓝" value={backgroundRgb.b} onValueChange={(value) => updateBackgroundColor('b', value)} color="b" />
          </>
        ) : activeTab === 'text' ? (
          <View style={styles.colorPickerContainer}>
            <Text style={styles.sectionTitle}>文本颜色设置</Text>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>主要文本</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: textColors.primary }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>次要文本</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: textColors.secondary }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>静默文本</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: textColors.muted }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
          </View>
        ) : activeTab === 'status' ? (
          <View style={styles.colorPickerContainer}>
            <Text style={styles.sectionTitle}>状态颜色设置</Text>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>成功 ✓</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: statusColors.success }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>错误 ✗</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: statusColors.error }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>警告 ⚠</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: statusColors.warning }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
            <View style={styles.colorOption}>
              <Text style={styles.colorLabel}>信息 ℹ</Text>
              <TouchableOpacity 
                style={[styles.colorButton, { backgroundColor: statusColors.info }]}
                onPress={() => {/* TODO: 颜色选择器 */}}
              />
            </View>
          </View>
        ) : (
          <>
            <OpacitySlider label="主色调透明度" value={primaryOpacity} onValueChange={onPrimaryOpacityChange} />
            <OpacitySlider label="背景色透明度" value={backgroundOpacity} onValueChange={onBackgroundOpacityChange} />
          </>
        )}
      </View>

      <Text style={styles.presetsTitle}>预设主题</Text>
      <View style={styles.presetsContainer}>
        {presetThemes.map((theme, index) => (
          <TouchableOpacity
            key={index}
            style={styles.themePreset}
            onPress={() => {
              onPrimaryColorChange(theme.primary);
              onBackgroundColorChange(theme.bg);
              onTextColorsChange?.(theme.text, theme.text, theme.text);
            }}
          >
            <View style={styles.themeColors}>
              <View style={[styles.themeColorSwatch, { backgroundColor: theme.primary }]} />
              <View style={[styles.themeColorSwatch, { backgroundColor: theme.bg }]} />
              <View style={[styles.themeColorSwatch, { backgroundColor: theme.text }]} />
            </View>
            <Text style={styles.themeName}>{theme.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 320,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: '500',
  },
  colorPreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  colorCode: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  slidersContainer: {
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    position: 'relative',
  },
  opacitySliderTrack: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  opacityBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // 棋盘格背景效果
    backgroundColor: '#fff',
    backgroundImage: Platform.OS === 'web' ? `
      linear-gradient(45deg, #ddd 25%, transparent 25%),
      linear-gradient(-45deg, #ddd 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #ddd 75%),
      linear-gradient(-45deg, transparent 75%, #ddd 75%)
    ` : undefined,
    backgroundSize: Platform.OS === 'web' ? '8px 8px' : undefined,
    // Remove invalid backgroundPosition for React Native Web compatibility
    ...(Platform.OS === 'web' && {
      // Use a single background position instead of multiple values
      backgroundPosition: '0px 0px',
    }),
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  // 新增样式
  colorSwatchContainer: {
    alignItems: 'center',
  },
  textPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  textSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusPreview: {
    flexDirection: 'row',
    gap: 8,
  },
  statusSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorPickerContainer: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  colorOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  colorLabel: {
    fontSize: 14,
    color: '#666',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  themePreset: {
    width: '48%',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  themeColors: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  themeColorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  themeName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
});

export default ColorPalette;