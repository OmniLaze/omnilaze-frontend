import React from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import { createProgressStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';
import { STEP_TITLES } from '../constants';

const { width } = Dimensions.get('window');

interface ProgressStepsProps {
  currentStep: number;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  const { theme } = useTheme();
  const progressStyles = createProgressStyles(theme);

  // 只在网页端显示，移动端完全隐藏
  if (Platform.OS === 'web' && width <= 768) {
    return null;
  }

  return (
    <View style={progressStyles.progressContainer}>
      <View style={progressStyles.progressSteps}>
        {STEP_TITLES.map((title, index) => (
          <View key={index} style={progressStyles.stepItem}>
            <View style={currentStep >= index ? progressStyles.activeStep : progressStyles.inactiveStep}>
              {currentStep >= index && <View style={progressStyles.activeStepInner} />}
            </View>
            <Text style={currentStep >= index ? progressStyles.activeStepText : progressStyles.inactiveStepText}>
              {title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};