import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface LoadingDotsProps {
  text: string;
  style?: any;
  dotStyle?: any;
  speed?: number; // 动画速度，毫秒
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  text,
  style,
  dotStyle,
  speed = 500
}) => {
  const [currentDots, setCurrentDots] = useState('');

  useEffect(() => {
    const dotsSequence = ['', '.', '..', '...'];
    let currentIndex = 0;

    const interval = setInterval(() => {
      setCurrentDots(dotsSequence[currentIndex]);
      currentIndex = (currentIndex + 1) % dotsSequence.length;
    }, speed);

    return () => clearInterval(interval);
  }, [speed]);

  // 确保点号总是在 Text 组件内
  return (
    <Text style={style}>
      {text}
      {currentDots && <Text style={dotStyle}>{currentDots}</Text>}
    </Text>
  );
};