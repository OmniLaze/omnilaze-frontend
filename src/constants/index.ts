export const LAYOUT = {
  QUESTION_LINE_HEIGHT: 32,
  ANSWER_LINE_HEIGHT: 36,
  QUESTION_MARGIN: 53,
  ANSWER_MARGIN: 44,
  CURRENT_QUESTION_MARGIN: 80,
  INPUT_SECTION_HEIGHT: 100,
  BUTTON_HEIGHT: 50,
  AVATAR_SIZE: 32,
  ICON_SIZE: 20,
  BORDER_RADIUS: 12,
} as const;

export const TIMING = {
  TYPING_SPEED: 60,          // 主要问题的打字速度
  TYPING_SPEED_FAST: 40,     // 快速文本的打字速度（成功消息等）
  CURSOR_BLINK: 500,
  ANIMATION_DELAY: 0,        // 移除动画延迟以消除与打字机效果的冲突
  SCROLL_DELAY: 400,
  EMOTION_DURATION: 150,
  SHAKE_DURATION: 100,
  COMPLETION_DELAY: 3000,
} as const;

export const COLORS = {
  PRIMARY: '#FF9944',
  BACKGROUND: '#FFFFFF',
  WHITE: '#FFFFFF',
  TEXT_PRIMARY: '#000000',
  TEXT_SECONDARY: '#555555',
  TEXT_MUTED: '#AAAAAA',
  ERROR: '#ef4444',
  ERROR_BACKGROUND: '#FEF2F2',
  BORDER: '#AAAAAA',
  SHADOW: '#000',
} as const;

export const BUDGET_OPTIONS = ['20', '30', '40', '50'] as const;

// 根据食物类型的不同预算选项
export const BUDGET_OPTIONS_FOOD = ['20', '30', '50', '100'] as const;
export const BUDGET_OPTIONS_DRINK = ['15', '20', '30'] as const;

export const STEP_TITLES = [
  "配送地址",   // 步骤0: 想在哪里收到你的外卖？
  "食物类型",   // 步骤1: 喝奶茶还是吃饭呢？（保持配送地址标题）
  "忌口说明",   // 步骤2: 有忌口或者过敏源嘛？
  "口味偏好",   // 步骤3: 想吃什么口味的？
  "预算设置"    // 步骤4: 这一顿打算花多少钱？
] as const;

export const VALIDATION = {
  MIN_ADDRESS_LENGTH: 5,
  MIN_BUDGET: 10,
  PHONE_REGEX: /^1[3-9]\d{9}$/,
  MAX_PHONE_LENGTH: 11,
  CHARACTERS_PER_LINE: 20,
  ANSWER_CHARACTERS_PER_LINE: 25,
} as const;

export const DEV_CONFIG = {
  // 开发模式：设置为true时跳过JWT认证，使用模拟用户
  SKIP_AUTH: false, // 改为false，启用正常认证流程但使用开发模式后端
  // 开发模式下的模拟用户信息（仅在SKIP_AUTH为true时使用）
  MOCK_USER: {
    user_id: 'dev_user_123',
    phone_number: '13800138000',
    is_new_user: false,
  },
  // 开发模式固定验证码
  DEV_VERIFICATION_CODE: '100000',
  // 调色板调试工具开关
  ENABLE_COLOR_PALETTE: false, // 设置为true开启调色板功能，false完全禁用
} as const;