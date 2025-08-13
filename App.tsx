import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  View,
  Animated,
  TouchableOpacity,
  Text,
  Dimensions,
  Easing,
  StyleSheet,
} from 'react-native';

const { height, width } = Dimensions.get('window');

// 导入全局CSS样式来移除焦点边框
// Only load global CSS on web to avoid accessing document in native
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('./src/styles/global.css');
}

// Components
import { ProgressSteps } from './src/components/ProgressSteps';
import { MobileHeader } from './src/components/MobileHeader';
import { CompletedQuestion } from './src/components/CompletedQuestion';
import { CurrentQuestion } from './src/components/CurrentQuestion';
import { AuthComponent } from './src/components/AuthComponent';
import { UserMenu } from './src/components/UserMenu';
import { InviteModalWithFreeDrink } from './src/components/InviteModalWithFreeDrink';
import { FormInputContainer, FormActionButtonContainer } from './src/components/FormContainers';
import ColorPalette from './src/components/ColorPalette';
import { OrderHistorySidebar } from './src/components/OrderHistorySidebar';
import { convertToChineseDisplay } from './src/data/checkboxOptions';

// API Services
import { checkPreferencesCompleteness, getPreferencesAsFormData } from './src/services/api';

// Utils
import { CookieManager } from './src/utils/cookieManager';

// Hooks
import { 
  useTypewriterEffect, 
  useValidation, 
  useAnimations,
  useAppState,
  useFormSteps,
  useOrderManagement
} from './src/hooks';
import { ColorThemeProvider, useTheme } from './src/contexts/ColorThemeContext';

// Data & Types
import { STEP_CONTENT } from './src/data/stepContent';
import type { AuthResult } from './src/types';

// Styles
import { createGlobalStyles, rightContentStyles, createProgressStyles, createQuestionStyles, createAvatarStyles, createAnswerStyles } from './src/styles/globalStyles';
import { TIMING, DEV_CONFIG } from './src/constants';

function OmnilazeAppContent() {
  // 修复React Native Web字体缩放问题 + 移动端强制适配
  useEffect(() => {
    // Guard against non-web environments where document/window don't exist
    if (Platform.OS !== 'web') {
      return;
    }
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }
    try {
      // 1. 强制viewport设置
        const existingViewport = document.querySelector('meta[name="viewport"]');
        if (existingViewport) {
          existingViewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
          );
        }
      
      // 2. 检测移动设备
      const isMobileDevice = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768 ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
      };

      // 3. 强制移动端布局适配
      if (isMobileDevice()) {
        document.documentElement.classList.add('force-mobile');
        document.body.classList.add('force-mobile-layout');
        
        // 添加移动端专用CSS规则
        const mobileStyle = document.createElement('style');
        mobileStyle.id = 'mobile-adaptation';
        mobileStyle.textContent = `
          html.force-mobile, body.force-mobile-layout {
            width: 100vw !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          
          .force-mobile-layout * {
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          
          /* 强制移动端字体大小 */
          .force-mobile div[style*="font-size: 20px"] { font-size: 17px !important; }
          .force-mobile div[style*="font-size: 24px"] { font-size: 17px !important; }
          .force-mobile div[style*="font-size: 28px"] { font-size: 19px !important; }
          
          /* 移动端触摸优化 */
          .force-mobile-layout {
            -webkit-touch-callout: none;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
        `;
        
        // 移除旧的样式，添加新的
        const oldStyle = document.getElementById('mobile-adaptation');
        if (oldStyle) oldStyle.remove();
        document.head.appendChild(mobileStyle);
      }
      
      // 4. 强制设置文本大小调整
      document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
      document.documentElement.style.setProperty('-moz-text-size-adjust', '100%', 'important');  
      document.documentElement.style.setProperty('text-size-adjust', '100%', 'important');
      document.body.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
      document.body.style.setProperty('-moz-text-size-adjust', '100%', 'important');
      document.body.style.setProperty('text-size-adjust', '100%', 'important');
      
      // 5. 监听窗口大小变化
      const handleResize = () => {
        if (window.innerWidth <= 768) {
          document.body.classList.add('force-mobile-layout');
        } else {
          document.body.classList.remove('force-mobile-layout');
        }
      };

      window.addEventListener('resize', handleResize);
      
      console.log('🔧 已应用移动端强制适配 + 字体缩放修复');
      
      return () => window.removeEventListener('resize', handleResize);
    } catch (err) {
      console.warn('Web adaptation skipped due to missing browser APIs:', err);
    }
  }, []);

  // 使用状态管理hook
  const appState = useAppState();
  
  // 颜色主题hook
  const { 
    theme, 
    themeState, 
    isDebugMode, 
    updatePrimaryColor, 
    updateBackgroundColor, 
    updateAllColors,
    updateTextColors,
    updatePrimaryOpacity, 
    updateBackgroundOpacity, 
    toggleDebugMode 
  } = useTheme();
  
  // 创建动态样式
  const globalStyles = createGlobalStyles(theme);
  const progressStyles = createProgressStyles(theme);
  const questionStyles = createQuestionStyles(theme);
  const avatarStyles = createAvatarStyles(theme);
  const answerStyles = createAnswerStyles(theme);
  
  // 解构需要的状态和函数
  const {
    // 认证状态
    isAuthenticated, setIsAuthenticated,
    authResult, setAuthResult,
    authQuestionText, setAuthQuestionText,
    isStateRestored,
    authResetTrigger, setAuthResetTrigger,
    
    // 表单状态
    address, budget, deliveryTime, selectedAllergies, selectedPreferences, selectedFoodType,
    otherAllergyText, otherPreferenceText, showMap, isAddressConfirmed,
    selectedAddressSuggestion, currentStep, completedAnswers, editingStep,
    originalAnswerBeforeEdit, currentOrderId, currentOrderNumber,
    currentUserSequenceNumber, isOrderSubmitting, isSearchingRestaurant,
    isOrderCompleted, orderMessage, isFreeOrder, showFreeDrinkModal,
    isQuickOrderMode, completedQuestionsOffset, currentPushOffset,
    
    // 状态设置函数
    setAddress, setBudget, setDeliveryTime, setSelectedAllergies, setSelectedPreferences,
    setSelectedFoodType, setOtherAllergyText, setOtherPreferenceText,
    setShowMap, setIsAddressConfirmed, setSelectedAddressSuggestion,
    setCurrentStep, setCompletedAnswers, setEditingStep,
    setOriginalAnswerBeforeEdit, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    setIsOrderCompleted, setOrderMessage, setIsFreeOrder, setShowFreeDrinkModal,
    setIsQuickOrderMode, setCompletedQuestionsOffset, setCurrentPushOffset,
    
    // 工具函数
    resetAllState
  } = appState;

  // 移动端专用状态：用于步骤变化动画
  const [previousStep, setPreviousStep] = useState<number | undefined>(undefined);
  
  // 订单历史侧边栏状态
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  
  // 新增订单处理
  const handleNewOrder = useCallback(() => {
    // 保留之前的表单数据，只跳到时间选择步骤
    setIsOrderCompleted(false);
    setOrderMessage('');
    setEditingStep(null);
    setCurrentStep(4); // 直接跳到时间选择步骤
    setDeliveryTime(''); // 清空时间选择
    
    // 保持已填写的答案
    if (authResult) {
      const currentAnswers = { ...completedAnswers };
      // 移除时间和预算的答案，让用户重新选择
      delete currentAnswers[4]; // 时间
      delete currentAnswers[5]; // 预算
      setCompletedAnswers(currentAnswers);
    }
  }, [authResult, completedAnswers, setCompletedAnswers, setCurrentStep, setIsOrderCompleted, setOrderMessage, setEditingStep, setDeliveryTime]);
  
  // 打开订单历史
  const handleOpenOrderHistory = useCallback(() => {
    setShowOrderHistory(true);
  }, []);
  
  // 关闭订单历史
  const handleCloseOrderHistory = useCallback(() => {
    setShowOrderHistory(false);
  }, []);

  // 包装setCurrentStep以支持移动端动画
  const updateCurrentStep = (newStep: number) => {
    setPreviousStep(currentStep);
    setCurrentStep(newStep);
  };

  // 获取移动端头部标题
  const getStepTitle = (step: number) => {
    const titles = ['配送地址', '食物类型', '忌口说明', '口味偏好', '用餐时间', '预算设置'];
    // 步骤0: 配送地址
    // 步骤1: 食物类型
    // 步骤2: 忌口说明
    // 步骤3: 口味偏好  
    // 步骤4: 用餐时间
    // 步骤5: 预算设置
    return titles[step] || '懒得点外卖';
  };

  // Custom hooks - AI流式打字机效果
  const { 
    displayedText, 
    isTyping, 
    showCursor, 
    cursorOpacity, 
    streamingOpacity,
    typeText, 
    setTextDirectly, 
    clearText,
    isStreaming 
  } = useTypewriterEffect();
  const { inputError, validateInput, validatePhoneNumber, setInputError } = useValidation();
  const { 
    questionAnimations,
    answerAnimations, 
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    triggerShake,
    changeEmotion,
    triggerQuestionFlowAnimation
  } = useAnimations();
  
  // 移除流动动画状态管理
  const [completedQuestionsHeight, setCompletedQuestionsHeight] = useState(300);
  const [singleQuestionHeight, setSingleQuestionHeight] = useState(80);
  
  // 动画系统所需的 refs - 移除不再需要的 refs
  // 移除重复的 scrollViewRef 声明，使用下面的那个
  
  // 移除位置测量辅助函数 - 已不再需要飞行动画
  
  // 🔧 优化：使用 useMemo 避免每次渲染创建新对象
  const effectiveCompletedAnswers = useMemo(() => {
    return { ...completedAnswers };
  }, [completedAnswers]);

  // 🔧 优化：使用 useMemo 缓存动态计算的高度和滚动位置
  const scrollDimensions = useMemo(() => {
    const pageHeight = height - 60; // 减少当前页高度，配合更薄的移动端头部
    const bufferContainerHeight = 300; // 缓冲容器高度，更新为和实际容器一致
    const SNAP_THRESHOLD = 200; // 使用单个问题高度作为吸附阈值
    const FOCUS_HYSTERESIS = 60; // 焦点切换滞后，避免在中间抖动
    
    // 🎯 当前问题页位置调整 - 包含缓冲容器偏移
    const CURRENT_PAGE_OFFSET = 167; // 向上偏移167px，让当前问题页不那么靠上
    const getCurrentPagePosition = () => bufferContainerHeight + completedQuestionsHeight - CURRENT_PAGE_OFFSET;
    
    // 🔥 修正：限制滚动范围，只允许在两个容器间滚动  
    const maxScrollPosition = getCurrentPagePosition(); // 最大滚动到当前问题页面位置
    const minScrollPosition = 0; // 最小滚动位置，允许看到缓冲区内容
    const dynamicContentHeight = Math.max(maxScrollPosition + pageHeight, bufferContainerHeight + completedQuestionsHeight + pageHeight);
    
    return {
      pageHeight,
      bufferContainerHeight,
      SNAP_THRESHOLD,
      FOCUS_HYSTERESIS,
      CURRENT_PAGE_OFFSET,
      getCurrentPagePosition,
      maxScrollPosition,
      minScrollPosition,
      dynamicContentHeight
    };
  }, [height, completedQuestionsHeight]);

  // 移除不再使用的流动函数
  
  // 监听已完成问题区域高度变化，更新滚动系统
  useEffect(() => {
    // 当已完成问题区域高度变化时，更新动态内容高度
    // console.log('📏 已完成问题区域高度更新:', completedQuestionsHeight);
  }, [completedQuestionsHeight]);
  
  // 强制重置订单状态（临时调试用）
  const resetOrderState = () => {
    console.log('🔧 重置订单状态');
    setIsOrderCompleted(false);
    setOrderMessage('');
    setIsSearchingRestaurant(false);
    
    // 重置到有效的步骤范围
    if (currentStep >= STEP_CONTENT.length) {
      setCurrentStep(0);
      console.log('🔧 重置步骤到0');
    }
    
    clearText();
    inputSectionAnimation.setValue(1);
    
    // 强制触发问题显示
    setTimeout(() => {
      const validStep = currentStep >= STEP_CONTENT.length ? 0 : currentStep;
      if (isAuthenticated && validStep < STEP_CONTENT.length) {
        const stepData = formSteps.getCurrentStepData();
        if (stepData) {
          handleQuestionTransition(stepData.message, false);
        }
      }
    }, 100);
  };

  // 强制重置和重新显示当前问题（用于调试）
  const forceRefreshCurrentQuestion = () => {
    // 清空打字机文本
    clearText();
    // 重置输入框动画
    inputSectionAnimation.setValue(0);
    // 重置问题动画
    currentQuestionAnimation.setValue(1);
    
    // 延迟100ms后重新触发问题显示
    setTimeout(() => {
      if (isAuthenticated && currentStep < STEP_CONTENT.length && !isOrderCompleted) {
        const stepData = formSteps.getCurrentStepData();
        if (stepData) {
          console.log('🔧 强制刷新问题:', stepData.message);
          handleQuestionTransition(stepData.message, false);
        }
      }
    }, 100);
  };
  
  // 确保输入框在非订单完成状态下显示
  useEffect(() => {
    // 如果不是订单完成状态，且有文本显示，确保输入框也显示
    if (!isOrderCompleted && displayedText && !isTyping && editingStep === null) {
      const currentInputValue: number = (inputSectionAnimation as any)?.__getValue?.() ?? 0;
      
      if (currentInputValue !== 1) {
        inputSectionAnimation.setValue(1);
      }
    }
  }, [displayedText, isTyping, isOrderCompleted, editingStep]);

  // 页面刷新时的状态恢复
  useEffect(() => {
    if (isStateRestored && Object.keys(completedAnswers).length > 0) {
      // 如果订单已完成，不需要强制刷新问题
      if (isOrderCompleted && orderMessage) {
        return;
      }
      
      // 🔧 修复：完全移除强制刷新逻辑，避免与编辑模式冲突
      // 现在主 useEffect 已经能够正确处理所有问题显示场景
      console.log('📍 页面状态已恢复，依靠主 useEffect 处理问题显示');
    }
  }, [isStateRestored]);
  
  // 🔧 优化：使用 useCallback 稳定函数引用，避免子组件不必要的重渲染
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
    
    // 🔧 生产环境关闭调试日志
    if (process.env.NODE_ENV === 'development') {
      console.log('📝 handleAnswerSubmission 开始:', { stepIndex, answer, currentStep, isEditing });
    }
    
    // 统一验证
    if (!validateInput(stepIndex, answer?.value).isValid) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ 验证失败, 触发震动');
      }
      triggerShake();
      return false;
    }

    // 表情变化（除非是编辑模式）
    if (!isEditing) {
      changeEmotion('🎉');
    }
    
    // 1. 立即更新数据
    if (process.env.NODE_ENV === 'development') {
      console.log('💾 保存答案到 completedAnswers[' + stepIndex + ']:', answer);
    }
    setCompletedAnswers(prev => ({
      ...prev,
      [stepIndex]: answer
    }));
    
    // 2. 确保问题和答案立即可见
    if (stepIndex >= 0) {
      questionAnimations[stepIndex].setValue(1);
      answerAnimations[stepIndex].setValue(1);
    }
    
    // 3. 如果不跳过动画且不是编辑模式，执行上推动画
    if (!skipAnimation && !isEditing) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎬 开始上推动画，为下一个问题腾出空间');
      }
      const pushUpDistance = singleQuestionHeight + 10; // 上推一个问题的高度加上间距
      const newPushOffset = currentPushOffset + pushUpDistance;
      
      Animated.timing(completedQuestionsOffset, {
        toValue: (completedQuestionsOffset as any)?.__getValue?.() - pushUpDistance,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad)
      }).start(() => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ 上推动画完成');
        }
      });
      
      // 🔥 关键：同步更新推动偏移跟踪状态
      setCurrentPushOffset(newPushOffset);
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 更新推动偏移:', newPushOffset);
      }
    }
    
    // 4. 执行完成回调
    if (process.env.NODE_ENV === 'development') {
      console.log('⏰ 设置100ms延迟后执行onComplete回调');
    }
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎯 执行onComplete回调');
      }
      onComplete?.();
    }, 100);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ handleAnswerSubmission 完成，返回 true');
    }
    return true;
  }, [validateInput, triggerShake, changeEmotion, setCompletedAnswers, questionAnimations, answerAnimations, singleQuestionHeight, currentPushOffset, completedQuestionsOffset, setCurrentPushOffset, currentStep]);

  // 移除页面状态管理，改为流动式布局

  // 🔧 优化：使用 useCallback 稳定函数引用 - AI流式问题过渡函数
  const handleQuestionTransition = useCallback((questionText: string, hasUserInput: boolean = false) => {
    // 重置动画状态，避免冲突
    inputSectionAnimation.setValue(1); // 直接设置为1，确保输入框可见
    currentQuestionAnimation.setValue(1);
    
    if (!hasUserInput) {
      // 无用户输入：使用AI流式打字机效果
      typeText(questionText, { 
        instant: false,
        streaming: true,
        onComplete: () => {
          // 打字完成后，确保输入框可见
          inputSectionAnimation.setValue(1);
        }
      });
    } else {
      // 有用户输入：直接显示文本，确保输入框可见
      setTextDirectly(questionText);
      // 确保输入框可见
      inputSectionAnimation.setValue(1);
    }
  }, [inputSectionAnimation, currentQuestionAnimation, typeText, setTextDirectly]);

  // 🔧 优化：使用 useCallback 稳定函数引用
  const handleStepProgression = useCallback((currentStepIndex: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 handleStepProgression 被调用:', { currentStepIndex, currentStep });
      console.log('📊 当前状态:', {
        completedAnswersKeys: Object.keys(completedAnswers),
        displayedText: displayedText ? displayedText.substring(0, 30) + '...' : 'null',
        isTyping
      });
    }
    
    // 立即推进，无延迟
    let nextStep = currentStepIndex + 1;
    
    // 特殊步骤逻辑
    if (currentStepIndex === 1) {
      const isSelectedDrink = selectedFoodType.includes('drink');
      if (isSelectedDrink) {
        // 不论免单还是普通模式，选择奶茶都跳到预算步骤
        nextStep = 4;
        if (process.env.NODE_ENV === 'development') {
          console.log('🥤 检测到选择奶茶，跳转到预算步骤');
        }
      }
    }
    
    // 免单模式在预算步骤后结束流程
    if (isFreeOrder && currentStepIndex === 4) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🆓 免单流程完成，不再推进步骤');
      }
      return;
    }
    
    if (nextStep < STEP_CONTENT.length) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 步骤推进:', currentStepIndex, '->', nextStep);
        console.log('📝 当前displayedText:', displayedText ? displayedText.substring(0, 30) + '...' : 'null');
      }
      
      // 🔑 新的修复方案：立即清空文本并更新步骤，然后强制显示新问题
      console.log('🧹 立即清空文本');
      clearText();
      
      console.log('✏️ 立即更新步骤到:', nextStep);
      setCurrentStep(nextStep);
      
      // 强制在下一个事件循环中显示新问题，不依赖useEffect
      setTimeout(() => {
        console.log('💡 强制显示新问题');
        const stepData = STEP_CONTENT[nextStep];
        if (stepData) {
          console.log('🎯 直接调用handleQuestionTransition:', stepData.message);
          // 🔧 编辑模式修复：检查当前步骤是否有答案，如果有答案则认为有用户输入
          const hasUserInput = !!completedAnswers[nextStep];
          console.log('📋 检查用户输入状态:', { nextStep, hasUserInput, hasAnswer: !!completedAnswers[nextStep] });
          handleQuestionTransition(stepData.message, hasUserInput);
        }
      }, 10); // 很短的延迟，确保状态更新完成
      
    } else {
      console.log('🏁 已到达最后步骤，无法继续推进');
    }
  }, [currentStep, selectedFoodType, isFreeOrder, completedAnswers, displayedText, isTyping, clearText, setCurrentStep, handleQuestionTransition, STEP_CONTENT]);
  
  // 表单步骤管理hook
  const formSteps = useFormSteps({
    // 状态值
    address, budget, deliveryTime, selectedAllergies, selectedPreferences, selectedFoodType,
    otherAllergyText, otherPreferenceText, currentStep, editingStep, completedAnswers,
    originalAnswerBeforeEdit, isFreeOrder, isAddressConfirmed, showMap,
    selectedAddressSuggestion, isAuthenticated, authQuestionText,
    
    // 状态设置函数
    setAddress, setBudget, setDeliveryTime, setSelectedAllergies, setSelectedPreferences, setSelectedFoodType,
    setOtherAllergyText, setOtherPreferenceText, setCurrentStep, setCompletedAnswers,
    setEditingStep, setOriginalAnswerBeforeEdit, setIsAddressConfirmed, setShowMap,
    setSelectedAddressSuggestion, setCurrentOrderId, setCurrentOrderNumber,
    setCurrentUserSequenceNumber, setIsOrderSubmitting, setIsSearchingRestaurant,
    
    // 动画值
    mapAnimation, answerAnimations,
    
    // 统一管理函数
    handleAnswerSubmission, handleStepProgression,
    
    // 验证和动画函数
    validateInput, triggerShake, changeEmotion
  });
  
  // 订单管理hook
  const orderManagement = useOrderManagement({
    authResult, address, deliveryTime, selectedAllergies, selectedPreferences, budget,
    selectedFoodType, isFreeOrder, currentUserSequenceNumber,
    otherAllergyText, otherPreferenceText, selectedAddressSuggestion,
    setCurrentOrderId, setCurrentOrderNumber, setCurrentUserSequenceNumber,
    setIsOrderSubmitting, setIsSearchingRestaurant, setIsOrderCompleted,
    setCurrentStep, setCompletedAnswers, setInputError, setOrderMessage,
    triggerShake, changeEmotion, typeText
  });
  
  // ===========================================
  // 免单状态统一管理
  // ===========================================
  
  // 免单状态重置函数
  const resetFreeOrderState = () => {
    setIsFreeOrder(false);
    setShowFreeDrinkModal(false);
  };

  // 免单流程自动化处理
  useEffect(() => {
    if (isFreeOrder && currentStep === 1 && editingStep === null) {
      // 在食物类型步骤自动推进（已选择奶茶）- 减少延迟
      const timer = setTimeout(() => {
        formSteps.handleNext();
      }, 1000); // 减少到1秒，减少等待时间和潜在的时序冲突
      return () => clearTimeout(timer);
    }
  }, [isFreeOrder, currentStep, editingStep]);

  // 快速订单模式状态管理
  useEffect(() => {
    if (isQuickOrderMode && currentStep === 4 && isAuthenticated && !isOrderCompleted && !isSearchingRestaurant) {
      console.log('=== 快速订单模式激活 ===', {
        currentStep,
        isAuthenticated,
        completedAnswersKeys: Object.keys(completedAnswers),
        budget
      });
      
      // 触发预算步骤的问题显示
      const timer = setTimeout(() => {
        handleQuestionTransition('好的，这一顿打算花多少钱？', !!budget.trim());
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isQuickOrderMode, currentStep, isAuthenticated, isOrderCompleted, isSearchingRestaurant]);

  // 测量已完成问题容器高度
  const measureCompletedQuestionsHeight = (event?: any) => {
    if (event && event.nativeEvent) {
      const { height: measuredHeight } = event.nativeEvent.layout;
      console.log('已完成问题容器高度:', measuredHeight);
      // 修复：直接使用测量的高度，不重复添加 padding
      // padding 应该通过 CSS 样式来控制，而不是在这里累积
      setCompletedQuestionsHeight(measuredHeight);
    }
  };

  // 测量单个问题组件高度
  const measureSingleQuestionHeight = (event?: any) => {
    if (event && event.nativeEvent) {
      const { height } = event.nativeEvent.layout;
      console.log('单个问题组件高度:', height);
      setSingleQuestionHeight(height); // 保存测量到的高度
    }
  };


  // ===========================================
  // 免单状态管理结束
  // ==========================================

  // 🔧 优化：使用 useCallback 稳定函数引用
  const handleLogout = useCallback(() => {
    CookieManager.clearUserSession();
    CookieManager.clearConversationState();
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_id');
      localStorage.removeItem('phone_number');
    }
    
    resetAllState();
    resetFreeOrderState(); // 使用统一的免单重置
    setInputError('');
    clearText(); // 使用简化的清空函数
    
    // 重置动画到初始状态  
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);
    
    setAuthResetTrigger(prev => prev + 1);
    
    // 重置滚动位置到当前问题页面 - 使用动态计算
    const currentPagePos = scrollDimensions.getCurrentPagePosition();
    scrollViewRef.current?.scrollTo({
      y: currentPagePos,
      animated: false,
    });
    scrollPosition.setValue(currentPagePos);
    setFocusMode('current');
    saveFocusMode('current');
  }, [resetAllState, setInputError, clearText, inputSectionAnimation, currentQuestionAnimation, setAuthResetTrigger, scrollDimensions]);

  // 🔧 优化：使用 useCallback 稳定函数引用
  const handleInvite = useCallback(() => {
    setShowFreeDrinkModal(true);
  }, [setShowFreeDrinkModal]);

  // 🔧 优化：使用 useCallback 稳定函数引用
  const handleFreeDrinkClaim = useCallback(() => {
    setShowFreeDrinkModal(false);
    setIsFreeOrder(true);
    setSelectedFoodType(['drink']); // 免单只能选奶茶
    setBudget('0'); // 立即设置预算为0
    setCurrentStep(0); // 重新开始流程
    setEditingStep(null);
    setCompletedAnswers({});
  }, [setShowFreeDrinkModal, setIsFreeOrder, setSelectedFoodType, setBudget, setCurrentStep, setEditingStep, setCompletedAnswers]);

  // 移除ScrollView引用，不再需要
  
  // focusMode状态管理：保存到cookie
  const [focusMode, setFocusMode] = useState<'current' | 'completed'>(() => {
    // 页面加载时从localStorage恢复focusMode，默认为current
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('omnilaze_focus_mode');
        return saved === 'completed' ? 'completed' : 'current';
      } catch (error) {
        console.log('读取focusMode失败:', error);
        return 'current';
      }
    }
    return 'current';
  });
  
  // 保存focusMode到localStorage
  const saveFocusMode = (mode: 'current' | 'completed') => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('omnilaze_focus_mode', mode);
        console.log('focusMode已保存:', mode);
      } catch (error) {
        console.log('保存focusMode失败:', error);
      }
    }
  };
  
  // 连续滚动状态管理
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = useState(new Animated.Value(0));
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasInitializedScroll, setHasInitializedScroll] = useState(false);
  
  // 滚动阈值和页面高度 - 基于动态内容高度
  const pageHeight = scrollDimensions.pageHeight;
  const bufferContainerHeight = scrollDimensions.bufferContainerHeight;
  const SNAP_THRESHOLD = scrollDimensions.SNAP_THRESHOLD;
  const FOCUS_HYSTERESIS = scrollDimensions.FOCUS_HYSTERESIS;
  const getCurrentPagePosition = scrollDimensions.getCurrentPagePosition;
  const maxScrollPosition = scrollDimensions.maxScrollPosition;
  const minScrollPosition = scrollDimensions.minScrollPosition;
  const dynamicContentHeight = scrollDimensions.dynamicContentHeight;
  
  // 当前滚动进度 (1 = 已完成问题页面在焦点, 0 = 当前问题页面在焦点)
  // 基于两个容器间的滚动范围计算
  // 🔧 优化：使用 useMemo 缓存滚动进度插值
  const scrollProgress = useMemo(() => {
    return scrollPosition.interpolate({
      inputRange: [bufferContainerHeight, getCurrentPagePosition()], // 从已完成问题页面顶部到当前问题页面
      outputRange: [1, 0], // 在已完成问题页面时为1，在当前问题页面时为0
      extrapolate: 'clamp',
    });
  }, [scrollPosition, bufferContainerHeight, getCurrentPagePosition]);

  // 基于 focusMode 的页面不透明度，避免空白缓冲容器影响视觉弱化判断
  // 🔧 优化：使用 useMemo 缓存页面透明度值
  const pageOpacity = useMemo(() => ({
    completedPageOpacity: focusMode === 'completed' ? 1 : 0.4,
    currentPageOpacity: focusMode === 'current' ? 1 : 0.4
  }), [focusMode]);
  
  // 滚动处理函数
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollPosition.setValue(offsetY);
    
    // 动态焦点态判断：仅在两页之间切换，忽略空白缓冲容器
    const completedPagePosition = bufferContainerHeight;
    const currentPagePosition = getCurrentPagePosition();
    const midPoint = (completedPagePosition + currentPagePosition) / 3;
    let nextMode: 'current' | 'completed' = focusMode;
    
    if (focusMode === 'current') {
      // 仅当滚动明显靠近已完成页时才切换，且需要有已完成答案
      if (offsetY < midPoint - FOCUS_HYSTERESIS && Object.keys(completedAnswers).length > 0) {
        nextMode = 'completed';
      }
    } else {
      // 从已完成页回到当前页需超过滞后阈值
      if (offsetY > midPoint + FOCUS_HYSTERESIS) {
        nextMode = 'current';
      }
    }
    
    if (nextMode !== focusMode) {
      setFocusMode(nextMode);
      saveFocusMode(nextMode);
    }
    
    // 添加调试日志，每100px输出一次
    if (offsetY % 100 < 5) {
      console.log('📜 滚动中:', { 
        offsetY: Math.round(offsetY),
        maxScroll: Math.round(dynamicContentHeight - height),
        isAtTop: offsetY < 10,
        isAtBottom: offsetY > (dynamicContentHeight - height - 10)
      });
    }
  };
  
  // 滚动结束时的自动吸附 - 只在已完成问题页面和当前问题页面之间切换
  const handleScrollEnd = (event: any) => {
    setIsScrolling(false);
    const offsetY = event.nativeEvent.contentOffset.y;
    
    console.log('🔍 滚动结束，开始吸附判断:', { 
      offsetY,
      bufferContainerHeight,
      completedQuestionsHeight,
      dynamicContentHeight
    });
    
    // 定义两个吸附位置：
    // 1. 已完成问题页面顶部（跳过空白缓冲区）
    const completedPagePosition = bufferContainerHeight;
    // 2. 当前问题页面位置
    const currentPagePosition = getCurrentPagePosition();
    
    console.log('📍 吸附位置计算:', {
      completedPagePosition,
      currentPagePosition,
      getCurrentPagePositionCalc: `${bufferContainerHeight} + ${completedQuestionsHeight} - ${scrollDimensions.CURRENT_PAGE_OFFSET} = ${currentPagePosition}`
    });
    
    // 计算中点，用于判断吸附方向
    const midPoint = (completedPagePosition + currentPagePosition) / 2;
    
    let targetOffset;
    let targetMode;
    
    // 移动端：只在接近某一页时才吸附，避免频繁抖动
    if (Platform.OS !== 'web') {
      const nearCompleted = Math.abs(offsetY - completedPagePosition) <= 60;
      const nearCurrent = Math.abs(offsetY - currentPagePosition) <= 60;
      if (nearCompleted && !nearCurrent) {
        targetOffset = completedPagePosition;
        targetMode = 'completed';
        setFocusMode('completed');
        saveFocusMode('completed');
      } else if (nearCurrent && !nearCompleted) {
        targetOffset = currentPagePosition;
        targetMode = 'current';
        setFocusMode('current');
        saveFocusMode('current');
      } else {
        // 离任意页面较远或两者都很近：不吸附
        console.log('⏭ 移动端：离目标较远或模棱两可，不执行吸附');
        return;
      }
    } else {
      // 网页端保持原先中点吸附逻辑
      if (offsetY < midPoint) {
        targetOffset = completedPagePosition;
        targetMode = 'completed';
        setFocusMode('completed');
        saveFocusMode('completed');
      } else {
        targetOffset = currentPagePosition;
        targetMode = 'current';
        setFocusMode('current');
        saveFocusMode('current');
      }
    }
    
    console.log('🎯 吸附决策:', { 
      offsetY, 
      midPoint,
      targetOffset,
      targetMode,
      willSnap: Math.abs(offsetY - targetOffset) > 10 ? 'YES' : 'NO'
    });
    
    // 仅在需要时触发吸附滚动
    const distance = Math.abs(offsetY - targetOffset);
    const snapThreshold = Platform.OS === 'web' ? 10 : 40; // 移动端阈值更大，避免频繁轻微吸附

    console.log('🧮 吸附距离与阈值:', { distance, snapThreshold, platform: Platform.OS });

    if (distance > snapThreshold) {
      scrollViewRef.current?.scrollTo({
        y: targetOffset,
        animated: true,
      });
    } else {
      console.log('⏭ 跳过吸附（距离过小）');
    }
  };
  
  // 程序化切换页面
  const scrollToPage = (page: 'current' | 'completed') => {
    const targetOffset = page === 'completed' ? bufferContainerHeight : getCurrentPagePosition();
    scrollViewRef.current?.scrollTo({
      y: targetOffset,
      animated: true,
    });
    setFocusMode(page);
    saveFocusMode(page);
  };

  
  // 处理聚焦切换手势 - 更新为滚动版本
  const handleFocusGesture = (direction: 'up' | 'down') => {
    if (direction === 'up' && focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
      scrollToPage('completed');
    } 
    else if (direction === 'down' && focusMode === 'completed') {
      scrollToPage('current');
    }
  };
  
  // 程序初始化滚加在正确的页面
  useEffect(() => {
    if (!isStateRestored || hasInitializedScroll) return;
    
    // 等待打字机效果和其他初始化完成后再设置滚动位置
    // 避免在打字机效果期间触发滚动导致闪烁
    if (isTyping) return; // 如果正在打字，等待完成
    
    // 页面刷新后，默认显示当前问题页面，除非用户明确保存了completed视图
    let initialOffset;
    if (focusMode === 'completed' && Object.keys(completedAnswers).length > 0) {
      // 只有在明确保存了completed模式且有已完成答案时，才显示已完成问题页面
      initialOffset = bufferContainerHeight; // 滚动到已完成问题页面顶部，跳过缓冲区
    } else {
      // 其他情况都显示当前问题页面
      initialOffset = getCurrentPagePosition();
      // 只在需要时更新focusMode，避免不必要的状态变更
      if (focusMode !== 'current') {
        setFocusMode('current');
        saveFocusMode('current');
      }
    }
    
    console.log('📍 初始化滚动位置:', { 
      focusMode, 
      initialOffset, 
      completedQuestionsHeight,
      currentPagePosition: getCurrentPagePosition(),
      completedAnswersCount: Object.keys(completedAnswers).length,
      isTyping
    });
    
    // 延迟设置初始位置，确保 ScrollView 已经渲染且打字机效果稳定
    const timeoutId = setTimeout(() => {
      // 再次检查是否还在打字，避免干扰打字机效果
      if (!isTyping) {
        scrollViewRef.current?.scrollTo({
          y: initialOffset,
          animated: true, // 使用自然的滑动动画
        });
        scrollPosition.setValue(initialOffset);
        setHasInitializedScroll(true); // 标记已初始化，防止重复
      }
    }, isTyping ? 500 : 200); // 如果正在打字，等待更长时间
    
    return () => clearTimeout(timeoutId);
  }, [isStateRestored, completedQuestionsHeight, isTyping]);

  // AI流式问题过渡函数 - 更丝滑的现代效果
  // 防止动画冲突的状态
  const [isInputAnimating, setIsInputAnimating] = useState(false);
  
  // 🔧 优化：使用 useCallback 稳定函数引用
  const animateInputSection = useCallback((toValue: number, duration: number = 300) => {
    if (isInputAnimating) return; // 防止冲突
    
    setIsInputAnimating(true);
    Animated.timing(inputSectionAnimation, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(() => {
      setIsInputAnimating(false);
    });
  }, [isInputAnimating, inputSectionAnimation]);

  // 🔧 优化：使用 useCallback 稳定函数引用
  const handleAuthSuccess = useCallback(async (result: AuthResult) => {
    // 如果这只是手机号验证步骤，只处理答案动画，不完成认证
    if (result.isPhoneVerificationStep) {
      const phoneAnswer = { type: 'phone', value: result.phoneNumber };
      
      // 手机号作为答案，触发答案动画
      await handleAnswerSubmission(-1, phoneAnswer, { 
        isEditing: false, 
        skipAnimation: false,
        onComplete: () => {
          // 答案动画完成后，这里不需要做其他事情，验证码问题会自动显示
        }
      });
      
      return; // 提前返回，不执行完整的认证流程
    }
    
    setIsAuthenticated(true);
    setAuthResult(result);
    
    CookieManager.clearConversationState();
    CookieManager.saveUserSession(result.userId!, result.phoneNumber, result.isNewUser || false);
    
    if (result.userId && Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem('user_id', result.userId);
      localStorage.setItem('phone_number', result.phoneNumber);
    }
    
    const phoneAnswer = { type: 'phone', value: result.phoneNumber };
    
    // 检查用户偏好以决定是否启用快速下单
    try {
      if (result.userId && !result.isNewUser) {
        // 仅对老用户检查偏好
        const preferencesCheck = await checkPreferencesCompleteness(result.userId);
        
        if (preferencesCheck.success && preferencesCheck.can_quick_order) {
          // 用户有完整偏好，可以快速下单
          console.log('🚀 启用快速下单模式');
          
          // 获取偏好数据并填充表单
          const formDataResponse = await getPreferencesAsFormData(result.userId);
          
          if (formDataResponse.success && formDataResponse.has_preferences) {
            const formData = formDataResponse.form_data;
            
            // 自动填充所有表单数据
            setAddress(formData.address);
            setSelectedFoodType(formData.selectedFoodType);
            setSelectedAllergies(formData.selectedAllergies);
            setSelectedPreferences(formData.selectedPreferences);
            setBudget(formData.budget);
            setOtherAllergyText(formData.otherAllergyText || '');
            setOtherPreferenceText(formData.otherPreferenceText || '');
            setSelectedAddressSuggestion(formData.selectedAddressSuggestion);
            
            // 标记前面步骤为已完成，但不包括预算步骤
            const completedAnswers = {
              [-1]: { type: 'phone' as const, value: result.phoneNumber },
              [0]: { type: 'address' as const, value: formData.address },
              [1]: { type: 'foodType' as const, value: convertToChineseDisplay(formData.selectedFoodType) },
              [2]: { type: 'allergy' as const, value: convertToChineseDisplay(formData.selectedAllergies) },
              [3]: { type: 'preference' as const, value: convertToChineseDisplay(formData.selectedPreferences) }
              // 不包括预算步骤，让用户在预算步骤手动确认
            };
            
            // 显式清除步骤4及之后的答案，确保预算步骤显示
            const currentCompletedAnswers: any = { ...completedAnswers };
            delete currentCompletedAnswers[4];
            delete currentCompletedAnswers[5];
            
            // 批量状态更新
            setCompletedAnswers(currentCompletedAnswers);
            
            // 确保对应的答案动画设置为可见状态
            Object.keys(currentCompletedAnswers).forEach(key => {
              const index = parseInt(key);
              if (index >= 0 && index < answerAnimations.length) {
                answerAnimations[index].setValue(1);
              }
            });
            
            setIsQuickOrderMode(true); // 设置快速下单模式
            setIsOrderCompleted(false);
            setIsSearchingRestaurant(false);
            setCurrentStep(4); // 跳到预算步骤（第4步）
            
            return;
          }
        }
      }
    } catch (error) {
      console.warn('检查用户偏好时出错，使用常规流程:', error);
    }
    
    // 常规流程：新用户或没有完整偏好的老用户
    await handleAnswerSubmission(-1, phoneAnswer, {
      skipAnimation: true, // 认证不需要动画
      onComplete: () => {
        // 立即推进到第一步，无延迟
        setCurrentStep(0);
      }
    });
  }, [
    handleAnswerSubmission, setIsAuthenticated, setAuthResult, setAddress, 
    setSelectedFoodType, setSelectedAllergies, setSelectedPreferences, setBudget,
    setOtherAllergyText, setOtherPreferenceText, setSelectedAddressSuggestion,
    setCompletedAnswers, answerAnimations, setIsQuickOrderMode, 
    setIsOrderCompleted, setIsSearchingRestaurant, setCurrentStep
  ]);

  // 当打字机效果完成后显示输入框 - 立即触发版本
  useEffect(() => {
    if (displayedText && !isTyping && editingStep === null) {
      // 读取当前动画值（避免直接访问私有属性）
      const currentInputValue: number = (inputSectionAnimation as any)?.__getValue?.() ?? 0;
      if (currentInputValue === 0) {
        // 打字机完成后立即显示输入框，使用统一的动画函数
        animateInputSection(1, 250);
      }
    }
  }, [displayedText, isTyping, editingStep]);

  // 不再需要初始化动画，问题直接显示在顶部

  // Effects - 统一的打字机效果管理
  useEffect(() => {
    console.log('🔍 主useEffect触发:', {
      isStateRestored,
      currentStep,
      editingStep,
      isAuthenticated,
      isOrderCompleted,
      displayedText: displayedText ? displayedText.substring(0, 20) + '...' : 'null',
      isTyping,
      completedAnswersForCurrentStep: completedAnswers[currentStep] ? '已存在' : '不存在'
    });

    if (!isStateRestored) return;
    
    // 修复步骤超出范围的问题
    if (currentStep >= STEP_CONTENT.length && !isOrderCompleted) {
      console.log('🔧 步骤超出范围，重置到最后一个有效步骤');
      setCurrentStep(STEP_CONTENT.length - 1);
      return;
    }
    
    // 如果订单已完成且有订单消息，优先显示订单消息，不再显示其他问题
    if (isOrderCompleted && orderMessage) {
      if (!displayedText || displayedText !== orderMessage) {
        console.log('📝 显示订单消息:', orderMessage);
        setTextDirectly(orderMessage);
      }
      return; // 重要：订单完成后直接返回，不再执行后续逻辑
    }
    
    // 未认证状态 - 显示认证问题
    if (editingStep === null && !isAuthenticated && !isTyping && !displayedText) {
      console.log('🔐 显示认证问题:', authQuestionText);
      handleQuestionTransition(authQuestionText);
      return;
    }
    
    // 已认证状态 - 显示表单问题（但如果订单已完成则不显示）
    const shouldShowQuestion = (
      editingStep === null && 
      isAuthenticated && 
      !isOrderCompleted && // 新增：订单完成后不再显示问题
      currentStep < STEP_CONTENT.length && 
      !completedAnswers[currentStep] && 
      !isTyping && 
      !displayedText
    );
    
    console.log('🔍 检查是否应该显示问题:', {
      shouldShowQuestion,
      editingStep: editingStep,
      isAuthenticated,
      isOrderCompleted, // 新增日志
      currentStepValid: currentStep < STEP_CONTENT.length,
      currentStep,
      stepContentLength: STEP_CONTENT.length,
      hasCompletedAnswerForCurrentStep: !!completedAnswers[currentStep],
      completedAnswerForCurrentStep: completedAnswers[currentStep],
      isTyping,
      displayedTextLength: displayedText?.length || 0,
      displayedText: displayedText ? displayedText.substring(0, 20) + '...' : 'null'
    });
    
    if (shouldShowQuestion) {
      const stepData = formSteps.getCurrentStepData();
      
      // 统一检查用户输入状态
      let hasUserInput = false;
      switch (stepData.inputType) {
        case 'address':
          hasUserInput = !!address.trim();
          break;
        case 'foodType':
          hasUserInput = selectedFoodType.length > 0;
          break;
        case 'allergy':
          hasUserInput = selectedAllergies.length > 0;
          break;
        case 'preference':
          hasUserInput = selectedPreferences.length > 0;
          break;
        case 'budget':
          hasUserInput = !!budget.trim();
          break;
      }
      
      console.log('💡 满足显示条件，显示问题:', stepData.message, 'hasUserInput:', hasUserInput);
      handleQuestionTransition(stepData.message, hasUserInput);
    } else {
      console.log('❌ 不满足显示条件，跳过问题显示');
    }
  }, [currentStep, editingStep, isAuthenticated, authQuestionText, isStateRestored, isFreeOrder, orderMessage, isOrderCompleted, address, selectedAllergies, selectedPreferences, budget, selectedFoodType]);

  // 专门监听displayedText变化的useEffect，用于调试
  useEffect(() => {
    console.log('📝 displayedText 发生变化:', {
      displayedText: displayedText ? displayedText.substring(0, 30) + '...' : 'null',
      length: displayedText?.length || 0,
      isEmpty: !displayedText,
      isTyping
    });
    
    // 如果文本被清空且不在打字状态，尝试触发主useEffect重新检查
    if (!displayedText && !isTyping && isStateRestored && isAuthenticated) {
      console.log('🔄 文本已清空，主useEffect应该重新检查显示条件');
    }
  }, [displayedText, isTyping]);

  // 编辑模式效果 - 使用统一的问题管理
  useEffect(() => {
    if (editingStep !== null && isStateRestored) {
      const stepData = STEP_CONTENT[editingStep];
      if (stepData) {
        handleQuestionTransition(stepData.message, true); // 编辑模式总是有用户输入
        // 编辑模式时，直接滚动到当前问题页面
        scrollToPage('current');
      }
    }
  }, [editingStep, isStateRestored]);

  // 确保已完成答案的动画状态正确设置
  useEffect(() => {
    if (!isStateRestored) return;
    
    // 当completedAnswers变化时，确保对应的answerAnimations设置为1
    Object.keys(completedAnswers).forEach(key => {
      const index = parseInt(key);
      if (index >= 0 && index < answerAnimations.length) {
        answerAnimations[index].setValue(1);
      }
    });
  }, [completedAnswers, isStateRestored]);

  // 页面刷新后编辑状态恢复逻辑
  useEffect(() => {
    if (!isStateRestored || editingStep === null) return;
    
    // 如果页面刷新后检测到有编辑状态，需要恢复编辑模式的具体值
    const answerToEdit = completedAnswers[editingStep];
    if (answerToEdit) {
      console.log('页面刷新后恢复编辑状态:', { editingStep, answerToEdit });
      
      // 如果没有 originalAnswerBeforeEdit，设置为当前答案
      if (!originalAnswerBeforeEdit) {
        setOriginalAnswerBeforeEdit(answerToEdit);
        console.log('设置编辑前原始答案:', answerToEdit);
      }
      
      // 针对地址编辑的特殊处理
      if (answerToEdit.type === 'address') {
        // 确保地址处于可编辑状态
        setIsAddressConfirmed(false);
        setShowMap(false);
        console.log('地址编辑状态恢复: isAddressConfirmed设置为false');
      }
      
      // 确保当前步骤正确
      if (currentStep !== editingStep) {
        setCurrentStep(editingStep);
        console.log('恢复编辑步骤:', editingStep);
      }
    }
  }, [isStateRestored, editingStep, completedAnswers, originalAnswerBeforeEdit]); // 监听状态恢复和编辑状态

  // 移除自动切换回当前问题的逻辑 - 只有用户手动下滑才切换

  // 鉴权问题文本变化回调
  const handleAuthQuestionChange = (question: string) => {
    setAuthQuestionText(question);
  };
  
  // 鉴权错误回调
  const handleAuthError = (error: string) => {
    setInputError(error);
  };

  // 处理偏好编辑
  const handleEditPreferences = () => {
    setIsQuickOrderMode(false);
    setCurrentStep(0); // 重新开始表单流程
    
    // 保留用户数据，但让用户可以编辑
    const phoneAnswer = { type: 'phone' as const, value: authResult?.phoneNumber || '' };
    setCompletedAnswers({ [-1]: phoneAnswer });
  };

  // Render current step input
  const renderCurrentInput = () => {
    const stepData = editingStep !== null ? STEP_CONTENT[editingStep] : formSteps.getCurrentStepData();
    
    return (
      <FormInputContainer
        stepData={stepData}
        editingStep={editingStep}
        currentStep={currentStep}
        address={address}
        budget={budget}
        deliveryTime={deliveryTime}
        selectedAllergies={selectedAllergies}
        selectedPreferences={selectedPreferences}
        selectedFoodType={selectedFoodType}
        otherAllergyText={otherAllergyText}
        otherPreferenceText={otherPreferenceText}
        isAddressConfirmed={isAddressConfirmed}
        isFreeOrder={isFreeOrder}
        handleAddressChange={formSteps.handleAddressChange}
        handleSelectAddress={formSteps.handleSelectAddress}
        handleDeliveryTimeConfirm={formSteps.handleDeliveryTimeConfirm}
        setBudget={setBudget}
        setSelectedAllergies={setSelectedAllergies}
        setSelectedPreferences={setSelectedPreferences}
        setSelectedFoodType={setSelectedFoodType}
        setOtherAllergyText={setOtherAllergyText}
        setOtherPreferenceText={setOtherPreferenceText}
        handleFinishEditing={formSteps.handleFinishEditing}
        handleConfirmOrder={orderManagement.handleConfirmOrder}
        inputSectionAnimation={inputSectionAnimation}
        inputError={inputError}
        isTyping={isTyping}
        renderActionButton={renderActionButton}
      />
    );
  };

  const renderActionButton = () => {
    return (
      <FormActionButtonContainer
        editingStep={editingStep}
        currentStep={currentStep}
        budget={budget}
        address={address}
        canProceed={formSteps.canProceed()}
        handleFinishEditing={formSteps.handleFinishEditing}
        handleCancelEditing={formSteps.handleCancelEditing}
        handleAddressConfirm={formSteps.handleAddressConfirm}
        handleNext={formSteps.handleNext}
        inputSectionAnimation={inputSectionAnimation}
      />
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[globalStyles.container, { backgroundColor: theme.BACKGROUND }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={theme.BACKGROUND} />
      
      {/* 移除全局动画层 - 已不再需要飞行动画 */}
      
      {/* 用户菜单 - 仅网页端显示，移动端使用MobileHeader */}
      {isAuthenticated && (
        <UserMenu
          isVisible={Platform.OS === 'web' && width > 768}
          onLogout={handleLogout}
          onInvite={handleInvite}
          phoneNumber={authResult?.phoneNumber || ''}
        />
      )}
      
      
      {/* 订单历史侧边栏 */}
      {isAuthenticated && (
        <OrderHistorySidebar
          isVisible={showOrderHistory}
          onClose={handleCloseOrderHistory}
          userId={authResult?.userId || null}
        />
      )}
      
      {/* 邀请免单弹窗 */}
      {authResult && (
        <InviteModalWithFreeDrink
          isVisible={showFreeDrinkModal}
          onClose={() => setShowFreeDrinkModal(false)}
          onFreeDrinkClaim={handleFreeDrinkClaim}
          userPhoneNumber={authResult.phoneNumber}
          userId={authResult.userId!}
        />
      )}
      
      {/* 进度条 - 仅网页端显示，移动端完全不显示 */}
      {isAuthenticated && Platform.OS === 'web' && (
        <ProgressSteps 
          currentStep={currentStep}
        />
      )}  

      {/* 移动端头部 - 头像、标题、手机尾号、进度条 */}
      {isAuthenticated && (
        <MobileHeader
          title={getStepTitle(currentStep)}
          phoneNumber={authResult?.phoneNumber}
          emotionAnimation={emotionAnimation}
          onMenuPress={() => setShowFreeDrinkModal(true)}
          onLogout={handleLogout}
          onInvite={handleInvite} // 🔧 修正：使用正确的handleInvite函数
          onHistoryPress={handleOpenOrderHistory}
          onNewOrderPress={handleNewOrder}
          currentStep={currentStep}
          previousStep={previousStep}
        />
      )}

      {/* 连续滚动容器 - 新的滚动体验 */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={Platform.OS === 'web' ? { height: dynamicContentHeight } : undefined}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        bounces={false} // 禁用弹性滚动，避免超出边界
        decelerationRate={0.92} // 调整减速率，让滚动停止更快，吸附更明显
        // 暂时移除snapToOffsets，使用自定义吸附逻辑
      >
        {/* ========== 空白缓冲容器（仅网页端） ========== */}
        {Platform.OS === 'web' && (
          <Animated.View 
            style={[
              {
                height: 300,
                backgroundColor: theme.BACKGROUND,
                transform: [{ translateY: completedQuestionsOffset }]
              }
            ]}
          />
        )}

        {/* ========== 已完成问题页面（动态高度） ========== */}
        <Animated.View 
          style={[
            {
              minHeight: 200,
              paddingTop: Platform.OS === 'web' ? 100 : 16,
              paddingHorizontal: 16,
              paddingBottom: 20,
              justifyContent: 'flex-start',
              backgroundColor: theme.BACKGROUND,
              ...(Platform.OS === 'web' ? { transform: [{ translateY: completedQuestionsOffset }] } : {}),
            }
          ]}
          onLayout={measureCompletedQuestionsHeight}
        >
          <View 
            style={{
              width: '100%',
              maxWidth: 500,
              alignSelf: 'center',
              flex: 1,
            }}>
            {/* Debug log: rendering completed questions */}
            {/* 已完成问题区域 */}
            {/* 显示有效的已完成问题，包括已安定的过渡问题 */}
            {Object.keys(effectiveCompletedAnswers).length > 0 && (
              <>
                {/* 已完成问题列表 */}
                {Object.keys(effectiveCompletedAnswers)
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((stepIndex) => {
                    const index = parseInt(stepIndex);
                    const answer = effectiveCompletedAnswers[index];
                    
                    // 移除过渡问题检查逻辑
                    
                    // 为手机号问题（index: -1）提供特殊处理
                    const questionText = index === -1 ? 
                      '你的手机号码是多少？' : 
                      STEP_CONTENT[index]?.message || '';
                    
                    return (
                      <Animated.View
                        key={index}
                        onLayout={(event) => {
                          // 测量每个已完成问题的实际位置，用于流动动画目标位置计算
                          if (index === Object.keys(effectiveCompletedAnswers).length - 1) {
                            const { height } = event.nativeEvent.layout;
                            setSingleQuestionHeight(height + 16); // 包括margin
                            console.log('📏 测量到单个问题高度:', height + 16);
                          }
                        }}
                        style={{
                          // 动态调节内容颜色 - 已完成问题页面的透明度
                          opacity: pageOpacity.completedPageOpacity,
                        }}
                      >
                        <CompletedQuestion
                          question={questionText}
                          answer={answer}
                          index={index}
                          questionAnimation={index >= 0 ? (questionAnimations[index] || new Animated.Value(1)) : new Animated.Value(1)}
                          answerAnimation={index >= 0 ? (answerAnimations[index] || new Animated.Value(1)) : new Animated.Value(1)}
                          onEdit={() => formSteps.handleEditAnswer(index)}
                          formatAnswerDisplay={formSteps.formatAnswerDisplay}
                          isEditing={false} // 已完成问题区域不显示编辑表单
                          canEdit={index >= 0 && (isQuickOrderMode || !(isOrderCompleted && index === 4))}
                        />
                      </Animated.View>
                    );
                  })}
              </>
            )}
          </View>
        </Animated.View>

        {/* ========== 当前问题页面（紧贴已完成问题） ========== */}
        <Animated.View 
          style={[
            {
              ...(Platform.OS === 'web' ? { height: pageHeight, paddingTop: 1 } : { paddingTop: 12 }),
              paddingHorizontal: 16,
              paddingBottom: 40,
              justifyContent: 'flex-start',
              backgroundColor: theme.BACKGROUND,
              ...(Platform.OS === 'web' ? { transform: [{ translateY: completedQuestionsOffset }] } : {}),
            }
          ]}
        >
          <View style={{
            width: '100%',
            maxWidth: 500,
            alignSelf: 'center',
            flex: 1,
          }}>
            {/* 当前问题内容 */}
            <Animated.View
              style={{
                flex: 1,
                // 动态调节内容颜色 - 当前问题页面的透明度
                opacity: pageOpacity.currentPageOpacity,
                // 动画期间稍微降低透明度，提供视觉反馈
                // Note: movingQuestion removed as flow animation system was simplified
              }}
            >
              {/* 未认证状态 - 显示认证组件 */}
              {!isAuthenticated && (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  cursorOpacity={cursorOpacity}
                  streamingOpacity={streamingOpacity}
                  isStreaming={isStreaming()}
                  inputError={inputError}
                  currentStep={0}
                  currentQuestionAnimation={currentQuestionAnimation}
                  shakeAnimation={shakeAnimation}
                  emotionAnimation={emotionAnimation}
                >
                  <AuthComponent
                    onAuthSuccess={handleAuthSuccess}
                    onError={handleAuthError}
                    onQuestionChange={handleAuthQuestionChange}
                    animationValue={inputSectionAnimation}
                    validatePhoneNumber={validatePhoneNumber}
                    triggerShake={triggerShake}
                    changeEmotion={changeEmotion}
                    resetTrigger={authResetTrigger}
                  />
                </CurrentQuestion>
              )}

              {/* Current Question - 正常流程、搜索状态、订单完成状态显示 */}
              {isAuthenticated && editingStep === null && (
                // 如果正在搜索餐厅或订单已完成，只显示相应文本，不显示其他内容
                (isSearchingRestaurant || isOrderCompleted) ? (
                  <CurrentQuestion
                    displayedText={displayedText}
                    isTyping={isTyping}
                    showCursor={showCursor}
                    cursorOpacity={cursorOpacity}
                    streamingOpacity={streamingOpacity}
                    isStreaming={isStreaming()}
                    inputError={inputError}
                    currentStep={currentStep}
                    currentQuestionAnimation={currentQuestionAnimation}
                    shakeAnimation={shakeAnimation}
                    emotionAnimation={emotionAnimation}
                  >
                    {/* 搜索状态或订单完成状态时不显示任何输入组件或按钮 */}
                  </CurrentQuestion>
                ) : (
                  (currentStep < STEP_CONTENT.length && !completedAnswers[currentStep]) && (
                    <CurrentQuestion
                      displayedText={displayedText}
                      isTyping={isTyping}
                      showCursor={showCursor}
                      cursorOpacity={cursorOpacity}
                      streamingOpacity={streamingOpacity}
                      isStreaming={isStreaming()}
                      inputError={inputError}
                      currentStep={editingStep !== null ? editingStep : currentStep}
                      currentQuestionAnimation={currentQuestionAnimation}
                      shakeAnimation={shakeAnimation}
                      emotionAnimation={emotionAnimation}
                    >
                      {/* Input Section */}
                      {renderCurrentInput()}

                      {/* Action Button 在输入组件出现后再显示 */}
                      <Animated.View style={{
                        opacity: inputSectionAnimation,
                        transform: [{
                          translateY: inputSectionAnimation.interpolate({ inputRange: [0,1], outputRange: [100,0] })
                        }]
                      }}>
                        {renderActionButton()}
                      </Animated.View>
                    </CurrentQuestion>
                  )
                )
              )}

              {/* 编辑模式 - 当有编辑步骤时显示 */}
              {editingStep !== null && (
                <CurrentQuestion
                  displayedText={displayedText}
                  isTyping={isTyping}
                  showCursor={showCursor}
                  cursorOpacity={cursorOpacity}
                  streamingOpacity={streamingOpacity}
                  isStreaming={isStreaming()}
                  inputError={inputError}
                  currentStep={editingStep}
                  currentQuestionAnimation={currentQuestionAnimation}
                  shakeAnimation={shakeAnimation}
                  emotionAnimation={emotionAnimation}
                >
                  {/* Input Section */}
                  {renderCurrentInput()}

                  {/* Action Button 在输入组件出现后再显示 */}
                  <Animated.View style={{
                    opacity: inputSectionAnimation,
                    transform: [{ translateY: inputSectionAnimation.interpolate({ inputRange: [0,1], outputRange: [10,0] }) }]
                  }}>
                    {renderActionButton()}
                  </Animated.View>
                </CurrentQuestion>
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* 移除过渡问题组件 - 不再需要动画渲染 */}

      {/* 调色板调试工具 */}
      {DEV_CONFIG.ENABLE_COLOR_PALETTE && isDebugMode && (
        <ColorPalette
          primaryColor={theme.PRIMARY}
          backgroundColor={theme.BACKGROUND}
          primaryOpacity={themeState.opacity.primary}
          backgroundOpacity={themeState.opacity.background}
          onPrimaryColorChange={updatePrimaryColor}
          onBackgroundColorChange={updateBackgroundColor}
          onPrimaryOpacityChange={updatePrimaryOpacity}
          onBackgroundOpacityChange={updateBackgroundOpacity}
          onTextColorsChange={updateTextColors}
          onAllColorsChange={(colors) => updateAllColors(colors)}
          onClose={() => toggleDebugMode()}
        />
      )}

      {/* 调色板开关按钮 */}
      {DEV_CONFIG.ENABLE_COLOR_PALETTE && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: theme.PRIMARY,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
            zIndex: isDebugMode ? 999 : 1001,
          }}
          onPress={toggleDebugMode}
        >
          <Text style={{ color: 'white', fontSize: 24 }}>🎨</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

export default function OmnilazeApp() {
  return (
    <ColorThemeProvider>
      <OmnilazeAppContent />
    </ColorThemeProvider>
  );
}