import { useEffect, useRef, useCallback } from 'react';

// Performance monitoring hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>();
  const lastRenderDuration = useRef<number>();

  useEffect(() => {
    renderCount.current += 1;
    if (renderStartTime.current) {
      lastRenderDuration.current = performance.now() - renderStartTime.current;
      
      if (process.env.NODE_ENV === 'development') {
        if (lastRenderDuration.current > 16) {
          console.warn(
            `⚠️ [${componentName}] Slow render detected: ${lastRenderDuration.current.toFixed(2)}ms`
          );
        }
      }
    }
    renderStartTime.current = performance.now();
  });

  const logMetrics = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [${componentName}] Performance Metrics:`, {
        renderCount: renderCount.current,
        lastRenderDuration: lastRenderDuration.current?.toFixed(2) + 'ms',
      });
    }
  }, [componentName]);

  return { logMetrics };
};

// Debounce hook for input optimization
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for scroll events
export const useThrottle = <T>(value: T, delay: number = 100): T => {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
};

// Lazy loading hook
export const useLazyLoad = (
  callback: () => void,
  dependencies: any[] = []
) => {
  const hasLoaded = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!hasLoaded.current) {
      timeoutRef.current = setTimeout(() => {
        callback();
        hasLoaded.current = true;
      }, 0);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);

  const reset = useCallback(() => {
    hasLoaded.current = false;
  }, []);

  return { reset };
};

// Memory leak prevention hook
export const useCleanup = (cleanupFn: () => void) => {
  const cleanupRef = useRef(cleanupFn);
  cleanupRef.current = cleanupFn;

  useEffect(() => {
    return () => {
      cleanupRef.current();
    };
  }, []);
};

// Animation frame hook for smooth animations
export const useAnimationFrame = (callback: (deltaTime: number) => void) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate]);
};

// Intersection observer hook for lazy rendering
export const useIntersectionObserver = (
  ref: React.RefObject<any>,
  options?: IntersectionObserverInit
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isIntersecting;
};

// Virtual scroll hook for long lists
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 3
) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop,
  };
};

import React from 'react';