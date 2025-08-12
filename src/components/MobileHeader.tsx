import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Platform, Modal, ScrollView, Image, Linking, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { createAvatarStyles } from '../styles/globalStyles';
import { STEP_TITLES, COLORS } from '../constants';
import { SimpleIcon } from './SimpleIcon';

const { width } = Dimensions.get('window');

interface MobileHeaderProps {
  title: string;
  phoneNumber?: string;
  emotionAnimation?: Animated.Value;
  onMenuPress?: () => void;
  onLogout?: () => void;
  onInvite?: () => void;
  currentStep: number;
  previousStep?: number;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  phoneNumber,
  emotionAnimation,
  onMenuPress,
  onLogout,
  onInvite,
  currentStep,
  previousStep
}) => {
  const { theme } = useTheme();
  const avatarStyles = createAvatarStyles(theme);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // UserMenu状态
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [showAboutModal, setShowAboutModal] = useState(false);

  // 只在移动端显示
  if (Platform.OS === 'web' && width > 768) {
    return null;
  }

  // 当步骤改变时的动画
  useEffect(() => {
    if (previousStep !== undefined && previousStep !== currentStep) {
      // 先淡出并缩小
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 然后淡入并恢复
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [currentStep, previousStep]);

  // 1000秒后自动隐藏气泡
  useEffect(() => {
    if (showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 1000000);
      return () => clearTimeout(timer);
    }
  }, [showBubble]);

  // 获取手机尾号（最后4位）
  const getPhoneTail = (phone?: string) => {
    if (!phone) return '';
    return phone.slice(-4);
  };

  // UserMenu功能函数
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout?.();
  };

  const handleInvite = () => {
    setShowDropdown(false);
    setShowBubble(false);
    onInvite?.();
  };

  const handleAbout = () => {
    setShowDropdown(false);
    setShowAboutModal(true);
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://omnilaze.co').catch(err => {});
  };

  const handleBubbleClick = () => {
    setShowBubble(false);
    handleInvite();
  };

  const headerStyles = {
    container: {
      backgroundColor: theme.BACKGROUND,
      // 留出系统状态栏空间，然后在其下方展示进度条
      paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 44) + 6,
      paddingBottom: 10,
      paddingHorizontal: 16,
      zIndex: 100,
    },
    flexRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    leftSpacer: {
      flex: 1, // 占据剩余空间，让中间内容居中
    },
    centerContent: {
      alignItems: 'center' as const,
      minWidth: 100, // 确保中间内容有最小宽度
    },
    rightContent: {
      flex: 1, // 与左侧对称，但内容靠右对齐
      alignItems: 'flex-end' as const,
    },
    progressContainer: {
      alignItems: 'center' as const,
    },
    dotsContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 2,
    },
    menuButtonContainer: {
      position: 'relative' as const,
    },
    menuButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    phoneText: {
      fontSize: 12,
      color: theme.TEXT_SECONDARY,
      marginRight: 8,
      fontWeight: '400' as const,
    },
    menuDots: {
      fontSize: 14,
      color: theme.TEXT_SECONDARY,
      fontWeight: '400' as const,
    },
    // 邀请气泡样式
    inviteBubble: {
      position: 'absolute' as const,
      bottom: 50,
      right: -10,
      backgroundColor: theme.PRIMARY,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      shadowColor: theme.SHADOW,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 1000,
    },
    bubbleContent: {
      alignItems: 'center' as const,
    },
    bubbleText: {
      color: theme.WHITE,
      fontSize: 13,
      fontWeight: '500' as const,
    },
    bubbleArrow: {
      position: 'absolute' as const,
      bottom: -6,
      right: 20,
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: theme.PRIMARY,
    },
    // 下拉菜单样式
    dropdown: {
      position: 'absolute' as const,
      top: 50,
      right: 0,
      backgroundColor: theme.WHITE,
      borderRadius: 8,
      paddingVertical: 8,
      minWidth: 120,
      shadowColor: theme.SHADOW,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1001,
    },
    menuItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuItemText: {
      marginLeft: 12,
      fontSize: 14,
      color: theme.TEXT_PRIMARY,
      fontWeight: '500' as const,
    },
    separator: {
      height: 1,
      backgroundColor: theme.BORDER,
      marginHorizontal: 16,
    },
    overlay: {
      position: 'fixed' as any,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
    },
    // Modal样式
    aboutOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    aboutBackdrop: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    aboutModal: {
      backgroundColor: theme.WHITE,
      borderRadius: 16,
      width: width > 768 ? 400 : width * 0.9,
      maxHeight: '80%',
      overflow: 'hidden' as const,
    },
    aboutHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.BORDER,
    },
    aboutTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.TEXT_PRIMARY,
    },
    aboutCloseButton: {
      padding: 4,
    },
    aboutContent: {
      maxHeight: 400,
    },
    aboutContentContainer: {
      padding: 20,
    },
    socialImage: {
      width: '100%',
      height: 200,
      marginBottom: 20,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: 2,
    },
    activeDot: {
      backgroundColor: theme.PRIMARY,
    },
    inactiveDot: {
      backgroundColor: theme.BORDER,
    },
    currentDot: {
      backgroundColor: theme.PRIMARY,
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    titleText: {
      fontSize: 11,
      fontWeight: '400' as const, // 从500调整到400，让字体更轻
      color: theme.TEXT_SECONDARY, // 使用次级文本颜色，让它不那么突出
      textAlign: 'center' as const,
      marginTop: 0,
    },
  };

  // 确保currentStep在有效范围内
  const validCurrentStep = Math.max(0, Math.min(currentStep, STEP_TITLES.length - 1));
  const currentTitle = title; // 直接使用从App.tsx传入的title

  return (
    <View style={headerStyles.container}>
      {/* Flexbox 布局：左边空白，中间进度+标题，右边手机号按钮 */}
      <View style={headerStyles.flexRow}>
        {/* 左侧空白区域 - flex grow 占据剩余空间 */}
        <View style={headerStyles.leftSpacer} />

        {/* 中间：进度点 + 标题组合 - 固定宽度 */}
        <Animated.View 
          style={[
            headerStyles.centerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 简洁的圆点指示器 */}
          <View style={headerStyles.dotsContainer}>
            {STEP_TITLES.map((_, index) => {
              const isActive = index <= validCurrentStep;
              const isCurrent = index === validCurrentStep;
              
              return (
                <View
                  key={index}
                  style={[
                    headerStyles.dot,
                    isCurrent 
                      ? headerStyles.currentDot
                      : isActive 
                        ? headerStyles.activeDot 
                        : headerStyles.inactiveDot,
                  ]}
                />
              );
            })}
          </View>
          
          {/* 当前步骤标题 */}
          <Text style={headerStyles.titleText}>
            {currentTitle}
          </Text>
        </Animated.View>

        {/* 右侧：手机号按钮 - 固定宽度 */}
        <View style={headerStyles.rightContent}>
          <View style={headerStyles.menuButtonContainer}>
            {/* 邀请提示气泡 - 移动端不显示，保持原有逻辑但添加移动端条件 */}
            {showBubble && width > 768 && (
              <TouchableOpacity
                style={headerStyles.inviteBubble}
                onPress={handleBubbleClick}
                activeOpacity={0.8}
              >
                <View style={headerStyles.bubbleContent}>
                  <Text style={headerStyles.bubbleText}>邀请新用户送奶茶～🎉</Text>
                </View>
                <View style={headerStyles.bubbleArrow} />
              </TouchableOpacity>
            )}

            {/* 合并的菜单按钮：手机尾号 + 三个点 */}
            <TouchableOpacity 
              style={headerStyles.menuButton}
              onPress={toggleDropdown}
              activeOpacity={0.7}
            >
              <Text style={headerStyles.phoneText}>
                {getPhoneTail(phoneNumber)}
              </Text>
              <Text style={headerStyles.menuDots}>⋯</Text>
            </TouchableOpacity>

            {/* 下拉菜单 */}
            {showDropdown && (
              <View style={headerStyles.dropdown}>
                <TouchableOpacity
                  style={headerStyles.menuItem}
                  onPress={handleInvite}
                  activeOpacity={0.7}
                >
                  <SimpleIcon name="gift" size={16} color={COLORS.PRIMARY} />
                  <Text style={headerStyles.menuItemText}>邀请</Text>
                </TouchableOpacity>
                
                <View style={headerStyles.separator} />
                
                <TouchableOpacity
                  style={headerStyles.menuItem}
                  onPress={handleAbout}
                  activeOpacity={0.7}
                >
                  <SimpleIcon name="info" size={16} color={COLORS.PRIMARY} />
                  <Text style={headerStyles.menuItemText}>关于我们</Text>
                </TouchableOpacity>
                
                <View style={headerStyles.separator} />
                
                <TouchableOpacity
                  style={headerStyles.menuItem}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <SimpleIcon name="exit" size={16} color="#ef4444" />
                  <Text style={[headerStyles.menuItemText, { color: '#ef4444' }]}>登出</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 点击外部关闭下拉菜单的遮罩 */}
            {showDropdown && (
              <TouchableOpacity
                style={headerStyles.overlay}
                onPress={() => setShowDropdown(false)}
                activeOpacity={1}
              />
            )}
          </View>
        </View>
      </View>

      {/* 关于我们弹窗 */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={headerStyles.aboutOverlay}>
          <TouchableOpacity
            style={headerStyles.aboutBackdrop}
            activeOpacity={1}
            onPress={() => setShowAboutModal(false)}
          />
          
          <View style={headerStyles.aboutModal}>
            {/* 标题栏 */}
            <View style={headerStyles.aboutHeader}>
              <Text style={headerStyles.aboutTitle}>关于我们</Text>
              <TouchableOpacity
                style={headerStyles.aboutCloseButton}
                onPress={() => setShowAboutModal(false)}
                activeOpacity={0.7}
              >
                <SimpleIcon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            {/* 内容 */}
            <ScrollView 
              style={headerStyles.aboutContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={headerStyles.aboutContentContainer}
            >
              {/* 社交图片 */}
              <Image 
                source={require('../../assets/social/social.jpg')} 
                style={headerStyles.socialImage}
                resizeMode="contain"
              />
              
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.TEXT_PRIMARY,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                懒得点外卖
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: theme.TEXT_SECONDARY,
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 20,
              }}>
                让忙碌的你，不再为选择而烦恼{'\n'}
                我们帮你智能推荐，省时省心
              </Text>
              
              <TouchableOpacity
                onPress={handleOpenWebsite}
                style={{
                  backgroundColor: theme.PRIMARY,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  color: theme.WHITE,
                  fontSize: 14,
                  fontWeight: '500',
                }}>
                  访问官网
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};