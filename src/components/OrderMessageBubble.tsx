import React from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { createQuestionStyles, createAnswerStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';

const { width } = Dimensions.get('window');

type AvatarKind = 'assistant' | 'delivery';

export interface OrderMessageBubbleProps {
  text: string;
  avatar: AvatarKind;
}

export const OrderMessageBubble: React.FC<OrderMessageBubbleProps> = ({ text, avatar }) => {
  const { theme } = useTheme();
  const isMobile = width <= 768;
  
  // 创建动态样式，与 CompletedQuestion 一致
  const questionStyles = createQuestionStyles(theme);
  const answerStyles = createAnswerStyles(theme);

  return (
    <View style={questionStyles.completedQuestionContainer}>
      <View style={questionStyles.completedQuestionRow}>
        {isMobile ? (
          // 移动端：简化为左对齐的单列布局（与 CompletedQuestion 一致）
          <View style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
            <View style={answerStyles.completedAnswerText}>
              <View style={answerStyles.answerWithEdit}>
                <Text style={answerStyles.answerValue}>
                  {text}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          // 桌面端：保留三分栏布局（与 CompletedQuestion 一致）
          <View style={{
            flexDirection: 'row',
            flex: 1,
            minHeight: 80,
          }}>
            <View style={{
              flexBasis: 'auto',
              flexShrink: 1,
              flexGrow: 0,
              backgroundColor: theme.BACKGROUND,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
            }} />
            <View style={{
              flexBasis: 'auto',
              flexShrink: 0,
              flexGrow: 1,
              backgroundColor: theme.BACKGROUND,
              paddingHorizontal: 20,
              paddingVertical: 12,
              justifyContent: 'center',
              alignItems: 'flex-start',
              flexDirection: 'row',
            }}>
              <View style={{
                width: 32,
                marginRight: 18,
                alignSelf: 'flex-start',
                marginTop: 0,
              }} />
              <View style={{ flex: 1 }}>
                <View style={answerStyles.completedAnswerText}>
                  <View style={answerStyles.answerWithEdit}>
                    <Text style={answerStyles.answerValue}>
                      {text}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={{
              flexBasis: 'auto',
              flexShrink: 1,
              flexGrow: 0,
              backgroundColor: theme.BACKGROUND,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }} />
          </View>
        )}
      </View>
    </View>
  );
};

