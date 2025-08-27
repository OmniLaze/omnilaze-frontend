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
        handleDeliveryTimeConfirm={() => {}}
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
        case 2: return form.selectedAllergies.length > 0;
        case 3: return form.selectedPreferences.length > 0;
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
        handleNext={() => handleStepProgression(form.currentStep)}
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
      .filter(key => parseInt(key) >= 0 && parseInt(key) !== form.currentStep)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(key => {
        const idx = parseInt(key);
        return (
          <CompletedQuestion
            key={idx}
            index={idx}
            question={STEP_CONTENT[idx]?.message || ''}
            answer={formatAnswerDisplay(form.completedAnswers[idx])}
            onEdit={() => form.setEditingStep(idx)}
            animation={answerAnimations[idx]}
            theme={theme}
          />
        );
      });
  }, [form.completedAnswers, form.currentStep, formatAnswerDisplay, answerAnimations, theme]);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Order message log */}
      <OrderMessageLog messages={orderMessagesLog} />
      
      {/* Completed questions */}
      <Animated.View
        style={{
          transform: [{ translateY: completedQuestionsOffset }],
        }}
      >
        {renderCompletedQuestions}
      </Animated.View>
      
      {/* Current question */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
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
  );
});

QuestionWizard.displayName = 'QuestionWizard';

export default QuestionWizard;