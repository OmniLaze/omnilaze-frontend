import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Text, Dimensions, Platform, Animated } from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';

const { width } = Dimensions.get('window');
const isMobile = width <= 768;

interface VerificationCodeInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: () => void;
  errorMessage?: string;
  animationValue?: any;
  visible?: boolean; // 控制是否显示
  onComplete?: (code: string) => void; // 输入完成回调
  isVerificationSuccess?: boolean; // 验证是否成功
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  value,
  onChangeText,
  onSubmitEditing,
  errorMessage,
  animationValue,
  visible = true,
  onComplete,
  isVerificationSuccess = false,
}) => {
  const { theme } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  // 直接初始化动画值，避免useRef延迟初始化问题
  const animationValues = useRef<Animated.Value[]>(
    Array.from({ length: 6 }, () => new Animated.Value(0))
  );

  // 控制逐个显示动画
  useEffect(() => {
    if (visible) {
      // 逐个显示输入框
      const animations = animationValues.current.map((anim, index) => 
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          delay: index * 100, // 每个框延迟100ms
          useNativeDriver: true,
        })
      );
      
      Animated.stagger(100, animations).start(() => {
        // 动画完成后自动聚焦第一个输入框
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      });
    } else {
      // 如果不可见，重置动画值
      animationValues.current.forEach(anim => anim.setValue(0));
    }
  }, [visible]);
  
  // 将输入值分割成数组，确保长度为6
  const codeArray = value.padEnd(6, ' ').split('').slice(0, 6);

  const handleTextChange = (text: string, index: number) => {
    // 只允许数字输入
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // 如果粘贴了多个字符，分配到各个输入框
      const newCode = value.split('');
      const remainingChars = numericText.slice(0, 6 - index);
      
      for (let i = 0; i < remainingChars.length && index + i < 6; i++) {
        newCode[index + i] = remainingChars[i];
      }
      
      const newValue = newCode.join('').slice(0, 6);
      onChangeText(newValue);
      
      // 焦点移动到下一个空的输入框或最后一个
      const nextIndex = Math.min(index + remainingChars.length, 5);
      setTimeout(() => {
        inputRefs.current[nextIndex]?.focus();
        // 检查是否完成输入
        if (newValue.length === 6) {
          onComplete?.(newValue);
        }
      }, 50);
    } else if (numericText.length === 1) {
      // 单个字符输入
      const newCode = value.split('');
      newCode[index] = numericText;
      const newValue = newCode.join('').slice(0, 6);
      onChangeText(newValue);
      
      // 自动跳转到下一个输入框
      if (index < 5) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 50);
      } else {
        // 最后一个输入框，检查是否完成
        setTimeout(() => {
          if (newValue.length === 6) {
            onComplete?.(newValue);
          }
        }, 100);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!codeArray[index] || codeArray[index] === ' ') {
        // 当前框为空，删除前一个框的内容并跳转
        if (index > 0) {
          const newCode = value.split('');
          newCode[index - 1] = '';
          onChangeText(newCode.join(''));
          setTimeout(() => {
            inputRefs.current[index - 1]?.focus();
          }, 50);
        }
      } else {
        // 删除当前框内容
        const newCode = value.split('');
        newCode[index] = '';
        onChangeText(newCode.join(''));
      }
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  useEffect(() => {
    // 当组件挂载时，自动聚焦第一个输入框
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 20,
      paddingHorizontal: isMobile ? 4 : 8,
    },
    inputBox: {
      width: isMobile ? 42 : 52,
      height: isMobile ? 42 : 52,
      borderWidth: 0,
      borderRadius: 12, // 与BaseInput保持一致
      textAlign: 'center',
      fontSize: isMobile ? 20 : 24,
      fontWeight: '600',
      color: theme.TEXT_PRIMARY,
      backgroundColor: theme.WHITE,
      // 与BaseInput相同的阴影效果
      shadowColor: theme.SHADOW,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
      ...Platform.select({
        web: {
          outlineStyle: 'none',
          outlineWidth: 0,
        },
      }),
    },
    inputFocused: {
      // 聚焦时保持原样，不改变颜色
      backgroundColor: theme.WHITE,
    },
    inputFilled: {
      // 填充时保持原样，不改变颜色
      backgroundColor: theme.WHITE,
    },
    inputSuccess: {
      // 只有验证成功时才显示主题色
      backgroundColor: theme.WHITE,
      shadowColor: theme.PRIMARY,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 2,
      borderColor: theme.PRIMARY,
    },
    inputEmpty: {
      backgroundColor: theme.WHITE,
    },
    inputError: {
      backgroundColor: theme.ERROR_BACKGROUND,
      shadowColor: theme.ERROR,
      shadowOffset: {
        width: 0,
        height: 0,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    errorText: {
      color: theme.ERROR,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <View>
      <View style={styles.container}>
        {codeArray.map((digit, index) => {
          const isFocused = focusedIndex === index;
          const isFilled = digit && digit !== ' ';
          const hasError = !!errorMessage;
          
          let inputStyle = [styles.inputBox];
          
          if (hasError) {
            inputStyle.push(styles.inputError);
          } else if (isVerificationSuccess && value.length === 6) {
            // 只有验证成功且全部填完才显示主题色
            inputStyle.push(styles.inputSuccess);
          } else if (isFocused) {
            inputStyle.push(styles.inputFocused);
          } else if (isFilled) {
            inputStyle.push(styles.inputFilled);
          } else {
            inputStyle.push(styles.inputEmpty);
          }

          const animValue = animationValues.current[index];
          
          return (
            <Animated.View 
              key={index} 
              style={{ 
                marginHorizontal: isMobile ? 4 : 6,
                opacity: animValue || 1,
                transform: animValue ? [{
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }, {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }] : [],
              }}
            >
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={inputStyle}
                value={isFilled ? digit : ''}
                onChangeText={(text) => handleTextChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={handleBlur}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
              />
            </Animated.View>
          );
        })}
      </View>
      {errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
};