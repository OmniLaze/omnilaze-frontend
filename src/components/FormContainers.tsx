import React, { useMemo } from 'react';
import { View, Animated, Dimensions, StyleSheet, Platform } from 'react-native';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ImageCheckbox } from './ImageCheckbox';
import { BudgetInput } from './BudgetInput';
import { OrderConfirmationComponent } from './OrderConfirmationComponent';
import { ActionButton } from './ActionButton';
import { DeliveryTimeStep } from './DeliveryTimeStep';
import { ALLERGY_OPTIONS, PREFERENCE_OPTIONS, FOOD_TYPE_OPTIONS } from '../data/checkboxOptions';
import { BUDGET_OPTIONS_FOOD, BUDGET_OPTIONS_DRINK, LAYOUT } from '../constants';
import type { AddressSuggestion } from '../types';

interface FormInputContainerProps {
  // Current step data
  stepData: any;
  editingStep: number | null;
  currentStep: number;
  
  // Form state
  address: string;
  budget: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  otherAllergyText: string;
  otherPreferenceText: string;
  isAddressConfirmed: boolean;
  isFreeOrder: boolean;
  
  // Order status - 新增
  isSearchingRestaurant?: boolean;
  isOrderCompleted?: boolean;
  
  // Form handlers
  handleAddressChange: (text: string) => void;
  handleSelectAddress: (suggestion: AddressSuggestion) => void;
  handleDeliveryTimeConfirm: (time: string) => void;
  setBudget: (value: string) => void;
  setSelectedAllergies: (value: string[]) => void;
  setSelectedPreferences: (value: string[]) => void;
  setSelectedFoodType: (value: string[]) => void;
  setOtherAllergyText: (value: string) => void;
  setOtherPreferenceText: (value: string) => void;
  
  // Action handlers
  handleFinishEditing?: () => void;
  handleConfirmOrder: (orderText?: string) => void;
  
  // Animation & UI
  inputSectionAnimation: Animated.Value;
  inputError: string;
  isTyping: boolean;
  
  // Question animations for consistent styling
  currentQuestionAnimation?: Animated.Value;
  shakeAnimation?: Animated.Value;
  emotionAnimation?: Animated.Value;
  
  // Button handlers
  renderActionButton: () => React.ReactNode;
}

export const FormInputContainer: React.FC<FormInputContainerProps> = ({
  stepData,
  editingStep,
  currentStep,
  address,
  budget,
  deliveryTime,
  selectedAllergies,
  selectedPreferences,
  selectedFoodType,
  otherAllergyText,
  otherPreferenceText,
  isAddressConfirmed,
  isFreeOrder,
  isSearchingRestaurant = false, // 新增参数
  isOrderCompleted = false, // 新增参数
  handleAddressChange,
  handleSelectAddress,
  handleDeliveryTimeConfirm,
  setBudget,
  setSelectedAllergies,
  setSelectedPreferences,
  setSelectedFoodType,
  setOtherAllergyText,
  setOtherPreferenceText,
  handleFinishEditing,
  handleConfirmOrder,
  inputSectionAnimation,
  inputError,
  isTyping,
  currentQuestionAnimation,
  shakeAnimation,
  emotionAnimation,
  renderActionButton,
}) => {
  // 🔧 性能优化：使用 useMemo 缓存预算选项，避免重复计算
  const budgetOptions = useMemo(() => {
    const isSelectedDrink = selectedFoodType.includes('drink');
    return isSelectedDrink ? BUDGET_OPTIONS_DRINK : BUDGET_OPTIONS_FOOD;
  }, [selectedFoodType]);
  // 地址输入
  if (stepData.showAddressInput) {
    return (
      <View>
        <AddressAutocomplete
          value={address}
          onChangeText={handleAddressChange}
          onSelectAddress={handleSelectAddress}
          placeholder="请输入地址"
          iconName="location-on"
          editable={!isAddressConfirmed || editingStep === 0}
          isDisabled={isAddressConfirmed && editingStep !== 0}
          animationValue={inputSectionAnimation}
        />
      </View>
    );
  }
  
  // 用餐时间选择
  if (stepData.showDeliveryTimeInput) {
    return (
      <DeliveryTimeStep
        onConfirm={handleDeliveryTimeConfirm}
        initialValue={deliveryTime}
      />
    );
  }
  
  // 食物类型选择
  if (stepData.showFoodTypeInput) {
    const optionsToShow = isFreeOrder 
      ? FOOD_TYPE_OPTIONS.filter(option => option.id === 'drink')
      : FOOD_TYPE_OPTIONS;
    
    return (
      <ImageCheckbox
        options={optionsToShow}
        selectedIds={selectedFoodType}
        onSelectionChange={setSelectedFoodType}
        animationValue={inputSectionAnimation}
        singleSelect={true}
        disabled={isFreeOrder}
      />
    );
  }
  
  // 预算输入
  if (stepData.showBudgetInput) {
    return (
      <View>
        <BudgetInput
          value={budget}
          onChangeText={setBudget}
          animationValue={inputSectionAnimation}
          onSubmitEditing={editingStep === 4 ? handleFinishEditing : undefined}
          errorMessage={inputError}
          budgetOptions={budgetOptions}
        />
      </View>
    );
  }
  
  // 过敏选择
  if (stepData.showAllergyInput) {
    return (
      <ImageCheckbox
        options={ALLERGY_OPTIONS}
        selectedIds={selectedAllergies}
        onSelectionChange={setSelectedAllergies}
        animationValue={inputSectionAnimation}
        onOtherTextChange={setOtherAllergyText}
      />
    );
  }
  
  
  // 订单确认显示
  if (stepData.showOrderConfirmation) {
    return (
      <OrderConfirmationComponent
        address={address}
        deliveryTime={deliveryTime}
        selectedAllergies={selectedAllergies}
        selectedPreferences={selectedPreferences}
        selectedFoodType={selectedFoodType}
        budget={budget}
        isFreeOrder={isFreeOrder}
        animationValue={inputSectionAnimation}
        onConfirmOrder={handleConfirmOrder}
        onPaymentComplete={(success, orderText) => {
          if (success && orderText) {
            handleConfirmOrder(orderText);
          }
        }}
        isPaymentCompleted={isSearchingRestaurant || isOrderCompleted} // 传递支付完成状态
        currentQuestionAnimation={currentQuestionAnimation}
        shakeAnimation={shakeAnimation}
        emotionAnimation={emotionAnimation}
      />
    );
  }
  
  // 偏好选择
  if (stepData.showPreferenceInput) {
    return (
      <ImageCheckbox
        options={PREFERENCE_OPTIONS}
        selectedIds={selectedPreferences}
        onSelectionChange={setSelectedPreferences}
        animationValue={inputSectionAnimation}
        singleSelect={true}
        onOtherTextChange={setOtherPreferenceText}
      />
    );
  }
  
  return null;
};

interface FormActionButtonContainerProps {
  editingStep: number | null;
  currentStep: number;
  budget: string;
  address: string;
  canProceed: boolean;
  
  // Action handlers
  handleFinishEditing: () => void;
  handleAddressConfirm: () => void;
  handleNext: () => void;
  
  // Animation
  inputSectionAnimation: Animated.Value;
}

export const FormActionButtonContainer: React.FC<FormActionButtonContainerProps> = ({
  editingStep,
  currentStep,
  budget,
  address,
  canProceed,
  handleFinishEditing,
  handleAddressConfirm,
  handleNext,
  inputSectionAnimation
}) => {
  const { width } = Dimensions.get('window');
  const isMobile = width <= 768;
  const topGap = isMobile ? LAYOUT.BUTTON_HEIGHT / 2 : 0; // 移动端与上方输入组件拉开 1/2 个按钮高度
  // 编辑模式下的按钮
  if (editingStep !== null) {
    return (
      <View style={styles.buttonContainer}>
        <ActionButton
          onPress={handleFinishEditing}
          title="确认"
          disabled={!canProceed}
          isActive={canProceed}
          animationValue={inputSectionAnimation}
        />
      </View>
    );
  }
  
  // 地址确认按钮
  if (currentStep === 0) {
    return (
      <View style={styles.buttonContainer}>
        <ActionButton
          onPress={handleAddressConfirm}
          title="确认"
          disabled={!address.trim() || address.trim().length < 5}
          isActive={!!address.trim() && address.trim().length >= 5}
          animationValue={inputSectionAnimation}
        />
      </View>
    );
  }
  
  // 用餐时间步骤 - 组件内部有自己的确认按钮
  if (currentStep === 4) {
    return null;
  }
  
  // 订单确认步骤 - 组件内部有自己的确认和支付按钮
  if (currentStep === 6) {
    return null;
  }
  
  // 通用下一步按钮
  if (canProceed) {
    return (
      <View style={styles.buttonContainer}>
        <ActionButton
          onPress={handleNext}
          title="确认"
          variant="next"
          animationValue={inputSectionAnimation}
        />
      </View>
    );
  }
  
  return null;
};

// 移动端优化：按钮右下角定位样式
const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 20 : 10,
    right: 20,
    zIndex: 10,
  },
});