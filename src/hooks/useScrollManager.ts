import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Animated, Platform, ScrollView, Dimensions } from 'react-native';
import { useSafeTimeout } from './useSafeTimeout';

interface ScrollDimensions {
  pageHeight: number;
  bufferContainerHeight: number;
  SNAP_THRESHOLD: number;
  FOCUS_HYSTERESIS: number;
  mobileHeaderHeight: number;
  AVATAR_TO_HEADER_DISTANCE: number;
  getCurrentPagePosition: () => number;
  maxScrollPosition: number;
  minScrollPosition: number;
  dynamicContentHeight: number;
}

interface UseScrollManagerProps {
  completedAnswers: Record<number, any>;
  completedQuestionsHeight: number;
  isStateRestored: boolean;
  isTyping: boolean;
  width: number;
  height: number;
}

export const useScrollManager = ({
  completedAnswers,
  completedQuestionsHeight,
  isStateRestored,
  isTyping,
  width,
  height,
}: UseScrollManagerProps) => {
  const { setSafeTimeout, clearTimeoutById } = useSafeTimeout();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollPosition] = useState(new Animated.Value(0));
  const [isScrolling, setIsScrolling] = useState(false);
  const [hasInitializedScroll, setHasInitializedScroll] = useState(false);

  // Focus mode state management
  const [focusMode, setFocusMode] = useState<'current' | 'completed'>(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('omnilaze_focus_mode');
        return saved === 'completed' ? 'completed' : 'current';
      } catch (error) {
        console.log('Failed to read focusMode:', error);
        return 'current';
      }
    }
    return 'current';
  });

  // Save focusMode to localStorage
  const saveFocusMode = useCallback((mode: 'current' | 'completed') => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('omnilaze_focus_mode', mode);
      } catch (error) {
        console.log('Failed to save focusMode:', error);
      }
    }
  }, []);

  // Calculate scroll dimensions
  const scrollDimensions = useMemo<ScrollDimensions>(() => {
    const pageHeight = height - 60;
    const bufferContainerHeight = 300;
    const SNAP_THRESHOLD = 200;
    const FOCUS_HYSTERESIS = 60;

    const getMobileHeaderHeight = () => {
      if (Platform.OS === 'web' && width > 768) {
        return 0;
      }
      const statusBarHeight = Platform.OS === 'android' ? 24 : 44;
      const headerPaddingTop = 6;
      const headerContentHeight = 28;
      const headerPaddingBottom = 10;
      return statusBarHeight + headerPaddingTop + headerContentHeight + headerPaddingBottom;
    };

    const mobileHeaderHeight = getMobileHeaderHeight();
    const AVATAR_TO_HEADER_DISTANCE = 20;

    const getCurrentPagePosition = () => {
      const basePosition = bufferContainerHeight + completedQuestionsHeight;
      const CURRENT_PAGE_PADDING_TOP = 12;
      const CURRENT_QUESTION_PADDING_TOP = 8;
      const AVATAR_MARGIN_TOP = 0;
      
      const avatarOffsetFromPageTop = CURRENT_PAGE_PADDING_TOP + CURRENT_QUESTION_PADDING_TOP + AVATAR_MARGIN_TOP;
      const targetScrollPosition = basePosition - (mobileHeaderHeight + AVATAR_TO_HEADER_DISTANCE - avatarOffsetFromPageTop);
      
      return targetScrollPosition;
    };

    const maxScrollPosition = Math.max(
      getCurrentPagePosition() + pageHeight, 
      bufferContainerHeight + completedQuestionsHeight + pageHeight
    );
    const minScrollPosition = 0;
    const dynamicContentHeight = Math.max(
      maxScrollPosition + pageHeight, 
      bufferContainerHeight + completedQuestionsHeight + pageHeight * 2
    );

    return {
      pageHeight,
      bufferContainerHeight,
      SNAP_THRESHOLD,
      FOCUS_HYSTERESIS,
      mobileHeaderHeight,
      AVATAR_TO_HEADER_DISTANCE,
      getCurrentPagePosition,
      maxScrollPosition,
      minScrollPosition,
      dynamicContentHeight,
    };
  }, [height, completedQuestionsHeight, width]);

  // Scroll progress interpolation
  const scrollProgress = useMemo(() => {
    return scrollPosition.interpolate({
      inputRange: [scrollDimensions.bufferContainerHeight, scrollDimensions.getCurrentPagePosition()],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
  }, [scrollPosition, scrollDimensions]);

  // Page opacity based on focus mode
  const pageOpacity = useMemo(() => ({
    completedPageOpacity: focusMode === 'completed' ? 1 : 0.4,
    currentPageOpacity: focusMode === 'current' ? 1 : 0.4,
  }), [focusMode]);

  // Handle scroll event
  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollPosition.setValue(offsetY);

    const completedPagePosition = scrollDimensions.bufferContainerHeight;
    const currentPagePosition = scrollDimensions.getCurrentPagePosition();
    const midPoint = (completedPagePosition + currentPagePosition) / 3;
    let nextMode: 'current' | 'completed' = focusMode;

    if (focusMode === 'current') {
      if (offsetY < midPoint - scrollDimensions.FOCUS_HYSTERESIS && Object.keys(completedAnswers).length > 0) {
        nextMode = 'completed';
      }
    } else {
      if (offsetY > midPoint + scrollDimensions.FOCUS_HYSTERESIS) {
        nextMode = 'current';
      }
    }

    if (nextMode !== focusMode) {
      setFocusMode(nextMode);
      saveFocusMode(nextMode);
    }
  }, [focusMode, completedAnswers, scrollDimensions, scrollPosition, saveFocusMode]);

  // Handle scroll end with snapping
  const handleScrollEnd = useCallback((event: any, editingStep: number | null) => {
    setIsScrolling(false);
    const offsetY = event.nativeEvent.contentOffset.y;

    if (editingStep !== null) {
      return;
    }

    const completedPagePosition = scrollDimensions.bufferContainerHeight;
    const currentPagePosition = scrollDimensions.getCurrentPagePosition();
    const midPoint = (completedPagePosition + currentPagePosition) / 2;

    let targetOffset;
    let targetMode;

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
        return;
      }
    } else {
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

    const distance = Math.abs(offsetY - targetOffset);
    const snapThreshold = Platform.OS === 'web' ? 10 : 40;

    if (distance > snapThreshold) {
      scrollViewRef.current?.scrollTo({
        y: targetOffset,
        animated: true,
      });
    }
  }, [scrollDimensions, saveFocusMode]);

  // Programmatic page scrolling
  const scrollToPage = useCallback((page: 'current' | 'completed') => {
    const targetOffset = page === 'completed' 
      ? scrollDimensions.bufferContainerHeight 
      : scrollDimensions.getCurrentPagePosition();
    
    scrollViewRef.current?.scrollTo({
      y: targetOffset,
      animated: true,
    });
    setFocusMode(page);
    saveFocusMode(page);
  }, [scrollDimensions, saveFocusMode]);

  // Handle focus gesture
  const handleFocusGesture = useCallback((direction: 'up' | 'down') => {
    if (direction === 'up' && focusMode === 'current' && Object.keys(completedAnswers).length > 0) {
      scrollToPage('completed');
    } else if (direction === 'down' && focusMode === 'completed') {
      scrollToPage('current');
    }
  }, [focusMode, completedAnswers, scrollToPage]);

  // Initialize scroll position
  useEffect(() => {
    if (!isStateRestored || hasInitializedScroll || isTyping) return;

    let initialOffset;
    if (focusMode === 'completed' && Object.keys(completedAnswers).length > 0) {
      initialOffset = scrollDimensions.bufferContainerHeight;
    } else {
      initialOffset = scrollDimensions.getCurrentPagePosition();
      if (focusMode !== 'current') {
        setFocusMode('current');
        saveFocusMode('current');
      }
    }

    const timeoutId = setSafeTimeout(() => {
      if (!isTyping) {
        scrollViewRef.current?.scrollTo({
          y: initialOffset,
          animated: true,
        });
        scrollPosition.setValue(initialOffset);
        setHasInitializedScroll(true);
      }
    }, isTyping ? 500 : 200);

    return () => clearTimeoutById(timeoutId);
  }, [
    isStateRestored,
    hasInitializedScroll,
    isTyping,
    focusMode,
    completedAnswers,
    scrollDimensions,
    setSafeTimeout,
    clearTimeoutById,
    saveFocusMode,
    scrollPosition,
  ]);

  // Scroll to edit position
  const scrollToEditPosition = useCallback((editingStep: number, bufferContainerHeight: number, completedQuestionsHeight: number) => {
    const currentScrollPos = (scrollPosition as any)._value || 0;
    const mobileHeaderHeight = scrollDimensions.mobileHeaderHeight;
    const avatarOffsetInCurrentPage = 12 + 8;
    const currentPageBasePosition = bufferContainerHeight + completedQuestionsHeight;
    const currentAvatarAbsolutePosition = currentPageBasePosition + avatarOffsetInCurrentPage;
    const currentAvatarToHeaderDistance = currentAvatarAbsolutePosition - currentScrollPos - mobileHeaderHeight;
    const IDEAL_AVATAR_TO_HEADER_DISTANCE = 20;
    const scrollDelta = currentAvatarToHeaderDistance - IDEAL_AVATAR_TO_HEADER_DISTANCE;
    const targetScrollPosition = currentScrollPos + scrollDelta;

    setTimeout(() => {
      setFocusMode('current');
      saveFocusMode('current');
      scrollViewRef.current?.scrollTo({
        y: targetScrollPosition,
        animated: true,
      });
    }, 200);
  }, [scrollPosition, scrollDimensions, saveFocusMode]);

  return {
    scrollViewRef,
    scrollPosition,
    isScrolling,
    setIsScrolling,
    focusMode,
    setFocusMode,
    saveFocusMode,
    handleScroll,
    handleScrollEnd,
    scrollToPage,
    handleFocusGesture,
    scrollToEditPosition,
    scrollDimensions,
    scrollProgress,
    pageOpacity,
  };
};