import { StyleSheet, Dimensions, Platform } from 'react-native';
import { COLORS, LAYOUT } from '../constants';

const { width, height } = Dimensions.get('window');

// 创建动态样式函数
export const createGlobalStyles = (theme: any = COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  mainContent: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: width > 768 ? 48 : 16,
    paddingVertical: width > 768 ? 32 : 16,
    minHeight: height,
  },
  contentContainer: {
    flexDirection: 'column',
    gap: 24,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});

// 保持默认导出以向后兼容
export const globalStyles = createGlobalStyles();

export const createProgressStyles = (theme: any = COLORS) => StyleSheet.create({
  progressContainer: {
    position: width > 768 ? 'absolute' : 'relative',
    top: width > 768 ? 130 : 0,
    left: width > 768 ? 100 : 0,
    zIndex: 10,
    width: width > 768 ? 120 : '100%',
    marginBottom: width > 768 ? 0 : 16,
    paddingHorizontal: width > 768 ? 0 : 16,
    backgroundColor: width > 768 ? 'transparent' : theme.WHITE,
    paddingVertical: width > 768 ? 0 : 12,
    borderBottomWidth: width > 768 ? 0 : 1,
    borderBottomColor: width > 768 ? 'transparent' : theme.BORDER,
  },
  progressSteps: {
    gap: width > 768 ? 16 : 12,
    flexDirection: width > 768 ? 'column' : 'row',
    justifyContent: width > 768 ? 'flex-start' : 'space-between',
    alignItems: width > 768 ? 'flex-start' : 'center',
  },
  stepItem: {
    flexDirection: width > 768 ? 'row' : 'column',
    alignItems: 'center',
    gap: width > 768 ? 12 : 4,
    flex: width > 768 ? 0 : 1,
  },
  activeStep: {
    width: 12,
    height: 12,
    backgroundColor: theme.PRIMARY,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStepInner: {
    width: 6,
    height: 6,
    backgroundColor: theme.WHITE,
    borderRadius: 3,
  },
  inactiveStep: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderColor: theme.BORDER,
    borderRadius: 6,
  },
  activeStepText: {
    fontSize: width > 768 ? 14 : 12,
    fontWeight: '500',
    color: theme.PRIMARY,
    textAlign: 'center',
  },
  inactiveStepText: {
    fontSize: width > 768 ? 14 : 12,
    color: theme.TEXT_MUTED,
    textAlign: 'center',
  },
});

// 保持默认导出以向后兼容
export const progressStyles = createProgressStyles();

export const createQuestionStyles = (theme: any = COLORS) => StyleSheet.create({
  completedQuestionContainer: {
    marginBottom: -4, // 减少已完成问题之间的间距
  },
  currentQuestionCard: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
    marginBottom: width > 768 ? 20 : 16, // 大幅减少底部间距
    marginTop: 0, // 移除顶部间距，让两个区域紧贴
    minHeight: width > 768 ? 200 : 150, // 保持原先的移动端最小高度
  },
  completedQuestionRow: {
    backgroundColor: 'transparent',
    paddingVertical: 4, // 进一步减少从8到4
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8, // 减少从16到8
  },
  questionText: {
    fontSize: Platform.OS === 'web' ? (width > 768 ? 18 : 16) : 16,
    color: theme.TEXT_PRIMARY, // 改为黑色，通过外层透明度控制弱化效果
    lineHeight: Platform.OS === 'web' ? (width > 768 ? 26 : 22) : 22,
    flex: 1,
    // 移除opacity，通过外层容器控制透明度
  },
  currentQuestionText: {
    fontSize: Platform.OS === 'web' ? (width > 768 ? 20 : 18) : 18,
    color: theme.TEXT_PRIMARY,
    lineHeight: Platform.OS === 'web' ? (width > 768 ? 28 : 24) : 24,
    flex: 1,
    fontWeight: '500',
  },
  questionTextContainer: {
    flex: 1,
  },
  cursor: {
    color: theme.PRIMARY,
    fontWeight: 'bold',
  },
  errorText: {
    color: theme.ERROR,
    fontSize: Platform.OS === 'web' ? (width > 768 ? 16 : 14) : 14,
    marginTop: 4,
    marginLeft: 16,
  },
});

// 保持默认导出以向后兼容
export const questionStyles = createQuestionStyles();

export const createAvatarStyles = (theme: any = COLORS) => StyleSheet.create({
  avatarSimple: {
    width: LAYOUT.AVATAR_SIZE,
    height: LAYOUT.AVATAR_SIZE,
    backgroundColor: theme.BORDER,
    borderRadius: LAYOUT.AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  avatarEmoji: {
    fontSize: 18,
    textAlign: 'center',
  },
});

// 保持默认导出以向后兼容
export const avatarStyles = createAvatarStyles();

export const createAnswerStyles = (theme: any = COLORS) => StyleSheet.create({
  completedAnswerText: {
    marginLeft: 0, // 移除左边距，因为不再需要为头像留空间
    marginTop: -2, // 减少间距，从2改为-2
    paddingLeft: 0, // 移除左侧padding
    opacity: 0.8, // 整体降低透明度
  },
  answerValue: {
    fontSize: Platform.OS === 'web' ? (width > 768 ? 18 : 16) : 16,
    color: theme.TEXT_PRIMARY, // 改为黑色，通过外层透明度控制弱化效果
    fontWeight: '400',
    lineHeight: Platform.OS === 'web' ? (width > 768 ? 26 : 22) : 22,
    // 移除opacity，通过外层容器控制透明度
  },
  answerWithEdit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    gap: 10,
  },
  editAnswerButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    opacity: 0.9,
    
  },
});

// 保持默认导出以向后兼容
export const answerStyles = createAnswerStyles();

export const rightContentStyles = StyleSheet.create({
  rightContent: {
    width: '100%',
    minHeight: height * 1.2,
    maxWidth: width > 768 ? 700 : '100%',
    alignSelf: 'center',
    paddingTop: width > 768 ? 90 : 16, // 减少移动端顶部内边距，因为现在进度条在文档流中
  },
});

export const loadingStyles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: Platform.OS === 'web' ? (width > 768 ? 36 : 32) : 32,
  },
});