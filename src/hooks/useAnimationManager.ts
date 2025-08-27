import { useState, useCallback, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { TIMING } from '../constants';

interface UseAnimationManagerProps {
  stepCount?: number;
}

export const useAnimationManager = ({ stepCount = 7 }: UseAnimationManagerProps = {}) => {
  // Question and answer animations for each step
  const [questionAnimations] = useState(() => 
    Array.from({ length: stepCount }, () => new Animated.Value(1))
  );
  
  const [answerAnimations] = useState(() => 
    Array.from({ length: stepCount }, () => new Animated.Value(0))
  );
  
  // Current state animations
  const [currentQuestionAnimation] = useState(new Animated.Value(0));
  const [mapAnimation] = useState(new Animated.Value(0));
  const [emotionAnimation] = useState(new Animated.Value(1));
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [inputSectionAnimation] = useState(new Animated.Value(0));
  const [themeAnimation] = useState(new Animated.Value(0));
  const [completedQuestionsOffset] = useState(new Animated.Value(0));

  // Animation state tracking
  const [isInputAnimating, setIsInputAnimating] = useState(false);

  // Trigger shake animation for validation errors
  const triggerShake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: TIMING.SHAKE_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: TIMING.SHAKE_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: TIMING.SHAKE_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: TIMING.SHAKE_DURATION,
        useNativeDriver: false,
      }),
    ]).start();
  }, [shakeAnimation]);

  // Change emotion animation
  const changeEmotion = useCallback((emotion: string, callback?: () => void) => {
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
    ]).start(() => callback?.());
  }, [emotionAnimation]);

  // Animate input section visibility
  const animateInputSection = useCallback((toValue: number, duration: number = 300) => {
    if (isInputAnimating) return;
    
    setIsInputAnimating(true);
    Animated.timing(inputSectionAnimation, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(() => {
      setIsInputAnimating(false);
    });
  }, [isInputAnimating, inputSectionAnimation]);

  // Show input section
  const showInputSection = useCallback(() => {
    animateInputSection(1, 500);
  }, [animateInputSection]);

  // Hide input section
  const hideInputSection = useCallback(() => {
    animateInputSection(0, 300);
  }, [animateInputSection]);

  // Animate question flow (push up animation)
  const animateQuestionFlow = useCallback((
    stepIndex: number,
    pushUpDistance: number,
    onComplete?: () => void
  ) => {
    // Show question and answer immediately
    if (stepIndex >= 0) {
      questionAnimations[stepIndex].setValue(1);
      answerAnimations[stepIndex].setValue(1);
    }

    // Animate push up
    Animated.timing(completedQuestionsOffset, {
      toValue: -(pushUpDistance + 10),
      duration: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start(() => {
      onComplete?.();
    });
  }, [questionAnimations, answerAnimations, completedQuestionsOffset]);

  // Reset question animation for a specific step
  const resetQuestionAnimation = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < questionAnimations.length) {
      questionAnimations[stepIndex].setValue(0);
    }
  }, [questionAnimations]);

  // Reset answer animation for a specific step
  const resetAnswerAnimation = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < answerAnimations.length) {
      answerAnimations[stepIndex].setValue(0);
    }
  }, [answerAnimations]);

  // Show specific step animations
  const showStepAnimations = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < questionAnimations.length) {
      questionAnimations[stepIndex].setValue(1);
      answerAnimations[stepIndex].setValue(1);
    }
  }, [questionAnimations, answerAnimations]);

  // Reset all animations to initial state
  const resetAllAnimations = useCallback(() => {
    inputSectionAnimation.setValue(0);
    currentQuestionAnimation.setValue(1);
    completedQuestionsOffset.setValue(0);
    questionAnimations.forEach(anim => anim.setValue(0));
    answerAnimations.forEach(anim => anim.setValue(0));
  }, [
    inputSectionAnimation,
    currentQuestionAnimation,
    completedQuestionsOffset,
    questionAnimations,
    answerAnimations,
  ]);

  // Map animation controls
  const showMap = useCallback(() => {
    Animated.timing(mapAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mapAnimation]);

  const hideMap = useCallback(() => {
    Animated.timing(mapAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mapAnimation]);

  // Theme transition animation
  const animateThemeTransition = useCallback((onComplete?: () => void) => {
    Animated.sequence([
      Animated.timing(themeAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(themeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(onComplete);
  }, [themeAnimation]);

  // Create interpolated values for common animations
  const interpolatedValues = useMemo(() => ({
    inputSectionOpacity: inputSectionAnimation,
    inputSectionTranslateY: inputSectionAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    }),
    shakeTranslateX: shakeAnimation,
    emotionScale: emotionAnimation,
    mapOpacity: mapAnimation,
    mapScale: mapAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
    }),
    themeOpacity: themeAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
  }), [
    inputSectionAnimation,
    shakeAnimation,
    emotionAnimation,
    mapAnimation,
    themeAnimation,
  ]);

  return {
    // Animation values
    questionAnimations,
    answerAnimations,
    currentQuestionAnimation,
    mapAnimation,
    emotionAnimation,
    shakeAnimation,
    inputSectionAnimation,
    themeAnimation,
    completedQuestionsOffset,
    
    // Animation state
    isInputAnimating,
    
    // Animation control functions
    triggerShake,
    changeEmotion,
    animateInputSection,
    showInputSection,
    hideInputSection,
    animateQuestionFlow,
    resetQuestionAnimation,
    resetAnswerAnimation,
    showStepAnimations,
    resetAllAnimations,
    showMap,
    hideMap,
    animateThemeTransition,
    
    // Interpolated values for direct use
    interpolatedValues,
  };
};