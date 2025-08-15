import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Track latest value of an Animated.Value without using private __getValue
export function useAnimatedValue(value: Animated.Value) {
  const current = useRef<number>(0);

  useEffect(() => {
    // Initialize by stopping any pending animation to read current value safely
    let mounted = true;
    try {
      // Do not stop external animations; instead subscribe to updates
      const id = value.addListener(({ value: v }) => {
        if (mounted) current.current = v;
      });
      return () => {
        mounted = false;
        if (id) value.removeListener(id);
      };
    } catch {
      // noop
      return () => {};
    }
  }, [value]);

  return current; // .current holds latest number
}

