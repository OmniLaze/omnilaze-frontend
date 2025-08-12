import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated, TextInput, Dimensions, Pressable, Platform, Vibration } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { StyleSheet } from 'react-native';
import { COLORS } from '../constants';
import { useTheme } from '../contexts/ColorThemeContext';

const { width } = Dimensions.get('window');

interface ImageCheckboxOption {
  id: string;
  label: string;
  image: any; // 图片资源
}

interface ImageCheckboxProps {
  options: ImageCheckboxOption[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  animationValue?: Animated.Value;
  singleSelect?: boolean; // 新增：是否单选模式
  onOtherTextChange?: (text: string) => void; // 新增：其他输入框文本变化回调
  disabled?: boolean; // 新增：是否禁用选择
}

export const ImageCheckbox: React.FC<ImageCheckboxProps> = ({
  options,
  selectedIds,
  onSelectionChange,
  animationValue,
  singleSelect = false, // 默认多选
  onOtherTextChange,
  disabled = false, // 默认不禁用
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const [shouldRender, setShouldRender] = useState(true); // 修改：默认为true，确保组件能够正常渲染
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInputAnimation] = useState(new Animated.Value(0)); // 使用useState保持动画实例
  const [hoveredId, setHoveredId] = useState<string | null>(null); // Web 悬停态
  const [pressedId, setPressedId] = useState<string | null>(null); // 按下反馈

  const triggerHaptic = () => {
    try {
      if (Platform.OS === 'web') {
        (navigator as any)?.vibrate?.(10);
      } else {
        Vibration.vibrate?.(10);
      }
    } catch (_) {}
  };
  
  // 为每个选项创建独立的动画值
  const cardAnimations = useRef<Animated.Value[]>([]);
  
  // 初始化每个卡片的动画值
  useEffect(() => {
    cardAnimations.current = options.map(() => new Animated.Value(0));
  }, [options.length]);
  
  // 触发错开动画
  useEffect(() => {
    if (animationValue && cardAnimations.current.length > 0) {
      const listener = animationValue.addListener(({ value }) => {
        if (value > 0.5) { // 当主动画进行到一半时开始卡片动画
          startStaggeredAnimation();
          animationValue.removeListener(listener); // 只触发一次
        }
        setShouldRender(value > 0 || selectedIds.length > 0);
      });

      return () => {
        animationValue.removeListener(listener);
      };
    } else if (!animationValue && cardAnimations.current.length > 0) {
      // 如果没有主动画，延迟一点开始卡片动画，让组件先渲染
      const timer = setTimeout(() => {
        startStaggeredAnimation();
      }, 100);
      setShouldRender(true);
      
      return () => clearTimeout(timer);
    }
  }, [animationValue, selectedIds.length, options.length]);
  
  const startStaggeredAnimation = () => {
    if (cardAnimations.current.length === 0) return;
    
    const animations = cardAnimations.current.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: index * 80, // 每个卡片延迟120ms
        useNativeDriver: false,
      });
    });
    
    Animated.stagger(120, animations).start();
  };

  useEffect(() => {
    // 检查是否已经选中了"其他"选项，如果是则显示输入框
    const hasOtherSelected = selectedIds.some(id => id.includes('other'));
    if (hasOtherSelected && !showOtherInput) {
      setShowOtherInput(true);
      otherInputAnimation.setValue(1);
    } else if (!hasOtherSelected && showOtherInput) {
      hideOtherInput();
    }
  }, [selectedIds]);

  const toggleOption = (optionId: string) => {
    // 如果组件被禁用，不允许切换选择
    if (disabled) return;
    
    const isSelected = selectedIds.includes(optionId);
    const isOtherOption = optionId.includes('other');
    let newSelection: string[];
    
    if (singleSelect) {
      // 单选模式
      if (isSelected) {
        // 在单选模式下，如果点击已选择的项目，保持选择状态
        // 这样确保始终有一个选项被选中
        newSelection = selectedIds;
      } else {
        // 选择当前项，取消其他选择
        newSelection = [optionId];
        // 如果选择了其他选项，显示输入框
        if (isOtherOption) {
          showOtherInputAnimated();
        } else {
          // 如果选择了非其他选项，隐藏输入框
          hideOtherInput();
        }
      }
    } else {
      // 多选模式（原逻辑）
      if (isSelected) {
        // 取消选择
        newSelection = selectedIds.filter(id => id !== optionId);
        // 如果取消选择的是其他选项，隐藏输入框
        if (isOtherOption) {
          hideOtherInput();
        }
      } else {
        // 添加选择
        newSelection = [...selectedIds, optionId];
        // 如果选择了其他选项，显示输入框
        if (isOtherOption) {
          showOtherInputAnimated();
        }
      }
    }
    
    onSelectionChange(newSelection);
  };

  const showOtherInputAnimated = () => {
    setShowOtherInput(true);
    Animated.spring(otherInputAnimation, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  const hideOtherInput = () => {
    Animated.spring(otherInputAnimation, {
      toValue: 0,
      tension: 80,
      friction: 8,
      useNativeDriver: false,
    }).start(() => {
      setShowOtherInput(false);
      setOtherText('');
      if (onOtherTextChange) {
        onOtherTextChange('');
      }
    });
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (onOtherTextChange) {
      onOtherTextChange(text);
    }
  };

  // 如果不应该渲染，返回null
  if (!shouldRender) {
    return null;
  }

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
          styles.container,
          {
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ],
      }
    : { style: styles.container };

  return (
    <WrapperComponent {...wrapperProps}>
      <View style={styles.grid}>
        {options.map((option, index) => {
          const isSelected = selectedIds.includes(option.id);
          const cardAnimation = cardAnimations.current[index] || new Animated.Value(0);
          
          return (
            <Animated.View
              key={option.id}
              style={[
                {
                  width: width > 768 ? '31%' : '100%',
                  aspectRatio: width > 768 ? 0.66 : undefined,
                  height: width > 768 ? undefined : 68,
                },
                {
                  opacity: cardAnimation,
                  transform: [{
                    translateY: cardAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0], // 从下方向上移动
                    }),
                  }],
                }
              ]}
            >
              <Pressable
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedCard,
                  disabled && styles.disabledCard,
                  (Platform.OS === 'web' && hoveredId === option.id) && styles.optionCardHover,
                  (pressedId === option.id) && styles.optionCardPressed,
                  { width: '100%', height: '100%' } // 填满父容器
                ]}
                onPress={() => toggleOption(option.id)}
                disabled={disabled}
                onHoverIn={() => setHoveredId(option.id)}
                onHoverOut={() => setHoveredId(null)}
                onPressIn={() => { setPressedId(option.id); triggerHaptic(); }}
                onPressOut={() => setPressedId(null)}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={option.image} 
                    style={styles.optionImage}
                    resizeMode="contain"
                  />
                </View>
              
              {/* 文本标签容器 - Safari 兼容性 */}
              <View style={styles.labelContainer}>
                <Text 
                  style={[
                    styles.optionLabel,
                    isSelected && styles.selectedLabel
                  ]}
                  numberOfLines={2}
                  // 移除 adjustsFontSizeToFit 以避免 Safari 兼容性问题
                  // adjustsFontSizeToFit={true}
                  // minimumFontScale={0.8}
                >
                  {option.label}
                </Text>
              </View>
              
              <View style={[
                styles.checkbox,
                (pressedId === option.id) && styles.checkboxPressed,
                isSelected && styles.checkedBox
              ]}>
                {isSelected && (
                  <SimpleIcon 
                    name="check" 
                    size={width > 768 ? 18 : 14} 
                    color={COLORS.WHITE} 
                  />
                )}
              </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      
      {/* 其他输入框 */}
      {showOtherInput && (
        <Animated.View
          style={[
            styles.otherInputContainer,
            {
              opacity: otherInputAnimation,
              transform: [{
                translateY: otherInputAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <TextInput
            style={styles.otherInput}
            placeholder="请描述具体内容..."
            value={otherText}
            onChangeText={handleOtherTextChange}
            autoFocus={true}
            multiline={false}
            returnKeyType="done"
          />
        </Animated.View>
      )}
    </WrapperComponent>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: width > 768 ? 16 : 8, // 移动端减少顶部间距
    marginLeft: 0, // 移除左边距，因为现在头像独立放置
    maxWidth: 500,
  },
  grid: {
    flexDirection: width > 768 ? 'row' : 'column',
    flexWrap: width > 768 ? 'wrap' : 'nowrap',
    gap: width > 768 ? 8 : 4,
    justifyContent: width > 768 ? 'center' : 'flex-start',
  },
  optionCard: {
    backgroundColor: theme.WHITE,
    borderRadius: width > 768 ? 12 : 8,
    borderWidth: 1.8,
    borderColor: '#EEEAE7', // 与示例图接近的浅灰边框
    // 保持左右边框一致宽度，避免视觉不对称
    padding: width > 768 ? 12 : 12,
    alignItems: 'center',
    justifyContent: width > 768 ? 'space-between' : 'flex-start',
    flexDirection: width > 768 ? 'column' : 'row',
    position: 'relative',
    elevation: 2,
  },
  optionCardHover: Platform.select({
    web: {
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    },
    default: {}
  }) as any,
  optionCardPressed: Platform.select({
    web: {
      borderColor: '#D1D5DB',
      backgroundColor: '#F3F4F6',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transform: [{ translateY: 1 }],
    },
    default: {
      transform: [{ scale: 0.98 }],
    }
  }) as any,
  selectedCard: {
    borderColor: theme.PRIMARY,
  },
  imageContainer: {
    width: width > 768 ? 160 : 80, // 移动端放大图片容器
    height: width > 768 ? 160 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    flex: width > 768 ? 1 : 0,
    marginRight: width > 768 ? 0 : 55, // 增加右边距
    marginLeft: width > 768 ? 0 : 50, // 增加左边距
  },
  optionImage: {
    width: width > 768 ? 144 : 75, // 移动端放大图片，从32增加到40
    height: width > 768 ? 144 : 75,
  },
  labelContainer: {
    // Safari 兼容性容器
    flex: width > 768 ? 0 : 1,
    minHeight: width > 768 ? 25 : 20,
    justifyContent: 'center',
    alignItems: width > 768 ? 'center' : 'flex-start',
    marginRight: width > 768 ? 0 : 12,
    marginVertical: width > 768 ? 8 : 0,
    marginBottom: width > 768 ? 16 : 0,
  },
  optionLabel: {
    fontSize: width > 768 ? 21 : 16,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    textAlign: width > 768 ? 'center' : 'left',
    // Safari 兼容性修复
    lineHeight: width > 768 ? 25 : 20,
    // 移除可能导致 Safari 问题的样式
    // flex: width > 768 ? 0 : 1,
    // marginRight: width > 768 ? 0 : 12,
    // marginVertical: width > 768 ? 8 : 0,
    // marginBottom: width > 768 ? 16 : 0,
    // display: 'flex',
    // alignItems: width > 768 ? 'center' : 'flex-start',
    // justifyContent: width > 768 ? 'center' : 'flex-start',
  },
  selectedLabel: {
    color: theme.PRIMARY,
    fontWeight: '600',
  },
  checkbox: {
    width: width > 768 ? 22 : 18,
    height: width > 768 ? 22 : 18,
    borderRadius: 4,
    borderWidth: 2.5,
    borderColor: '#EEEAE7', // 与卡片边框保持一致
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.WHITE,
    position: width > 768 ? 'static' : 'absolute',
    right: width > 768 ? 'auto' : 12,
  },
  checkedBox: {
    backgroundColor: theme.PRIMARY,
    borderColor: theme.PRIMARY,
  },
  checkboxPressed: Platform.select({
    web: {
      borderColor: '#D1D5DB',
      backgroundColor: '#F3F4F6',
    },
    default: {
      borderColor: '#D1D5DB',
      backgroundColor: '#F3F4F6',
    }
  }) as any,
  disabledCard: {
    opacity: 0.8,
    backgroundColor: '#f8f9fa',
  },
  otherInputContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: width > 768 ? 0 : 8, // 移动端添加左右内边距
  },
  otherInput: {
    borderWidth: 1,
    borderColor: theme.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: width > 768 ? 12 : 10, // 移动端调整内边距
    fontSize: width > 768 ? 16 : 14, // 移动端调整字体大小
    backgroundColor: theme.WHITE,
    color: theme.TEXT_PRIMARY,
    elevation: 2,
    minHeight: width > 768 ? 44 : 40, // 设置最小高度便于点击
  },
});