import { useState, useRef, useEffect } from 'react';
import { Animated, Dimensions } from 'react-native';
import { TIMING, VALIDATION } from '../constants';
import type { Answer, ValidationResult } from '../types';

const { height } = Dimensions.get('window');

// 流式打字机效果 - 模拟现代AI流式传输
export const useTypewriterEffect = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [cursorOpacity] = useState(new Animated.Value(1));
  const [streamingOpacity] = useState(new Animated.Value(0)); // 流式文本渐入效果
  const lastTextRef = useRef<string>('');
  const currentAnimationRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const textChunks = useRef<string[]>([]);
  const isStreamingRef = useRef(false);

  // 智能呼吸式光标动画 - 更自然的AI光标效果
  const startCursorAnimation = () => {
    const breathe = () => {
      Animated.sequence([
        Animated.timing(cursorOpacity, {
          toValue: 0.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(cursorOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (showCursor && !isStreamingRef.current) {
          breathe();
        }
      });
    };
    breathe();
  };

  // 流式文本渐入动画
  const triggerStreamingEffect = () => {
    streamingOpacity.setValue(0);
    Animated.timing(streamingOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (showCursor) {
      startCursorAnimation();
    }
    return () => {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop();
      }
    };
  }, [showCursor]);

  // AI流式输出速度计算 - 更真实的流式传输效果
  const calculateStreamingSpeed = (char: string, index: number, totalLength: number, isChunkEnd: boolean = false) => {
    const ultraFast = 8;     // 极快模式 - 模拟AI模型输出token
    const fast = 15;         // 快速模式
    const normal = 25;       // 正常模式
    const slow = 45;         // 思考模式
    const pause = 120;       // 标点停顿
    
    // 标点符号后的自然停顿
    if (['。', '？', '！'].includes(char)) {
      return pause;
    }
    if (['，', '；', '：'].includes(char)) {
      return pause * 0.6;
    }
    
    // 模拟AI token输出的批次效果
    if (isChunkEnd) {
      return slow; // 批次结束稍微停顿
    }
    
    // 句子开头的思考停顿
    if (index < 2) {
      return slow;
    }
    
    // 长句子中的自然节奏变化
    const progress = index / totalLength;
    if (progress < 0.3) {
      // 开始阶段：稍慢，模拟AI思考
      return Math.random() > 0.7 ? slow : normal;
    } else if (progress < 0.7) {
      // 中间阶段：加速，模拟AI确定
      return Math.random() > 0.8 ? normal : fast;
    } else {
      // 结尾阶段：很快，模拟AI完成
      return Math.random() > 0.9 ? fast : ultraFast;
    }
  };

  // AI流式输出效果 - 更真实的流式传输体验
  const typeText = (text: string, options: { instant?: boolean; onComplete?: () => void; streaming?: boolean } = {}) => {
    // 防止重复触发相同文本
    if (lastTextRef.current === text && displayedText === text && !options.instant) {
      options.onComplete?.();
      return;
    }
    
    lastTextRef.current = text;
    
    // 清除之前的动画
    if (currentAnimationRef.current) {
      currentAnimationRef.current.stop();
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // 即时显示模式
    if (options.instant || !text || text.length === 0) {
      isStreamingRef.current = false;
      setIsTyping(false);
      setDisplayedText(text || '');
      options.onComplete?.();
      return;
    }
    
    isStreamingRef.current = true;
    setIsTyping(true);
    setDisplayedText('');
    triggerStreamingEffect(); // 触发渐入效果
    
    // 将文本分割成AI token风格的块（模拟真实AI输出）
    const chunks = splitIntoAIChunks(text);
    textChunks.current = chunks;
    
    let chunkIndex = 0;
    let charIndex = 0;
    let currentChunk = '';
    let lastTime = performance.now();
    let nextCharTime = 0;
    let displayedChunks: string[] = [];
    
    const animate = (currentTime: number) => {
      // 检查是否完成所有块
      if (chunkIndex >= chunks.length) {
        isStreamingRef.current = false;
        setIsTyping(false);
        options.onComplete?.();
        return;
      }
      
      // 检查当前块是否完成
      if (charIndex >= chunks[chunkIndex].length) {
        displayedChunks.push(chunks[chunkIndex]);
        chunkIndex++;
        charIndex = 0;
        
        // 块间停顿，模拟AI处理间隔
        if (chunkIndex < chunks.length) {
          nextCharTime = Math.random() * 80 + 40; // 40-120ms随机停顿
          lastTime = currentTime;
        }
        
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      
      if (currentTime - lastTime >= nextCharTime) {
        currentChunk = chunks[chunkIndex];
        const char = currentChunk[charIndex];
        
        // 更新显示的文本
        const partialChunk = currentChunk.substring(0, charIndex + 1);
        const fullText = [...displayedChunks, partialChunk].join('');
        setDisplayedText(fullText);
        
        // 计算下一个字符的延迟
        const isChunkEnd = charIndex === currentChunk.length - 1;
        nextCharTime = calculateStreamingSpeed(char, charIndex, currentChunk.length, isChunkEnd);
        
        lastTime = currentTime;
        charIndex++;
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
  };
  
  // 将文本分割成AI风格的token块
  const splitIntoAIChunks = (text: string): string[] => {
    const chunks: string[] = [];
    const words = text.split('');
    let currentChunk = '';
    
    for (let i = 0; i < words.length; i++) {
      const char = words[i];
      currentChunk += char;
      
      // 根据字符类型决定块的大小
      const shouldEndChunk = 
        // 标点符号结束块
        ['。', '？', '！', '，', '；', '：'].includes(char) ||
        // 随机长度块 (2-6字符)
        (currentChunk.length >= 2 && Math.random() > 0.7) ||
        // 强制最大块大小
        currentChunk.length >= 6;
      
      if (shouldEndChunk || i === words.length - 1) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  };

  // 实时流式追加文本 - 模拟AI增量输出
  const appendText = (newText: string, options: { speed?: 'fast' | 'normal' | 'slow'; onComplete?: () => void } = {}) => {
    const currentText = displayedText;
    const fullText = currentText + newText;
    
    isStreamingRef.current = true;
    setIsTyping(true);
    
    // AI流式速度配置
    const speeds = {
      fast: { base: 12, variance: 8 },      // 12±8ms
      normal: { base: 25, variance: 15 },   // 25±15ms  
      slow: { base: 45, variance: 20 }      // 45±20ms
    };
    
    const speedConfig = speeds[options.speed || 'normal'];
    let currentIndex = currentText.length;
    let lastTime = performance.now();
    let nextCharTime = 0;
    
    const animate = (currentTime: number) => {
      if (currentIndex >= fullText.length) {
        isStreamingRef.current = false;
        setIsTyping(false);
        options.onComplete?.();
        return;
      }
      
      if (currentTime - lastTime >= nextCharTime) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        
        // 随机变化的速度，模拟AI处理的自然节奏
        const randomVariance = (Math.random() - 0.5) * speedConfig.variance;
        nextCharTime = speedConfig.base + randomVariance;
        
        lastTime = currentTime;
        currentIndex++;
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
  };

  // 直接设置文本（不使用打字机效果）
  const setTextDirectly = (text: string) => {
    if (currentAnimationRef.current) {
      currentAnimationRef.current.stop();
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    isStreamingRef.current = false;
    setIsTyping(false);
    setDisplayedText(text);
    lastTextRef.current = text;
  };

  // 清空文本
  const clearText = () => {
    if (currentAnimationRef.current) {
      currentAnimationRef.current.stop();
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    isStreamingRef.current = false;
    setIsTyping(false);
    setDisplayedText('');
    lastTextRef.current = '';
    textChunks.current = [];
  };

  // 暂停/恢复流式输出
  const pauseStreaming = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const resumeStreaming = () => {
    if (isStreamingRef.current && lastTextRef.current && displayedText.length < lastTextRef.current.length) {
      typeText(lastTextRef.current);
    }
  };

  // 检查是否正在流式输出
  const isStreaming = () => isStreamingRef.current;

  // 清理函数
  useEffect(() => {
    return () => {
      if (currentAnimationRef.current) {
        currentAnimationRef.current.stop();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    displayedText,
    isTyping,
    showCursor,
    cursorOpacity,
    streamingOpacity,
    typeText,
    appendText,
    setTextDirectly,
    clearText,
    pauseStreaming,
    resumeStreaming,
    isStreaming,
  };
};

export const useValidation = () => {
  const [inputError, setInputError] = useState('');

  const validatePhoneNumber = (phone: string): boolean => {
    return VALIDATION.PHONE_REGEX.test(phone);
  };

  const validateInput = (step: number, value: any): ValidationResult => {
    setInputError('');
    
    switch (step) {
      case 0: // 地址
        if (!value || value.trim().length < VALIDATION.MIN_ADDRESS_LENGTH) {
          const errorMessage = '请输入完整的配送地址';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 1: // 食物类型
        if (!value || value === '未选择' || (Array.isArray(value) && value.length === 0)) {
          const errorMessage = '请选择食物类型';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      case 2: // 忌口
      case 3: // 偏好
        return { isValid: true };
        
      case 4: // 预算
        const budgetNum = parseFloat(value);
        if (!value || budgetNum <= 0) {
          const errorMessage = '请设置一个合理的预算金额';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        if (budgetNum < VALIDATION.MIN_BUDGET) {
          const errorMessage = '预算至少需要10元哦';
          setInputError(errorMessage);
          return { isValid: false, errorMessage };
        }
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  };

  return {
    inputError,
    validateInput,
    validatePhoneNumber,
    setInputError,
  };
};

export const useAnimations = () => {
  const [questionAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(1))
  );
  const [answerAnimations] = useState(() => 
    Array.from({ length: 5 }, () => new Animated.Value(0))
  );
  const [currentQuestionAnimation] = useState(new Animated.Value(0));
  const [mapAnimation] = useState(new Animated.Value(0));
  const [emotionAnimation] = useState(new Animated.Value(1));
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [inputSectionAnimation] = useState(new Animated.Value(0));
  const [themeAnimation] = useState(new Animated.Value(0));
  
  // 移除流动动画相关的动画值

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: TIMING.SHAKE_DURATION, useNativeDriver: false }),
    ]).start();
  };

  const changeEmotion = (newEmotion: string, callback?: () => void) => {
    Animated.sequence([
      Animated.timing(emotionAnimation, {
        toValue: 0.5,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(emotionAnimation, {
        toValue: 1,
        duration: TIMING.EMOTION_DURATION,
        useNativeDriver: false,
      }),
    ]).start(() => {
      callback?.();
    });
  };

  // 添加过渡动画相关的动画值

  // 简化的流动逻辑：直接执行回调，无动画
  const triggerQuestionFlowAnimation = (
    callback?: () => void
  ) => {
    // 🔧 生产环境日志清理：条件性日志输出
    if (process.env.NODE_ENV === 'development') {
      console.log('🎬 流动逻辑执行（无动画）');
    }
    // 直接执行回调，不再有动画
    callback?.();
  };

  return {
    questionAnimations,
    answerAnimations,
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    themeAnimation,
    triggerShake,
    changeEmotion,
    triggerQuestionFlowAnimation,
  };
};

// Export new hooks
export { useAppState } from './useAppState';
export { useFormSteps } from './useFormSteps';
export { useOrderManagement } from './useOrderManagement';