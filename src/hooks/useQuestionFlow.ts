import { useState, useCallback, useEffect } from 'react';
import { STEP_CONTENT } from '../data/stepContent';
import { useTypewriterEffect } from './index';
import { useSafeTimeout } from './useSafeTimeout';
import { VALUE_MAPPING } from '../data/checkboxOptions';

interface UseQuestionFlowProps {
  isAuthenticated: boolean;
  isStateRestored: boolean;
  currentStep: number;
  editingStep: number | null;
  completedAnswers: Record<number, any>;
  authQuestionText: string;
  isOrderCompleted: boolean;
  orderMessage: string;
  address: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  budget: string;
  selectedFoodType: string[];
  isFreeOrder: boolean;
  clearText: () => void;
  setCurrentStep: (step: number) => void;
  inputSectionAnimation: any;
  currentQuestionAnimation: any;
}

export const useQuestionFlow = ({
  isAuthenticated,
  isStateRestored,
  currentStep,
  editingStep,
  completedAnswers,
  authQuestionText,
  isOrderCompleted,
  orderMessage,
  address,
  selectedAllergies,
  selectedPreferences,
  budget,
  selectedFoodType,
  isFreeOrder,
  clearText,
  setCurrentStep,
  inputSectionAnimation,
  currentQuestionAnimation,
}: UseQuestionFlowProps) => {
  const { setSafeTimeout, clearTimeoutById } = useSafeTimeout();
  const { 
    displayedText, 
    isTyping, 
    showCursor, 
    cursorOpacity, 
    streamingOpacity,
    typeText, 
    setTextDirectly,
    isStreaming 
  } = useTypewriterEffect();

  // Handle question transition with typewriter effect
  const handleQuestionTransition = useCallback((questionText: string, hasUserInput: boolean = false) => {
    // Reset animation states
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);

    if (!hasUserInput) {
      // Use typewriter effect for new questions
      typeText(questionText, { 
        instant: false,
        streaming: true,
      });
    } else {
      // Direct display for questions with existing input
      setTextDirectly(questionText);
    }
  }, [inputSectionAnimation, currentQuestionAnimation, typeText, setTextDirectly]);

  // Handle step progression logic
  const handleStepProgression = useCallback((currentStepIndex: number) => {
    let nextStep = currentStepIndex + 1;
    
    // Special step logic for food type
    if (currentStepIndex === 1) {
      const isSelectedDrink = selectedFoodType.includes('drink');
      if (isSelectedDrink) {
        nextStep = 4; // Skip to delivery time
      }
    }
    
    // Free order mode skips budget
    if (isFreeOrder && currentStepIndex === 4) {
      nextStep = 6; // Skip to order confirmation
    }
    
    // After budget, go to order confirmation
    if (currentStepIndex === 5) {
      nextStep = 6;
    }
    
    if (nextStep < STEP_CONTENT.length) {
      // Clear text and update step
      clearText();
      setCurrentStep(nextStep);
      
      // Force show new question
      setSafeTimeout(() => {
        const stepData = STEP_CONTENT[nextStep];
        if (stepData) {
          const hasUserInput = !!completedAnswers[nextStep];
          handleQuestionTransition(stepData.message, hasUserInput);
        }
      }, 10);
    }
  }, [
    selectedFoodType,
    isFreeOrder,
    completedAnswers,
    clearText,
    setCurrentStep,
    setSafeTimeout,
    handleQuestionTransition,
  ]);

  // Get current step data
  const getCurrentStepData = useCallback(() => {
    if (editingStep !== null) {
      return STEP_CONTENT[editingStep];
    }
    return STEP_CONTENT[currentStep];
  }, [currentStep, editingStep]);

  // Format answer display for completed questions
  const formatAnswerDisplay = useCallback((answer: any): string => {
    if (!answer) return '';
    
    switch (answer.type) {
      case 'phone':
        return answer.value;
      case 'address':
        return answer.value;
      case 'foodType':
      case 'allergy':
      case 'preference':
        if (Array.isArray(answer.value)) {
          return answer.value.map(v => VALUE_MAPPING[v] || v).join('、');
        }
        return VALUE_MAPPING[answer.value] || answer.value;
      case 'deliveryTime':
        return answer.value === 'ASAP' ? '越快越好' : answer.value;
      case 'budget':
        return `¥${answer.value}`;
      case 'orderConfirmation':
        return '已确认';
      default:
        return answer.value?.toString() || '';
    }
  }, []);

  // Check if current step has user input
  const hasUserInputForStep = useCallback((stepData: any): boolean => {
    switch (stepData.inputType) {
      case 'address':
        return !!address.trim();
      case 'foodType':
        return selectedFoodType.length > 0;
      case 'allergy':
        return selectedAllergies.length > 0;
      case 'preference':
        return selectedPreferences.length > 0;
      case 'budget':
        return !!budget.trim();
      case 'orderConfirmation':
        return false; // Order confirmation never has user input
      default:
        return false;
    }
  }, [address, selectedFoodType, selectedAllergies, selectedPreferences, budget]);

  // Calculate first incomplete step index
  const getFirstIncompleteStep = useCallback(() => {
    for (let i = 0; i < STEP_CONTENT.length; i++) {
      if (!completedAnswers[i]) return i;
    }
    return -1;
  }, [completedAnswers]);

  // Main effect for displaying questions
  useEffect(() => {
    // Skip if not ready
    if (!isStateRestored) return;
    
    // Handle authentication state - 只在真正未认证时显示认证问题
    if (editingStep === null && !isAuthenticated && !isTyping && !displayedText && authQuestionText) {
      handleQuestionTransition(authQuestionText);
      return;
    }
    
    // Handle order completed state
    if (isOrderCompleted && orderMessage) {
      if (!displayedText && isStateRestored) {
        setTextDirectly(orderMessage);
      }
      return;
    }
    
    // 🔑 修复：只有在已认证状态下才处理表单问题
    if (!isAuthenticated) return;
    
    // Handle authenticated state - show form questions
    const targetStepIndex = !completedAnswers[currentStep] ? currentStep : getFirstIncompleteStep();
    
    const shouldShowQuestion = (
      editingStep === null && 
      isAuthenticated && 
      !isOrderCompleted &&
      targetStepIndex >= 0 &&
      targetStepIndex < STEP_CONTENT.length && 
      !isTyping && 
      !displayedText
    );
    
    if (shouldShowQuestion) {
      const stepData = targetStepIndex >= 0 ? STEP_CONTENT[targetStepIndex] : getCurrentStepData();
      const hasUserInput = hasUserInputForStep(stepData);
      handleQuestionTransition(stepData.message, hasUserInput);
    }
  }, [
    isStateRestored,
    editingStep,
    isAuthenticated,
    authQuestionText,
    isOrderCompleted,
    orderMessage,
    currentStep,
    completedAnswers,
    isTyping,
    displayedText,
    handleQuestionTransition,
    setTextDirectly,
    getCurrentStepData,
    getFirstIncompleteStep,
    hasUserInputForStep,
  ]);

  // Handle editing mode - 修复编辑模式下的问题显示
  useEffect(() => {
    if (editingStep !== null && isStateRestored) {
      const stepData = STEP_CONTENT[editingStep];
      if (stepData) {
        // 在编辑模式下，直接显示问题文字
        setTextDirectly(stepData.message);
        
        // 确保输入区域也显示出来
        setTimeout(() => {
          inputSectionAnimation.setValue(1);
        }, 50);
      }
    }
  }, [editingStep, isStateRestored, setTextDirectly, inputSectionAnimation]);

  // Auto-navigate to first incomplete step after restore
  useEffect(() => {
    if (!isStateRestored || !isAuthenticated || isOrderCompleted) return;
    if (editingStep !== null) return;

    const nextStepIndex = getFirstIncompleteStep();
    if (nextStepIndex >= 0 && currentStep !== nextStepIndex) {
      setCurrentStep(nextStepIndex);
      clearText?.();
    }
  }, [
    isStateRestored,
    isAuthenticated,
    isOrderCompleted,
    editingStep,
    currentStep,
    getFirstIncompleteStep,
    setCurrentStep,
    clearText,
  ]);

  return {
    displayedText,
    isTyping,
    showCursor,
    cursorOpacity,
    streamingOpacity,
    isStreaming,
    handleQuestionTransition,
    handleStepProgression,
    getCurrentStepData,
    formatAnswerDisplay,
    hasUserInputForStep,
    getFirstIncompleteStep,
    typeText,
    setTextDirectly,
  };
};