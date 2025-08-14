import React from 'react';
import { View, Text, Pressable, Animated, Platform } from 'react-native';
import { createButtonStyles } from '../styles/inputStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface ActionButtonProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  isActive?: boolean;
  animationValue?: Animated.Value;
  variant?: 'confirm' | 'next';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  title,
  disabled = false,
  isActive = true,
  animationValue,
  variant = 'confirm'
}) => {
  const { theme } = useTheme();
  const buttonStyles = createButtonStyles(theme);
  const [isHovered, setIsHovered] = React.useState(false);
  const [hoverAnimation] = React.useState(new Animated.Value(0));
  
  // 处理悬停动画
  React.useEffect(() => {
    Animated.timing(hoverAnimation, {
      toValue: isHovered ? 1 : 0,
      duration: 200,
      useNativeDriver: false, // 需要操作背景色，不能使用native driver
    }).start();
  }, [isHovered, hoverAnimation]);

  // 获取动画化的背景色
  const animatedBackgroundColor = hoverAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 1)', 'rgba(251, 146, 60, 1)'], // 白色到桔红色
  });

  // 获取动画化的文字颜色
  const animatedTextColor = hoverAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#374151', '#ffffff'], // 深灰色到白色
  });

  const getButtonStyle = () => {
    if (variant === 'next') {
      return buttonStyles.nextSimpleButton;
    }
    if (disabled) {
      return [buttonStyles.simpleButton, buttonStyles.disabledSimpleButton];
    }
    if (isActive) {
      return [buttonStyles.simpleButton, buttonStyles.activeSimpleButton];
    }
    return buttonStyles.simpleButton;
  };

  const getTextStyle = () => {
    if (variant === 'next') {
      return buttonStyles.nextSimpleButtonText;
    }
    if (disabled) {
      return [buttonStyles.simpleButtonText, buttonStyles.disabledSimpleButtonText];
    }
    if (isActive) {
      return [buttonStyles.simpleButtonText, buttonStyles.activeSimpleButtonText];
    }
    return buttonStyles.simpleButtonText;
  };

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: {
          opacity: animationValue,
          transform: [{
            translateY: animationValue.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        },
      }
    : {};

  return (
    <WrapperComponent {...wrapperProps}>
      <Animated.View
        style={[
          getButtonStyle(),
          {
            backgroundColor: animatedBackgroundColor,
          }
        ]}
      >
        <Pressable
          onPress={onPress}
          disabled={disabled}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          style={[
            {
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 14,
              minWidth: 120,
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: 'transparent', // 背景透明，让外层动画背景显示
            }
          ]}
        >
          <Animated.Text style={[
            getTextStyle(),
            {
              color: animatedTextColor,
            }
          ]}>
            {title}
          </Animated.Text>
        </Pressable>
      </Animated.View>
    </WrapperComponent>
  );
};