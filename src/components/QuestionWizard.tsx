import React, { memo, useCallback, useMemo } from 'react';
import { View, Animated, Platform } from 'react-native';
import { useAuth, useForm, useOrder, useUI } from '../contexts/AppContext';
import { useAnimationManager } from '../hooks/useAnimationManager';
import { useQuestionFlow } from '../hooks/useQuestionFlow';
import { useScrollManager } from '../hooks/useScrollManager';
import { useOrderFlow } from '../hooks/useOrderFlow';
import { CurrentQuestion } from './CurrentQuestion';
import { CompletedQuestion } from './CompletedQuestion';
import { AuthComponent } from './AuthComponent';
import { FormInputContainer } from './FormContainers';
import { FormActionButtonContainer } from './FormContainers';
import { OrderMessageLog } from './OrderMessageLog';
import WizardFlatList from './WizardFlatList';
import { STEP_CONTENT } from '../data/stepContent';
import { useValidation } from '../hooks';
import { useTypewriterEffect } from '../hooks';
import { useSafeTimeout } from '../hooks/useSafeTimeout';

interface QuestionWizardProps {
  theme: any;
  width: number;
  height: number;
  orderMessagesLog: any[];
  pushOrderMessage: (text: string, avatar: 'assistant' | 'delivery') => void;
}

const QuestionWizard: React.FC<QuestionWizardProps> = memo(({
  theme,
  width,
  height,
  orderMessagesLog,
  pushOrderMessage,
}) => {
  const { setSafeTimeout } = useSafeTimeout();
  
  // Context hooks
  const auth = useAuth();
  const form = useForm();
  const order = useOrder();
  const ui = useUI();
  
  // Validation hook
  const { inputError, validateInput, validatePhoneNumber, setInputError } = useValidation();
  
  // Animation manager
  const animationManager = useAnimationManager();
  const {
    questionAnimations,
    answerAnimations,
    currentQuestionAnimation,
    shakeAnimation,
    emotionAnimation,
    inputSectionAnimation,
    completedQuestionsOffset,
    triggerShake,
    changeEmotion,
    showInputSection,
    animateQuestionFlow,
  } = animationManager;
  
  // Typewriter effect
  const typewriterEffect = useTypewriterEffect();
  const { clearText } = typewriterEffect;
  
  // Question flow management
  const questionFlow = useQuestionFlow({
    isAuthenticated: auth.isAuthenticated,
    isStateRestored: ui.isStateRestored,
    currentStep: form.currentStep,
    editingStep: form.editingStep,
    completedAnswers: form.completedAnswers,
    authQuestionText: auth.authQuestionText,
    isOrderCompleted: order.isOrderCompleted,
    orderMessage: order.orderMessage,
    address: form.address,
    selectedAllergies: form.selectedAllergies,
    selectedPreferences: form.selectedPreferences,
    budget: form.budget,
    selectedFoodType: form.selectedFoodType,
    isFreeOrder: order.isFreeOrder,
    clearText,
    setCurrentStep: form.setCurrentStep,
    inputSectionAnimation,
    currentQuestionAnimation,
  });
  
  const {
    displayedText,
    isTyping,
    showCursor,
    cursorOpacity,
    streamingOpacity,
    isStreaming,
    handleQuestionTransition,
    handleStepProgression,
    formatAnswerDisplay,
    typeText,
    setTextDirectly,
    getFirstIncompleteStep,
  } = questionFlow;
  
  // Order flow management
  const orderFlow = useOrderFlow({
    authResult: auth.authResult,
    address: form.address,
    deliveryTime: form.deliveryTime,
    selectedAllergies: form.selectedAllergies,
    selectedPreferences: form.selectedPreferences,
    budget: form.budget,
    selectedFoodType: form.selectedFoodType,
    isFreeOrder: order.isFreeOrder,
    currentUserSequenceNumber: order.currentUserSequenceNumber,
    otherAllergyText: form.otherAllergyText,
    otherPreferenceText: form.otherPreferenceText,
    selectedAddressSuggestion: form.selectedAddressSuggestion,
    setCurrentOrderId: order.setCurrentOrderId,
    setCurrentOrderNumber: order.setCurrentOrderNumber,
    setCurrentUserSequenceNumber: order.setCurrentUserSequenceNumber,
    setIsOrderSubmitting: order.setIsOrderSubmitting,
    setIsSearchingRestaurant: order.setIsSearchingRestaurant,
    setIsOrderCompleted: order.setIsOrderCompleted,
    setCurrentStep: form.setCurrentStep,
    setCompletedAnswers: form.setCompletedAnswers,
    setInputError: ui.setInputError,
    setOrderMessage: order.setOrderMessage,
    triggerShake,
    changeEmotion,
    typeText,
    pushOrderMessage,
  });
  
  // Scroll management
  const [completedQuestionsHeight, setCompletedQuestionsHeight] = React.useState(300);
  const scrollManager = useScrollManager({
    completedAnswers: form.completedAnswers,
    completedQuestionsHeight,
    isStateRestored: ui.isStateRestored,
    isTyping,
    width,
    height,
  });
  
  // Handle editing - 直接删除答案并进入编辑状态
  const handleEditQuestion = useCallback((stepIndex: number) => {
    // 1. 删除当前步骤及后续步骤的所有已完成答案
    const newCompletedAnswers = { ...form.completedAnswers };
    
    // 删除当前编辑步骤及其后的所有答案
    Object.keys(newCompletedAnswers).forEach(key => {
      const keyNumber = parseInt(key);
      if (keyNumber >= stepIndex) {
        delete newCompletedAnswers[keyNumber];
      }
    });
    
    // 更新已完成答案集合
    form.setCompletedAnswers(newCompletedAnswers);
    
    // 2. 重置当前步骤及后续步骤的表单状态
    if (stepIndex <= 0) {
      form.setAddress('');
      form.setIsAddressConfirmed(false);
      form.setSelectedAddressSuggestion(null);
    }
    if (stepIndex <= 1) {
      form.setSelectedFoodType([]);
    }
    if (stepIndex <= 2) {
      form.setSelectedAllergies([]);
      form.setOtherAllergyText('');
    }
    if (stepIndex <= 3) {
      form.setSelectedPreferences([]);
      form.setOtherPreferenceText('');
    }
    if (stepIndex <= 4) {
      form.setDeliveryTime('');
    }
    if (stepIndex <= 5) {
      form.setBudget('');
    }
    
    // 3. 重置订单相关状态
    order.setCurrentOrderId(null);
    order.setCurrentOrderNumber(null);
    order.setCurrentUserSequenceNumber(null);
    order.setIsOrderSubmitting(false);
    order.setIsSearchingRestaurant(false);
    order.setIsOrderCompleted(false);
    order.setIsPaymentCompleted(false);
    
    // 4. 设置当前步骤，不进入编辑状态，直接重新开始
    form.setCurrentStep(stepIndex);
    form.setEditingStep(null); // 不进入编辑状态，直接重新开始填写
    
    // 5. 清除当前显示的文字，准备显示新问题
    clearText();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 编辑第${stepIndex}步，已删除当前及后续所有答案，进入重新填写状态`);
    }
  }, [form, order, clearText]);

  // Handle answer submission
  const handleAnswerSubmission = useCallback(async (
    stepIndex: number,
    answer: any,
    options: {
      isEditing?: boolean;
      skipAnimation?: boolean;
      onComplete?: () => void;
    } = {}
  ) => {
    const { isEditing = false, skipAnimation = false, onComplete } = options;
    
    // Validate input
    if (!validateInput(stepIndex, answer?.value).isValid) {
      triggerShake();
      return false;
    }
    
    // Update emotion
    if (!isEditing) {
      changeEmotion('🎉');
    }
    
    // Save answer
    form.setCompletedAnswers(prev => ({
      ...prev,
      [stepIndex]: answer
    }));
    
    // Show animations
    if (stepIndex >= 0) {
      questionAnimations[stepIndex].setValue(1);
      answerAnimations[stepIndex].setValue(1);
    }
    
    // Animate push up if needed
    if (!skipAnimation && !isEditing) {
      const pushUpDistance = 85;
      animateQuestionFlow(stepIndex, pushUpDistance, onComplete);
      ui.setCurrentPushOffset(ui.currentPushOffset + pushUpDistance);
    } else {
      setSafeTimeout(() => onComplete?.(), 100);
    }
    
    return true;
  }, [
    validateInput,
    triggerShake,
    changeEmotion,
    form,
    questionAnimations,
    answerAnimations,
    animateQuestionFlow,
    ui,
    setSafeTimeout,
  ]);
  
  // Handle authentication success
  const handleAuthSuccess = useCallback(async (result: any) => {
    if (result.isPhoneVerificationStep) {
      const phoneAnswer = { type: 'phone', value: result.phoneNumber };
      await handleAnswerSubmission(-1, phoneAnswer, {
        isEditing: false,
        skipAnimation: false,
      });
      return;
    }
    
    // Complete authentication
    auth.setIsAuthenticated(true);
    auth.setAuthResult(result);
    
    // 🔑 关键修复：清空认证问题文本，防止登录后还显示"手机号？"
    auth.setAuthQuestionText('');
    
    // Clear text and move to first step
    clearText();
    form.setCurrentStep(0);
    
    const phoneAnswer = { type: 'phone', value: result.phoneNumber };
    await handleAnswerSubmission(-1, phoneAnswer, { skipAnimation: true });
    
    // 🔑 强制立即触发第一个问题的显示
    const firstStepData = STEP_CONTENT[0];
    if (firstStepData) {
      setTimeout(() => {
        handleQuestionTransition(firstStepData.message, false);
      }, 100);
    }
    
    // Handle quick order mode if applicable
    // ... (quick order logic here)
  }, [auth, form, clearText, handleAnswerSubmission, handleQuestionTransition]);
  
  // Handle payment completion
  const handlePaymentComplete = useCallback((success: boolean, orderText?: string) => {
    order.setShowPaymentModal(false);
    if (success) {
      orderFlow.handlePaymentComplete(success, orderText);
    } else {
      order.setShowGoToPaymentButton(true);
      order.setIsSearchingRestaurant(false);
    }
  }, [order, orderFlow]);
  
  // Render current input component
  const renderCurrentInput = useCallback(() => {
    const stepData = form.editingStep !== null 
      ? STEP_CONTENT[form.editingStep] 
      : STEP_CONTENT[form.currentStep];
    
    if (!stepData) return null;
    
    return (
      <FormInputContainer
        stepData={stepData}
        editingStep={form.editingStep}
        currentStep={form.currentStep}
        address={form.address}
        budget={form.budget}
        deliveryTime={form.deliveryTime}
        selectedAllergies={form.selectedAllergies}
        selectedPreferences={form.selectedPreferences}
        selectedFoodType={form.selectedFoodType}
        otherAllergyText={form.otherAllergyText}
        otherPreferenceText={form.otherPreferenceText}
        isAddressConfirmed={form.isAddressConfirmed}
        isFreeOrder={order.isFreeOrder}
        authResult={auth.authResult}
        isSearchingRestaurant={order.isSearchingRestaurant}
        isOrderCompleted={order.isOrderCompleted}
        isPaymentCompleted={order.isPaymentCompleted}
        handleAddressChange={(value: string) => form.setAddress(value)}
        handleSelectAddress={(suggestion: any) => form.setSelectedAddressSuggestion(suggestion)}
        handleDeliveryTimeConfirm={(deliveryTime: string) => {
          // Save delivery time
          form.setDeliveryTime(deliveryTime);
          
          // Save answer
          const timeAnswer = {
            type: 'deliveryTime',
            value: deliveryTime
          };
          form.setCompletedAnswers(prev => ({
            ...prev,
            [4]: timeAnswer
          }));
          
          // Progress to next step
          handleStepProgression(4);
        }}
        onDeliveryTimeSelectionChange={() => {}}
        setBudget={form.setBudget}
        setSelectedAllergies={form.setSelectedAllergies}
        setSelectedPreferences={form.setSelectedPreferences}
        setSelectedFoodType={form.setSelectedFoodType}
        setOtherAllergyText={form.setOtherAllergyText}
        setOtherPreferenceText={form.setOtherPreferenceText}
        handleFinishEditing={() => form.setEditingStep(null)}
        handleConfirmOrder={orderFlow.handleConfirmOrder}
        inputSectionAnimation={inputSectionAnimation}
        inputError={ui.inputError}
        isTyping={isTyping}
        currentQuestionAnimation={currentQuestionAnimation}
        shakeAnimation={shakeAnimation}
        emotionAnimation={emotionAnimation}
        renderActionButton={() => null}
        onShouldShowPaymentButton={(show: boolean) => order.setShowGoToPaymentButton(show)}
        onPaymentComplete={handlePaymentComplete}
        showPaymentModal={order.showPaymentModal}
        setShowPaymentModal={order.setShowPaymentModal}
        currentOrderId={order.currentOrderId}
        setCurrentOrderId={order.setCurrentOrderId}
        setCurrentOrderNumber={order.setCurrentOrderNumber}
        setCurrentUserSequenceNumber={order.setCurrentUserSequenceNumber}
      />
    );
  }, [
    form,
    order,
    auth,
    ui,
    orderFlow,
    inputSectionAnimation,
    isTyping,
    currentQuestionAnimation,
    shakeAnimation,
    emotionAnimation,
    handlePaymentComplete,
  ]);
  
  // Render action button
  const renderActionButton = useCallback(() => {
    const canProceed = (() => {
      if (form.editingStep !== null) return true;
      switch (form.currentStep) {
        case 0: return form.address.trim().length >= 5;
        case 1: return form.selectedFoodType.length > 0;
        case 2: return true; // 过敏源是可选的，总是可以继续
        case 3: return true; // 口味偏好是可选的，总是可以继续  
        case 4: return false; // Handled by DeliveryTimeStep
        case 5: return form.budget.trim().length > 0;
        case 6: return false;
        default: return false;
      }
    })();
    
    return (
      <FormActionButtonContainer
        editingStep={form.editingStep}
        currentStep={form.currentStep}
        budget={form.budget}
        address={form.address}
        canProceed={canProceed}
        handleFinishEditing={() => form.setEditingStep(null)}
        handleAddressConfirm={() => form.setIsAddressConfirmed(true)}
        handleNext={() => {
          // 在进入下一步之前，确保答案被保存
          if (form.currentStep === 0 && form.address.trim()) {
            // 保存地址答案
            const addressAnswer = {
              type: 'address',
              value: form.address,
              suggestion: form.selectedAddressSuggestion
            };
            form.setCompletedAnswers(prev => ({
              ...prev,
              [0]: addressAnswer
            }));
          } else if (form.currentStep === 1 && form.selectedFoodType.length > 0) {
            // 保存食物类型答案
            const foodAnswer = {
              type: 'foodType',
              value: form.selectedFoodType
            };
            form.setCompletedAnswers(prev => ({
              ...prev,
              [1]: foodAnswer
            }));
          } else if (form.currentStep === 2) {
            // 保存过敏源答案（即使为空）
            const allergyAnswer = {
              type: 'allergy',
              value: form.selectedAllergies.length > 0 ? form.selectedAllergies : ['无忌口'],
              otherText: form.otherAllergyText
            };
            form.setCompletedAnswers(prev => ({
              ...prev,
              [2]: allergyAnswer
            }));
          } else if (form.currentStep === 3) {
            // 保存口味偏好答案（即使为空）
            const preferenceAnswer = {
              type: 'preference',
              value: form.selectedPreferences.length > 0 ? form.selectedPreferences : ['随便'],
              otherText: form.otherPreferenceText
            };
            form.setCompletedAnswers(prev => ({
              ...prev,
              [3]: preferenceAnswer
            }));
          } else if (form.currentStep === 5 && form.budget.trim()) {
            // 保存预算答案
            const budgetAnswer = {
              type: 'budget',
              value: form.budget
            };
            form.setCompletedAnswers(prev => ({
              ...prev,
              [5]: budgetAnswer
            }));
          }
          
          // 然后进入下一步
          handleStepProgression(form.currentStep);
        }}
        inputSectionAnimation={inputSectionAnimation}
      />
    );
  }, [form, handleStepProgression, inputSectionAnimation]);
  
  // Effect to show input section after typing completes
  React.useEffect(() => {
    if (displayedText && !isTyping && form.editingStep === null) {
      showInputSection();
    }
  }, [displayedText, isTyping, form.editingStep, showInputSection]);
  
  // Render completed questions
  const renderCompletedQuestions = useMemo(() => {
    return Object.keys(form.completedAnswers)
      .filter(key => {
        const idx = parseInt(key);
        return idx >= 0 && 
               idx !== form.currentStep && 
               idx !== form.editingStep; // 隐藏正在编辑的问题
      })
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => {
        const idx = parseInt(key);
        return (
          <CompletedQuestion
            key={idx}
            index={idx}
            question={STEP_CONTENT[idx]?.message || ''}
            answer={form.completedAnswers[idx]}
            questionAnimation={questionAnimations[idx] || new Animated.Value(1)}
            answerAnimation={answerAnimations[idx] || new Animated.Value(1)}
            onEdit={() => form.setEditingStep(idx)}
            formatAnswerDisplay={formatAnswerDisplay}
            isEditing={false}
            canEdit={true}
          />
        );
      });
  }, [form.completedAnswers, form.currentStep, form.editingStep, form.setEditingStep, formatAnswerDisplay, questionAnimations, answerAnimations]);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Use WizardFlatList for proper layout like before */}
      <WizardFlatList
        questions={STEP_CONTENT.map((s) => ({ title: s.message }))}
        completed={Object.keys(form.completedAnswers)
          .filter((k) => {
            const idx = parseInt(k);
            return idx >= 0 && 
                   idx !== form.currentStep && 
                   idx !== form.editingStep; // 隐藏正在编辑的问题
          })
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((k) => {
            const idx = parseInt(k);
            return {
              index: idx,
              title: STEP_CONTENT[idx]?.message || '',
              summary: formatAnswerDisplay(form.completedAnswers[idx]),
            };
          })}
        currentCard={
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {/* Order message log - 已注释掉订单详情显示 */}
            {/* <OrderMessageLog messages={orderMessagesLog} /> */}
            
            <View style={{ flex: 1 }}>
              {!auth.isAuthenticated ? (
                <CurrentQuestion
                  displayedText={displayedText || (auth.authQuestionText || '手机号？')}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  cursorOpacity={cursorOpacity}
                  streamingOpacity={streamingOpacity}
                  isStreaming={isStreaming()}
                  inputError={ui.inputError}
                  currentStep={0}
                  currentQuestionAnimation={currentQuestionAnimation}
                  shakeAnimation={shakeAnimation}
                  emotionAnimation={emotionAnimation}
                >
                  <AuthComponent
                    onAuthSuccess={handleAuthSuccess}
                    onError={(error: string) => ui.setInputError(error)}
                    onQuestionChange={(q: string) => auth.setAuthQuestionText(q)}
                    animationValue={inputSectionAnimation}
                    validatePhoneNumber={validatePhoneNumber}
                    triggerShake={triggerShake}
                    changeEmotion={changeEmotion}
                    resetTrigger={auth.authResetTrigger}
                  />
                </CurrentQuestion>
              ) : (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  cursorOpacity={cursorOpacity}
                  streamingOpacity={streamingOpacity}
                  isStreaming={isStreaming()}
                  inputError={ui.inputError}
                  currentStep={form.currentStep}
                  currentQuestionAnimation={currentQuestionAnimation}
                  shakeAnimation={shakeAnimation}
                  emotionAnimation={emotionAnimation}
                >
                  <View>
                    {renderCurrentInput()}
                    <Animated.View
                      style={{
                        opacity: inputSectionAnimation,
                        transform: [{
                          translateY: inputSectionAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20, 0],
                          })
                        }],
                      }}
                    >
                      {renderActionButton()}
                    </Animated.View>
                  </View>
                </CurrentQuestion>
              )}
            </View>
          </View>
        }
        onEdit={(idx) => handleEditQuestion(idx)}
      />
    </View>
  );
});

QuestionWizard.displayName = 'QuestionWizard';

export default QuestionWizard;