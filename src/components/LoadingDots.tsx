import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';

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

  return (
    <Text style={style}>
      {text}
      <Text style={dotStyle}>{currentDots}</Text>
    </Text>
  );
};