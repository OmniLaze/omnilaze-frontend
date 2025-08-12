import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Platform, Dimensions, Image, Linking, ScrollView } from 'react-native';
import { SimpleIcon } from './SimpleIcon';
import { COLORS } from '../constants';
import { useTheme } from '../contexts/ColorThemeContext';

const { width } = Dimensions.get('window');

interface UserMenuProps {
  isVisible: boolean;
  onLogout: () => void;
  onInvite: () => void;
  phoneNumber: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  isVisible,
  onLogout,
  onInvite,
  phoneNumber,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBubble, setShowBubble] = useState(true); // 控制气泡显示
  const [showAboutModal, setShowAboutModal] = useState(false); // 控制关于我们弹窗
  const { theme } = useTheme();
  
  // 创建动态样式
  const styles = createStyles(theme);

  // 获取手机号后4位
  const getPhoneLast4Digits = () => {
    if (!phoneNumber || phoneNumber.length < 4) return '';
    return phoneNumber.slice(-4);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleLogout = () => {
    setShowDropdown(false);
    onLogout();
  };

  const handleInvite = () => {
    setShowDropdown(false);
    setShowBubble(false); // 点击邀请后隐藏气泡
    onInvite();
  };

  const handleAbout = () => {
    setShowDropdown(false);
    setShowAboutModal(true);
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://omnilaze.co').catch(err => {});
  };

  const handleBubbleClick = () => {
    setShowBubble(false); // 点击气泡后隐藏
    handleInvite(); // 直接触发邀请功能
  };

  // 1000秒后自动隐藏气泡
  useEffect(() => {
    if (showBubble) {
      const timer = setTimeout(() => {
        setShowBubble(false);
      }, 1000000);
      return () => clearTimeout(timer);
    }
  }, [showBubble]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 邀请提示气泡 - 只在网页端显示，移动端隐藏 */}
      {showBubble && width > 768 && (
        <TouchableOpacity
          style={styles.inviteBubble}
          onPress={handleBubbleClick}
          activeOpacity={0.8}
        >
          <View style={styles.bubbleContent}>
            <Text style={styles.bubbleText}>邀请新用户送奶茶～🎉</Text>
          </View>
          <View style={styles.bubbleArrow} />
        </TouchableOpacity>
      )}
      
      {/* 手机尾号 + 三个点按钮 */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={styles.phoneNumber}>{getPhoneLast4Digits()}</Text>
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </TouchableOpacity>

      {/* 下拉菜单 */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleInvite}
            activeOpacity={0.7}
          >
            <SimpleIcon name="gift" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.menuItemText}>邀请</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <SimpleIcon name="info" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.menuItemText}>关于我们</Text>
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <SimpleIcon name="exit" size={16} color="#ef4444" />
            <Text style={[styles.menuItemText, { color: '#ef4444' }]}>登出</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 点击外部关闭下拉菜单的遮罩 */}
      {showDropdown && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowDropdown(false)}
          activeOpacity={1}
        />
      )}

      {/* 关于我们弹窗 */}
      <Modal
        visible={showAboutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.aboutOverlay}>
          <TouchableOpacity
            style={styles.aboutBackdrop}
            activeOpacity={1}
            onPress={() => setShowAboutModal(false)}
          />
          
          <View style={styles.aboutModal}>
            {/* 标题栏 */}
            <View style={styles.aboutHeader}>
              <Text style={styles.aboutTitle}>关于我们</Text>
              <TouchableOpacity
                style={styles.aboutCloseButton}
                onPress={() => setShowAboutModal(false)}
                activeOpacity={0.7}
              >
                <SimpleIcon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            {/* 内容 */}
            <ScrollView 
              style={styles.aboutContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.aboutContentContainer}
            >
              {/* 社交图片 */}
              <Image 
                source={require('../../assets/social/social.jpg')} 
                style={styles.socialImage}
                resizeMode="contain"
              />
              
              {/* 品牌口号 */}
              <Text style={styles.brandSlogan}>懒得，一种全新的生活方式</Text>
              
              {/* 联系信息 */}
              <View style={styles.contactInfo}>
                <TouchableOpacity
                  style={styles.websiteButton}
                  onPress={handleOpenWebsite}
                  activeOpacity={0.7}
                >
                  <SimpleIcon name="language" size={16} color={COLORS.WHITE} />
                  <Text style={styles.websiteButtonText}>官网：omnilaze.co</Text>
                </TouchableOpacity>
                
                <View style={styles.wechatInfo}>
                  <SimpleIcon name="chat" size={16} color={COLORS.TEXT_SECONDARY} />
                  <Text style={styles.wechatText}>微信号：stevenxxzg</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: width > 768 ? 150 : 100,
    right: width > 768 ? 185 : 16,
    zIndex: 1000,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width > 768 ? 12 : 10,
    height: width > 768 ? 40 : 36,
    borderRadius: width > 768 ? 20 : 18,
    backgroundColor: theme.WHITE,
    shadowColor: theme.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  phoneNumber: {
    fontSize: width > 768 ? 14 : 12,
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
    marginRight: width > 768 ? 8 : 6,
  },
  dotsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: width > 768 ? 4 : 3,
    height: width > 768 ? 4 : 3,
    borderRadius: width > 768 ? 2 : 1.5,
    backgroundColor: theme.TEXT_PRIMARY,
    marginVertical: 0.5,
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 140, // 增加最小宽度以适应"关于我们"
    shadowColor: theme.SHADOW,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  overlay: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 1000,
    height: 1000,
    zIndex: 999,
  },
  inviteBubble: {
    position: 'absolute',
    top: 0,
    right: 70, // 增加右侧距离，因为按钮变宽了
    backgroundColor: theme.PRIMARY,
    borderRadius: width > 768 ? 20 : 18,
    paddingHorizontal: width > 768 ? 20 : 16, // 增加水平内边距
    paddingVertical: 0,
    height: width > 768 ? 40 : 36,
    minWidth: width > 768 ? 200 : 180, // 设置最小宽度
    justifyContent: 'center',
    shadowColor: theme.SHADOW,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1002,
  },
  bubbleContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
  },
  bubbleText: {
    color: theme.WHITE,
    fontSize: width > 768 ? 16 : 8, // 调整字体大小
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: width > 768 ? 16 : 8,
  },
  bubbleArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    right: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: theme.PRIMARY,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  // 关于我们弹窗样式
  aboutOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  aboutBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aboutModal: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%', // 增加最大高度以提供更多空间
    overflow: 'hidden', // 确保内容不会溢出
  },
  aboutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
  },
  aboutCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  aboutContent: {
    flex: 1, // 让ScrollView占据剩余空间
  },
  aboutContentContainer: {
    padding: 20,
  },
  socialImage: {
    width: '100%',
    height: Math.min(300, Dimensions.get('window').height * 0.4), // 响应式高度，最大300或屏幕高度的40%
    borderRadius: 12,
    marginBottom: 16, // 减少底部间距，为品牌口号留出空间
  },
  brandSlogan: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5, // 增加字母间距
  },
  contactInfo: {
    gap: 16,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  websiteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.WHITE,
    marginLeft: 8,
  },
  wechatInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  wechatText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.TEXT_SECONDARY,
    marginLeft: 8,
  },
});