import React from 'react';
import { View, Text, Animated, Image, Platform, Dimensions } from 'react-native';
import { createQuestionStyles, createAvatarStyles } from '../styles/globalStyles';
import { useTheme } from '../contexts/ColorThemeContext';

interface CurrentQuestionProps {
  displayedText: string;
  isTyping: boolean;
  showCursor: boolean;
  cursorOpacity?: Animated.Value;
  streamingOpacity?: Animated.Value;
  isStreaming?: boolean;
  inputError: string;
  currentStep: number;
  currentQuestionAnimation: Animated.Value;
  shakeAnimation: Animated.Value;
  emotionAnimation?: Animated.Value;
  children?: React.ReactNode;
}

export const CurrentQuestion: React.FC<CurrentQuestionProps> = ({
  displayedText,
  isTyping,
  showCursor,
  cursorOpacity,
  streamingOpacity,
  isStreaming = false,
  inputError,
  currentStep,
  currentQuestionAnimation,
  shakeAnimation,
  emotionAnimation,
  children,
}) => {
  const { theme } = useTheme();
  
  // 创建动态样式
  const questionStyles = createQuestionStyles(theme);
  const avatarStyles = createAvatarStyles(theme);
  const { width } = Dimensions.get('window');
  const isMobileLayout = Platform.OS !== 'web' || (Platform.OS === 'web' && width <= 768);
  
  return (
    <Animated.View
      style={[
        {
          opacity: currentQuestionAnimation,
          transform: [{
            translateY: currentQuestionAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          }],
        },
      ]}
    >
      <View style={questionStyles.currentQuestionCard}>
        {
          // 移动端：头像置于问题上方（不影响网页端）
          isMobileLayout ? (
            <View style={{
              paddingHorizontal: 20,
              paddingTop: 8,
            }}>
              {/* 顶部头像（左对齐） */}
              <Animated.View
                style={{
                  alignSelf: 'flex-start',
                  marginBottom: 12,
                  marginLeft: 0,
                  transform: [
                    { scale: emotionAnimation || new Animated.Value(1) },
                  ],
                }}
              >
                <View style={[
                  avatarStyles.avatarSimple,
                  {
                    ...(Platform.OS === 'web'
                      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
                      : {
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                    ),
                  },
                ]}>
                  <Image
                    source={require('../../assets/icon.png')}
                    style={avatarStyles.avatarImage}
                  />
                </View>
              </Animated.View>

              {/* 问题与输入 */}
              <View style={[questionStyles.questionHeader, { marginBottom: 0 }]}>
                <View style={{ flexDirection: 'column', width: '100%' }}>
                  <Animated.View
                    style={[
                      questionStyles.questionTextContainer,
                      {
                        transform: [{ translateX: shakeAnimation }],
                        marginLeft: 0,
                        marginBottom: 6,
                      },
                    ]}
                  >
                    <Animated.View style={{ opacity: streamingOpacity || 1 }}>
                      <Text style={questionStyles.currentQuestionText}>
                        {displayedText}
                        {isTyping && showCursor && (
                          <Animated.Text
                            style={[
                              questionStyles.cursor,
                              {
                                opacity: cursorOpacity || 1,
                                fontSize: isStreaming ? 16 : 18,
                                color: isStreaming ? 'rgba(255,255,255,0.8)' : questionStyles.cursor.color,
                              },
                            ]}
                          >
                            |
                          </Animated.Text>
                        )}
                      </Text>
                    </Animated.View>
                  </Animated.View>
                  {children}
                </View>
              </View>
            </View>
          ) : (
            // 网页端：保持原有三分栏布局
            <View style={{
              flexDirection: 'row',
              flex: 1,
              minHeight: 120,
            }}>
              {/* 左侧背景区域 */}
              <View style={{
                flexBasis: 'auto',
                flexShrink: 1,
                flexGrow: 0,
                backgroundColor: theme.BACKGROUND,
                borderTopLeftRadius: 16,
                borderBottomLeftRadius: 16,
              }} />

              {/* 中间内容区域 */}
              <View style={{
                flexBasis: 'auto',
                flexShrink: 0,
                flexGrow: 1,
                backgroundColor: theme.BACKGROUND,
                paddingHorizontal: 20,
                justifyContent: 'center',
                alignItems: 'flex-start',
                flexDirection: 'row',
              }}>
                {/* 头像区域（左侧） */}
                <Animated.View
                  style={[
                    {
                      marginRight: 18,
                      alignSelf: 'flex-start',
                      marginTop: 0,
                      transform: [{ scale: emotionAnimation || new Animated.Value(1) }],
                    },
                  ]}
                >
                  <View style={[
                    avatarStyles.avatarSimple,
                    {
                      ...(Platform.OS === 'web'
                        ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }
                        : {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                          }
                      ),
                    },
                  ]}>
                    <Image
                      source={require('../../assets/icon.png')}
                      style={avatarStyles.avatarImage}
                    />
                  </View>
                </Animated.View>

                {/* 问题和输入内容区域 */}
                <View style={{ flex: 1 }}>
                  <View style={[questionStyles.questionHeader, { marginBottom: 0 }]}>
                    <View style={{ flexDirection: 'column', width: '100%' }}>
                      <Animated.View
                        style={[
                          questionStyles.questionTextContainer,
                          {
                            flex: 1,
                            transform: [{ translateX: shakeAnimation }],
                            marginLeft: 0,
                            marginBottom: 4,
                          },
                        ]}
                      >
                        <Animated.View style={{ opacity: streamingOpacity || 1 }}>
                          <Text style={questionStyles.currentQuestionText}>
                            {displayedText}
                            {isTyping && showCursor && (
                              <Animated.Text
                                style={[
                                  questionStyles.cursor,
                                  {
                                    opacity: cursorOpacity || 1,
                                    fontSize: isStreaming ? 16 : 18,
                                    color: isStreaming ? 'rgba(255,255,255,0.8)' : questionStyles.cursor.color,
                                  },
                                ]}
                              >
                                |
                              </Animated.Text>
                            )}
                          </Text>
                        </Animated.View>
                      </Animated.View>
                      {children}
                    </View>
                  </View>
                </View>
              </View>

              {/* 右侧背景区域 */}
              <View style={{
                flexBasis: 'auto',
                flexShrink: 1,
                flexGrow: 0,
                backgroundColor: theme.BACKGROUND,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
              }} />
            </View>
          )
        }
      </View>
    </Animated.View>
  );
};