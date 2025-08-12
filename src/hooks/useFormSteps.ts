import { useEffect } from 'react';
import { Animated } from 'react-native';
import { STEP_CONTENT } from '../data/stepContent';
import { ALLERGY_OPTIONS, PREFERENCE_OPTIONS, FOOD_TYPE_OPTIONS, convertToChineseDisplay } from '../data/checkboxOptions';
import type { Answer, AddressSuggestion, CompletedAnswers } from '../types';

interface UseFormStepsProps {
  // State values
  address: string;
  budget: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  otherAllergyText: string;
  otherPreferenceText: string;
  currentStep: number;
  editingStep: number | null;
  completedAnswers: CompletedAnswers;
  originalAnswerBeforeEdit: Answer | null;
  isFreeOrder: boolean;
  isAddressConfirmed: boolean;
  showMap: boolean;
  selectedAddressSuggestion: AddressSuggestion | null;
  isAuthenticated: boolean;
  authQuestionText: string;
  
  // State setters
  setAddress: (value: string) => void;
  setBudget: (value: string) => void;
  setSelectedAllergies: (value: string[]) => void;
  setSelectedPreferences: (value: string[]) => void;
  setSelectedFoodType: (value: string[]) => void;
  setOtherAllergyText: (value: string) => void;
  setOtherPreferenceText: (value: string) => void;
  setCurrentStep: (value: number) => void;
  setCompletedAnswers: (value: CompletedAnswers | ((prev: CompletedAnswers) => CompletedAnswers)) => void;
  setEditingStep: (value: number | null) => void;
  setOriginalAnswerBeforeEdit: (value: Answer | null) => void;
  setIsAddressConfirmed: (value: boolean) => void;
  setShowMap: (value: boolean) => void;
  setSelectedAddressSuggestion: (value: AddressSuggestion | null) => void;
  setCurrentOrderId: (value: string | null) => void;
  setCurrentOrderNumber: (value: string | null) => void;
  setCurrentUserSequenceNumber: (value: number | null) => void;
  setIsOrderSubmitting: (value: boolean) => void;
  setIsSearchingRestaurant: (value: boolean) => void;
  
  // Animation values
  mapAnimation: Animated.Value;
  answerAnimations: Animated.Value[];
  
  // Unified functions
  handleAnswerSubmission: (stepIndex: number, answer: any, options?: { isEditing?: boolean; skipAnimation?: boolean; onComplete?: () => void }) => Promise<boolean>;
  handleStepProgression: (currentStepIndex: number) => void;
  
  // Validation & Animation functions
  validateInput: (step: number, value: any) => { isValid: boolean };
  triggerShake: () => void;
  changeEmotion: (emotion: string) => void;
}

export const useFormSteps = (props: UseFormStepsProps) => {
  const {
    address, budget, selectedAllergies, selectedPreferences, selectedFoodType,
    otherAllergyText, otherPreferenceText, currentStep, editingStep, completedAnswers,
    originalAnswerBeforeEdit, isFreeOrder, isAddressConfirmed, showMap,
    selectedAddressSuggestion, isAuthenticated, authQuestionText,
    setAddress, setBudget, setSelectedAllergies, setSelectedPreferences, setSelectedFoodType,
    setOtherAllergyText, setOtherPreferenceText, setCurrentStep, setCompletedAnswers,
    setEditingStep, setOriginalAnswerBeforeEdit, setIsAddressConfirmed, setShowMap,
    setSelectedAddressSuggestion, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    mapAnimation, answerAnimations, 
    handleAnswerSubmission, handleStepProgression,
    validateInput, triggerShake, changeEmotion
  } = props;

  // 获取当前步骤数据
  const getCurrentStepData = () => {
    if (!isAuthenticated) {
      return {
        message: authQuestionText,
        showPhoneInput: true,
        inputType: 'phone'
      };
    }
    
    const stepData = STEP_CONTENT[currentStep];
    
    // 免单模式的特殊文本处理
    if (isFreeOrder && stepData) {
      switch (stepData.inputType) {
        case 'foodType':
          return {
            ...stepData,
            message: "我已经为您自动选择了奶茶 🧋"
          };
        case 'payment':
          return {
            ...stepData,
            message: "恭喜！您的免单奶茶已经不远了～"
          };
      }
    }
    
    // 特殊处理预算步骤，根据食物类型和免单状态显示不同问题
    if (stepData && stepData.inputType === 'budget') {
      const isSelectedDrink = selectedFoodType.includes('drink');
      
      if (isFreeOrder) {
        return {
          ...stepData,
          message: "恭喜！您的免单奶茶已经准备好了～"
        };
      } else {
        return {
          ...stepData,
          message: isSelectedDrink 
            ? "我可以花多少钱帮你买奶茶？" 
            : "我可以花多少钱帮你点外卖？"
        };
      }
    }
    
    return stepData;
  };

  // 获取当前答案
  const getCurrentAnswer = (): Answer | null => {
    const stepToUse = editingStep !== null ? editingStep : currentStep;
    switch (stepToUse) {
      case 0: return { type: 'address', value: address };
      case 1: {
        const foodTypeLabels = selectedFoodType.map(id => {
          const option = FOOD_TYPE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'foodType', value: foodTypeLabels.length > 0 ? foodTypeLabels.join(', ') : '未选择' };
      }
      case 2: {
        const allergyLabels = selectedAllergies.map(id => {
          if (id === 'other-allergy') {
            return otherAllergyText ? `其他: ${otherAllergyText}` : '其他';
          }
          const option = ALLERGY_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'allergy', value: allergyLabels.length > 0 ? allergyLabels.join(', ') : '无忌口' };
      }
      case 3: {
        const preferenceLabels = selectedPreferences.map(id => {
          if (id === 'other-preference') {
            return otherPreferenceText ? `其他: ${otherPreferenceText}` : '其他';
          }
          const option = PREFERENCE_OPTIONS.find(opt => opt.id === id);
          return option ? option.label : id;
        });
        return { type: 'preference', value: preferenceLabels.length > 0 ? preferenceLabels.join(', ') : '无特殊偏好' };
      }
      case 4: return { type: 'budget', value: budget };
      default: return null;
    }
  };

  // 格式化答案显示
  const formatAnswerDisplay = (answer: Answer) => {
    if (!answer) return '';
    switch (answer.type) {
      case 'address': return answer.value;
      case 'phone': return answer.value;
      case 'budget': return `¥${answer.value}`;
      case 'allergy': 
        return answer.value ? convertToChineseDisplay(answer.value) : '无忌口';
      case 'preference': 
        return answer.value ? convertToChineseDisplay(answer.value) : '无特殊偏好';
      case 'foodType': 
        return answer.value ? convertToChineseDisplay(answer.value) : '未选择';
      default: return answer.value;
    }
  };

  // 检查是否可以继续
  const canProceed = () => {
    if (!isAuthenticated) {
      return false;
    }
    
    if (editingStep !== null) {
      const stepData = STEP_CONTENT[editingStep];
      switch (stepData.inputType) {
        case 'address':
          return !!address.trim() && address.trim().length >= 5;
        case 'foodType':
          return selectedFoodType.length > 0;
        case 'allergy':
        case 'preference':
          return true;
        case 'budget':
          return !!budget.trim() && parseFloat(budget) >= 10;
        default:
          return true;
      }
    }
    
    const stepData = getCurrentStepData();
    switch (stepData.inputType) {
      case 'address':
        return !!address.trim() && address.trim().length >= 5;
      case 'foodType':
        return selectedFoodType.length > 0;
      case 'allergy':
      case 'preference':
        return true;
      case 'budget':
        return !!budget.trim() && parseFloat(budget) >= 10;
      default:
        return true;
    }
  };

  // 处理地址变更
  const handleAddressChange = (text: string) => {
    setAddress(text);
    if (selectedAddressSuggestion && text !== selectedAddressSuggestion.description) {
      setSelectedAddressSuggestion(null);
    }
  };

  // 选择地址建议
  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setSelectedAddressSuggestion(suggestion);
    setAddress(suggestion.description);
  };

  // 确认地址
  const handleAddressConfirm = () => {
    if (!validateInput(0, address).isValid) {
      triggerShake();
      return;
    }
    
    setIsAddressConfirmed(true);
    changeEmotion('✅');
    
    setTimeout(() => {
      handleNext();
    }, 300);
  };

  // 处理下一步 - 使用统一的回答管理
  const handleNext = async () => {
    const currentAnswer = getCurrentAnswer();
    
    // 使用统一的回答提交函数
    const success = await handleAnswerSubmission(currentStep, currentAnswer, {
      onComplete: () => handleStepProgression(currentStep)
    });
    
    if (success && currentStep === 0) {
      setIsAddressConfirmed(true);
    }
  };

  // 编辑地址
  const handleEditAddress = () => {
    setIsAddressConfirmed(false);
    setShowMap(false);
    setAddress('');
    mapAnimation.setValue(0);
  };

  // 级联编辑答案 - 编辑某个问题后，后续问题都需要重新选择
  const handleEditAnswer = (stepIndex: number) => {
    const answerToEdit = completedAnswers[stepIndex];
    if (!answerToEdit) return;
    
    // 检查是否有后续已完成的答案
    const hasSubsequentAnswers = Object.keys(completedAnswers).some(key => 
      parseInt(key) > stepIndex
    );
    
    // 如果有后续答案，给用户一个轻微的反馈（通过动画或状态）
    if (hasSubsequentAnswers) {
      // 可以在这里添加用户提示，例如：
      // showMessage('编辑此问题将清除后续所有答案');
      // 🔧 生产环境日志清理：条件性日志输出
      if (process.env.NODE_ENV === 'development') {
        console.log(`编辑第${stepIndex + 1}个问题将清除后续所有答案`);
      }
    }
    
    setOriginalAnswerBeforeEdit(answerToEdit);
    
    // 核心逻辑：清除当前编辑步骤及其后的所有已完成答案
    const newCompletedAnswers = { ...completedAnswers };
    
    // 删除当前编辑步骤
    if (newCompletedAnswers.hasOwnProperty(stepIndex)) {
      delete newCompletedAnswers[stepIndex];
    }
    
    // 删除所有大于当前编辑步骤的已完成答案
    Object.keys(newCompletedAnswers).forEach(key => {
      const keyNumber = parseInt(key);
      if (keyNumber > stepIndex) {
        delete newCompletedAnswers[keyNumber];
      }
    });
    
    // 更新已完成答案集合
    setCompletedAnswers(newCompletedAnswers);
    
    // 重置所有后续步骤的状态
    resetSubsequentStepStates(stepIndex);
    
    // 恢复当前编辑步骤的值
    restoreEditingStepValues(answerToEdit);
    
    // 设置当前步骤为编辑的步骤
    setCurrentStep(stepIndex);
    setEditingStep(stepIndex);
    
    // 注意：下滑手势切换到当前问题视图的逻辑在App.tsx的useEffect中处理
  };
  
  // 重置后续步骤的状态
  const resetSubsequentStepStates = (fromStep: number) => {
    // 根据编辑的步骤，重置相应的后续状态
    if (fromStep <= 0) {
      // 编辑地址后，重置所有后续状态
      setSelectedFoodType([]);
      setSelectedAllergies([]);
      setSelectedPreferences([]);
      setBudget('');
      setIsAddressConfirmed(false);
      setShowMap(false);
      mapAnimation.setValue(0);
    }
    
    if (fromStep <= 1) {
      // 编辑食物类型后，重置忌口、偏好、预算
      setSelectedAllergies([]);
      setSelectedPreferences([]);
      setBudget('');
    }
    
    if (fromStep <= 2) {
      // 编辑忌口后，重置偏好、预算
      setSelectedPreferences([]);
      setBudget('');
    }
    
    if (fromStep <= 3) {
      // 编辑偏好后，重置预算
      setBudget('');
    }
    
    // 重置订单相关状态
    setCurrentOrderId(null);
    setCurrentOrderNumber(null);
    setCurrentUserSequenceNumber(null);
    setIsOrderSubmitting(false);
    setIsSearchingRestaurant(false);
  };
  
  // 恢复编辑步骤的值
  const restoreEditingStepValues = (answerToEdit: Answer) => {
    switch (answerToEdit.type) {
      case 'address':
        setAddress(answerToEdit.value);
        setIsAddressConfirmed(false);
        setShowMap(false);
        mapAnimation.setValue(0);
        break;
      case 'foodType':
        if (answerToEdit.value !== '未选择') {
          const labels = Array.isArray(answerToEdit.value) 
            ? answerToEdit.value 
            : answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = FOOD_TYPE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedFoodType(ids);
        }
        break;
      case 'allergy':
        if (answerToEdit.value !== '无忌口') {
          const labels = Array.isArray(answerToEdit.value) 
            ? answerToEdit.value 
            : answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = ALLERGY_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedAllergies(ids);
        } else {
          setSelectedAllergies([]);
        }
        break;
      case 'preference':
        if (answerToEdit.value !== '无特殊偏好') {
          const labels = Array.isArray(answerToEdit.value) 
            ? answerToEdit.value 
            : answerToEdit.value.split(', ');
          const ids = labels.map(label => {
            const option = PREFERENCE_OPTIONS.find(opt => opt.label === label);
            return option ? option.id : label;
          });
          setSelectedPreferences(ids);
        } else {
          setSelectedPreferences([]);
        }
        break;
      case 'budget':
        setBudget(answerToEdit.value);
        break;
    }
  };

  // 完成编辑 - 简化版，级联逻辑已在handleEditAnswer中处理
  const handleFinishEditing = () => {
    const currentAnswer = getCurrentAnswer();
    if (currentAnswer && editingStep !== null) {
      
      // 使用统一的回答提交函数
      const success = handleAnswerSubmission(editingStep, currentAnswer, {
        isEditing: true,
        skipAnimation: true, // 编辑模式不需要动画
        onComplete: () => {
          // 🔧 生产环境日志清理：条件性日志输出
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ 编辑完成回调执行');
          }
          
          // 编辑完成后的基本处理
          if (editingStep === 0) {
            setIsAddressConfirmed(true);
          }
          
          const currentEditingStep = editingStep;
          
          // 清除编辑状态
          setEditingStep(null);
          setOriginalAnswerBeforeEdit(null);
          
          // 🔑 关键修复：使用handleStepProgression来推进步骤并显示新问题
          if (currentEditingStep !== null && currentEditingStep < STEP_CONTENT.length - 1) {
            // 🔧 生产环境日志清理：条件性日志输出
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 编辑完成，调用handleStepProgression推进到下一步');
            }
            handleStepProgression(currentEditingStep);
          } else {
            // 🔧 生产环境日志清理：条件性日志输出
            if (process.env.NODE_ENV === 'development') {
              console.log('📝 编辑完成，已经是最后一步，无需推进');
            }
          }
        }
      });
      
      if (!success) {
        return; // 验证失败，不继续处理
      }
    }
  };

  // 取消编辑 - 恢复原始状态，保持级联删除的结果
  const handleCancelEditing = () => {
    if (editingStep !== null && originalAnswerBeforeEdit) {
      // 恢复当前步骤的原始值
      restoreEditingStepValues(originalAnswerBeforeEdit);
      
      // 特殊处理地址确认状态
      if (originalAnswerBeforeEdit.type === 'address') {
        setIsAddressConfirmed(true);
      }
      
      // 清除编辑状态
      setEditingStep(null);
      setOriginalAnswerBeforeEdit(null);
      
      // 重新设置当前步骤为下一个需要完成的步骤
      const nextIncompleteStep = findNextIncompleteStep();
      if (nextIncompleteStep !== -1) {
        setCurrentStep(nextIncompleteStep);
      }
    }
  };
  
  // 找到下一个未完成的步骤
  const findNextIncompleteStep = (): number => {
    for (let i = 0; i < STEP_CONTENT.length; i++) {
      if (!completedAnswers[i]) {
        return i;
      }
    }
    return STEP_CONTENT.length; // 所有步骤都已完成
  };

  return {
    getCurrentStepData,
    getCurrentAnswer,
    formatAnswerDisplay,
    canProceed,
    handleAddressChange,
    handleSelectAddress,
    handleAddressConfirm,
    handleNext,
    handleEditAddress,
    handleEditAnswer,
    handleFinishEditing,
    handleCancelEditing
  };
};