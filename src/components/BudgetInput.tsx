import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { BaseInput } from './BaseInput';
import { createBudgetStyles } from '../styles/inputStyles';
import { useTheme } from '../contexts/ColorThemeContext';
import { BUDGET_OPTIONS } from '../constants';

interface BudgetInputProps {
  value: string;
  onChangeText: (text: string) => void;
  animationValue?: Animated.Value;
  onSubmitEditing?: () => void;
  errorMessage?: string;
  budgetOptions?: readonly string[]; // 新增：自定义预算选项
}

export const BudgetInput: React.FC<BudgetInputProps> = ({
  value,
  onChangeText,
  animationValue,
  onSubmitEditing,
  errorMessage,
  budgetOptions = BUDGET_OPTIONS, // 默认使用标准预算选项
}) => {
  const { theme } = useTheme();
  const budgetStyles = createBudgetStyles(theme);
  
  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
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
    : {};

  return (
    <WrapperComponent {...wrapperProps}>
      {(animationValue ? (
        <Animated.View
          style={{
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({ inputRange: [0, 1], outputRange: [18, 0] })
            }]
          }}
        >
          <View style={budgetStyles.budgetOptionsContainer}>
            {budgetOptions.map((amount) => (
              <TouchableOpacity
                key={amount}
                onPress={() => onChangeText(amount)}
                style={[
                  budgetStyles.budgetOptionButton,
                  value === amount && budgetStyles.selectedBudgetOptionButton
                ]}
              >
                <Text style={[
                  budgetStyles.budgetOptionText,
                  value === amount && budgetStyles.selectedBudgetOptionText
                ]}>
                  ¥{amount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      ) : (
        <View style={budgetStyles.budgetOptionsContainer}>
          {budgetOptions.map((amount) => (
            <TouchableOpacity
              key={amount}
              onPress={() => onChangeText(amount)}
              style={[
                budgetStyles.budgetOptionButton,
                value === amount && budgetStyles.selectedBudgetOptionButton
              ]}
            >
              <Text style={[
                budgetStyles.budgetOptionText,
                value === amount && budgetStyles.selectedBudgetOptionText
              ]}>
                ¥{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      {/* 让底部自定义金额输入稍后一点淡入，形成错开感 */}
      {animationValue ? (
        <Animated.View
          style={{
            opacity: animationValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }),
            transform: [{
              translateY: animationValue.interpolate({ inputRange: [0, 0.6, 1], outputRange: [16, 8, 0] })
            }]
          }}
        >
          <BaseInput
            value={value}
            onChangeText={onChangeText}
            placeholder="或输入自定义金额"
            iconName="attach-money"
            keyboardType="numeric"
            returnKeyType="done"
            onClear={() => onChangeText('')}
            onSubmitEditing={onSubmitEditing}
            errorMessage={errorMessage}
          />
        </Animated.View>
      ) : (
        <BaseInput
          value={value}
          onChangeText={onChangeText}
          placeholder="或输入自定义金额"
          iconName="attach-money"
          keyboardType="numeric"
          returnKeyType="done"
          onClear={() => onChangeText('')}
          onSubmitEditing={onSubmitEditing}
          errorMessage={errorMessage}
        />
      )}
    </WrapperComponent>
  );
};
