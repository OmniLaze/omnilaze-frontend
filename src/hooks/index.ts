import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { TIMING, VALIDATION } from '../constants';
import type { ValidationResult } from '../types';

// ========== Typewriter Effect ==========
export const useTypewriterEffect = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const showCursor = true;
  const [cursorOpacity] = useState(new Animated.Value(1));
  const [streamingOpacity] = useState(new Animated.Value(0));
  const rafRef = useRef<number | null>(null);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    const breathe = () => {
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 600, useNativeDriver: true })
      ]).start(() => { if (!isStreamingRef.current) breathe(); });
    };
    breathe();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cursorOpacity]);

  const triggerStreamingEffect = () => {
    streamingOpacity.setValue(0);
    Animated.timing(streamingOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  };

  const typeText = (text: string, opts: { instant?: boolean; onComplete?: () => void; append?: boolean; speed?: number } = {}) => {
    if (opts.instant || !text) { isStreamingRef.current = false; setIsTyping(false); setDisplayedText(text || ''); opts.onComplete?.(); return; }
    isStreamingRef.current = true; setIsTyping(true);
    if (!opts.append) { setDisplayedText(''); triggerStreamingEffect(); }
    const target = opts.append ? displayedText + text : text;
    let i = opts.append ? displayedText.length : 0;
    const step = (now: number, last: number, delay: number) => {
      if (i >= target.length) { isStreamingRef.current = false; setIsTyping(false); opts.onComplete?.(); return; }
      if (now - last >= delay) {
        setDisplayedText(target.substring(0, i + 1));
        i++;
        delay = opts.speed ?? TIMING.TYPING_SPEED;
        last = now;
      }
      rafRef.current = requestAnimationFrame((t) => step(t, last, delay));
    };
    rafRef.current = requestAnimationFrame((t) => step(t, performance.now(), opts.speed ?? TIMING.TYPING_SPEED));
  };

  const appendText = (t: string) => typeText(t, { append: true });
  const setTextDirectly = (t: string) => { if (rafRef.current) cancelAnimationFrame(rafRef.current); isStreamingRef.current = false; setIsTyping(false); setDisplayedText(t); };
  const clearText = () => setTextDirectly('');
  const pauseStreaming = () => { if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; } };
  const resumeStreaming = () => {};
  const isStreaming = () => isStreamingRef.current;

  return { displayedText, isTyping, showCursor, cursorOpacity, streamingOpacity, typeText, appendText, setTextDirectly, clearText, pauseStreaming, resumeStreaming, isStreaming };
};

// ========== Validation ==========
export const useValidation = () => {
  const [inputError, setInputError] = useState('');
  const validatePhoneNumber = (phone: string): boolean => VALIDATION.PHONE_REGEX.test(phone);
  const validateInput = (step: number, value: any): ValidationResult => {
    setInputError('');
    switch (step) {
      case 0: if (!value || value.trim().length < VALIDATION.MIN_ADDRESS_LENGTH) { const m = '请输入完整的配送地址'; setInputError(m); return { isValid: false, errorMessage: m }; } return { isValid: true };
      case 1: if (!value || value === '未选择' || (Array.isArray(value) && value.length === 0)) { const m = '请选择食物类型'; setInputError(m); return { isValid: false, errorMessage: m }; } return { isValid: true };
      case 2:
      case 3: return { isValid: true };
      case 4: if (!value || value === '') { const m = '请选择用餐时间'; setInputError(m); return { isValid: false, errorMessage: m }; } return { isValid: true };
      case 5: { const n = parseFloat(value); if (!value || n <= 0) { const m = '请设置一个合理的预算金额'; setInputError(m); return { isValid: false, errorMessage: m }; } if (n < VALIDATION.MIN_BUDGET) { const m = '预算至少需要10元哦'; setInputError(m); return { isValid: false, errorMessage: m }; } return { isValid: true }; }
      case 6: return { isValid: true };
      default: return { isValid: true };
    }
  };
  return { inputError, validateInput, validatePhoneNumber, setInputError };
};

// ========== Animations ==========
export const useAnimations = () => {
  const [questionAnimations] = useState(() => Array.from({ length: 7 }, () => new Animated.Value(1)));
  const [answerAnimations] = useState(() => Array.from({ length: 7 }, () => new Animated.Value(0)));
  const [currentQuestionAnimation] = useState(new Animated.Value(0));
  const [mapAnimation] = useState(new Animated.Value(0));
  const [emotionAnimation] = useState(new Animated.Value(1));
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [inputSectionAnimation] = useState(new Animated.Value(0));
  const [themeAnimation] = useState(new Animated.Value(0));

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
    ]).start();
  };

  const changeEmotion = (_: string, cb?: () => void) => {
    Animated.sequence([
      Animated.timing(emotionAnimation, { toValue: 0.5, duration: TIMING.EMOTION_DURATION, useNativeDriver: false }),
      Animated.timing(emotionAnimation, { toValue: 1, duration: TIMING.EMOTION_DURATION, useNativeDriver: false }),
    ]).start(() => cb?.());
  };

  const triggerQuestionFlowAnimation = (cb?: () => void) => { cb?.(); };

  return { questionAnimations, answerAnimations, currentQuestionAnimation, mapAnimation, emotionAnimation, shakeAnimation, inputSectionAnimation, themeAnimation, triggerShake, changeEmotion, triggerQuestionFlowAnimation };
};

// ========== Re-exports ==========
export { useAppState } from './useAppState';
export { useFormSteps } from './useFormSteps';
export { useOrderManagement } from './useOrderManagement';

// ========== New Exports ==========
export { useScrollManager } from './useScrollManager';
export { useAnimationManager } from './useAnimationManager';
export { useQuestionFlow } from './useQuestionFlow';
export { useOrderFlow } from './useOrderFlow';
export * from './usePerformanceOptimization';

// ========== Order Sync Utilities ==========
export { 
  orderSyncManager, 
  useOrderSync,
  handlePaymentStatusChange,
  handleOrderStatusChange,
  handleDeliveryStatusChange 
} from '../utils/orderSyncManager';
