import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated, Platform } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { createInputStyles } from '../styles/inputStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface BaseInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  iconName: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
  maxLength?: number;
  editable?: boolean;
  isError?: boolean;
  isDisabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'done' | 'next';
  showClearButton?: boolean;
  showEditButton?: boolean;
  onClear?: () => void;
  onEdit?: () => void;
  animationValue?: Animated.Value;
  errorMessage?: string; // 新增：错误信息
}

export const BaseInput: React.FC<BaseInputProps> = ({
  value,
  onChangeText,
  placeholder,
  iconName,
  multiline = false,
  keyboardType = 'default',
  maxLength,
  editable = true,
  isError = false,
  isDisabled = false,
  onFocus,
  onBlur,
  onSubmitEditing,
  returnKeyType = 'done',
  showClearButton = true,
  showEditButton = false,
  onClear,
  onEdit,
  animationValue,
  errorMessage, // 新增：错误信息
}) => {
  const { theme } = useTheme();
  const inputStyles = createInputStyles(theme);
  
  const getWrapperStyle = () => {
    if (isDisabled) return [inputStyles.simpleInputWrapper, inputStyles.disabledSimpleInputWrapper];
    if (isError) return [inputStyles.simpleInputWrapper, inputStyles.errorSimpleInputWrapper];
    return inputStyles.simpleInputWrapper;
  };

  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
          inputStyles.inputSection,
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
    : { style: inputStyles.inputSection };

  return (
    <WrapperComponent {...wrapperProps}>
      <View style={getWrapperStyle()}>
        <SimpleIcon 
          name={iconName}
          size={20} 
          color="#B0B0B0" 
          style={inputStyles.simpleInputIcon}
        />
        <TextInput
          style={[
            inputStyles.simpleTextInput,
            multiline && inputStyles.multilineInput,
            ...(Platform.OS === 'web' ? [{ outlineStyle: 'none' as any, outlineWidth: 0 }] : [])
          ]}
          placeholder={placeholder}
          placeholderTextColor="#000000"
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          editable={editable}
          multiline={multiline}
          numberOfLines={multiline ? 2 : 1}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
        {value && showClearButton && !isDisabled && onClear && (
          <TouchableOpacity 
            onPress={onClear}
            style={inputStyles.simpleInputClearButton}
          >
            <SimpleIcon name="close" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
        {showEditButton && onEdit && (
          <TouchableOpacity 
            onPress={onEdit}
            style={inputStyles.simpleInputEditButton}
          >
            <SimpleIcon name="edit" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>
      {errorMessage && (
        <Text style={inputStyles.errorText}>{errorMessage}</Text>
      )}
    </WrapperComponent>
  );
};