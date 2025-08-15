import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// 订阅 Animated.Value 的变化并把当前值保存在 ref，避免访问私有 __getValue
export const useAnimatedValue = (animated: Animated.Value) => {
  const currentRef = useRef<number>(0);

  useEffect(() => {
    // 尝试读取初始值（某些平台不支持）
    try {
      // @ts-ignore: __getValue 不是公开 API，失败就忽略
      const initial = (animated as any)?.__getValue?.();
      if (typeof initial === 'number') currentRef.current = initial;
    } catch {}

    const id = animated.addListener?.(({ value }: { value: number }) => {
      if (typeof value === 'number') currentRef.current = value;
    }) as unknown as string | number | undefined;

    return () => {
      if (id !== undefined) {
        try { (animated as any).removeListener?.(id); } catch {}
      }
    };
  }, [animated]);

  return currentRef as React.MutableRefObject<number>;
};

