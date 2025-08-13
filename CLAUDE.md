# Omnilaze Frontend - 懒得点外卖

## 项目概述

这是一个基于 React Native (Expo) 的外卖订餐应用前端，名为"懒得点外卖"。项目采用现代化的前端架构，支持 Web、iOS 和 Android 多平台部署。

### 核心功能
- 手机号验证码登录/注册
- 智能表单填写流程（地址、食物类型、过敏源、口味偏好、用餐时间、预算）
- 快速下单模式（老用户基于历史偏好）
- 免单邀请系统
- 订单历史管理
- 语音反馈功能
- 响应式设计（移动端优化）

## 技术栈

### 核心框架
- **React Native**: 0.79.5
- **Expo**: ~53.0.20  
- **React**: 19.0.0
- **TypeScript**: ~5.8.3

### 关键依赖
- `react-native-web`: 跨平台支持
- `socket.io-client`: 实时通信
- `expo-location`: 地理位置服务
- `react-native-maps`: 地图集成
- `@expo/vector-icons`: 图标库

### 开发工具
- Webpack 配置
- TypeScript 严格模式
- ESLint 代码规范

## 项目结构

```
src/
├── components/          # UI组件库
│   ├── ActionButton.tsx         # 操作按钮组件
│   ├── AddressAutocomplete.tsx  # 地址自动补全
│   ├── AuthComponent.tsx        # 认证组件
│   ├── BaseInput.tsx           # 基础输入组件
│   ├── BudgetInput.tsx         # 预算输入组件
│   ├── CompletedQuestion.tsx   # 已完成问题显示
│   ├── CurrentQuestion.tsx     # 当前问题显示
│   ├── DeliveryTimeStep.tsx    # 配送时间选择
│   ├── FormContainers.tsx      # 表单容器组件
│   ├── ImageCheckbox.tsx       # 图像复选框
│   ├── InviteModalWithFreeDrink.tsx # 免单邀请弹窗
│   ├── MobileHeader.tsx        # 移动端头部
│   ├── OrderConfirmationComponent.tsx # 订单确认
│   ├── OrderDetailModal.tsx    # 订单详情模态框
│   ├── OrderHistorySidebar.tsx # 订单历史侧边栏
│   ├── OrderMessageBubble.tsx  # 订单消息气泡
│   ├── OrderMessageLog.tsx     # 订单消息日志
│   ├── OrderVoiceRecorder.tsx  # 订单语音录制
│   ├── PaymentComponent.tsx    # 支付组件
│   ├── ProgressSteps.tsx       # 进度条
│   ├── UserMenu.tsx           # 用户菜单
│   └── VerificationCodeInput.tsx # 验证码输入
├── contexts/            # React Context
│   └── ColorThemeContext.tsx   # 颜色主题管理
├── hooks/               # 自定义Hooks
│   ├── index.ts                # Hooks入口
│   ├── useAppState.ts          # 应用状态管理
│   ├── useColorTheme.ts        # 颜色主题Hook
│   ├── useFormSteps.ts         # 表单步骤管理
│   ├── useOrderManagement.ts   # 订单管理
│   └── useOrderSocket.ts       # Socket连接管理
├── services/            # API服务层
│   ├── api.ts                  # 主要API服务
│   └── aliyunLogin.ts          # 阿里云登录服务
├── types/               # TypeScript类型定义
│   └── index.ts
├── utils/               # 工具函数
│   ├── cookieManager.ts        # Cookie/LocalStorage管理
│   └── orderDataMapper.ts      # 订单数据映射
├── data/                # 静态数据
│   ├── checkboxOptions.ts      # 复选框选项数据
│   └── stepContent.ts          # 步骤内容配置
├── constants/           # 常量配置
│   └── index.ts                # 应用常量
├── config/              # 配置文件
│   └── env.ts                  # 环境变量配置
└── styles/              # 样式文件
    ├── global.css              # 全局CSS
    ├── globalStyles.ts         # 全局样式
    ├── addressStyles.ts        # 地址相关样式
    └── inputStyles.ts          # 输入框样式
```

## 核心架构设计

### 1. 状态管理架构
项目采用基于 React Hooks 的状态管理，主要通过以下几个核心Hook：

#### `useAppState` (src/hooks/useAppState.ts:8)
- 管理全局应用状态
- 自动保存/恢复状态到 Cookie/LocalStorage
- 支持开发模式的模拟数据

#### 关键状态分类：
```typescript
// 认证状态
isAuthenticated, authResult, authQuestionText

// 表单状态  
address, budget, selectedAllergies, selectedPreferences, selectedFoodType

// 流程控制
currentStep, completedAnswers, editingStep

// 订单状态
currentOrderId, isOrderSubmitting, isSearchingRestaurant, isOrderCompleted

// UI状态
isFreeOrder, isQuickOrderMode, showFreeDrinkModal
```

### 2. 组件架构

#### 主应用组件 (App.tsx:64)
`OmnilazeAppContent` - 主要应用逻辑容器，管理：
- 移动端适配和字体缩放修复
- 动画系统协调
- 滚动行为管理
- 问题显示流程控制

#### 核心UI组件
- `CurrentQuestion` - 当前问题显示，支持打字机效果
- `CompletedQuestion` - 已完成问题显示，支持编辑
- `FormInputContainer` - 统一的表单输入容器
- `MobileHeader` - 移动端响应式头部

### 3. 表单流程管理

#### 步骤定义 (src/constants/index.ts:44)
```typescript
const STEP_TITLES = [
  "配送地址",   // 步骤0: 地址输入
  "食物类型",   // 步骤1: 奶茶/饭菜选择  
  "忌口说明",   // 步骤2: 过敏源选择
  "口味偏好",   // 步骤3: 味道偏好
  "用餐时间",   // 步骤4: 配送时间
  "预算设置"    // 步骤5: 价格预算
];
```

#### 流程控制 (src/hooks/useFormSteps.ts)
- 支持步骤跳转（如选择奶茶时跳过部分步骤）
- 编辑模式：可回退修改已完成的步骤
- 验证机制：每步都有对应的验证逻辑

### 4. 动画系统

#### 核心动画 (App.tsx:244)
- **打字机效果**: 模拟AI逐字显示问题文本
- **流动动画**: 问题完成后的上推效果
- **页面滚动**: 已完成问题页面与当前问题页面的平滑切换
- **输入框动画**: 渐入渐出效果

#### 动画协调机制
```typescript
// 问题动画数组 - 每个步骤对应一个动画值
questionAnimations: Animated.Value[]
answerAnimations: Animated.Value[]

// 当前问题动画
currentQuestionAnimation: Animated.Value

// 输入框动画
inputSectionAnimation: Animated.Value
```

## API集成架构

### 1. API服务层 (src/services/api.ts)

#### 核心功能模块：
- **认证系统**: 手机验证码发送/验证
- **地址搜索**: 高德地图API集成
- **订单管理**: 创建/提交订单
- **用户偏好**: 快速下单数据管理
- **邀请系统**: 免单邀请功能

#### API错误处理策略 (src/services/api.ts:131)
```typescript
function handleApiError(error: any, context: string): string {
  // 网络错误、超时、服务器错误的统一处理
  // 提供用户友好的错误提示
}
```

#### 请求增强功能：
- 自动重试机制（网络抖动容错）
- JWT认证自动附加
- 超时控制
- 错误统一处理

### 2. 环境配置 (src/config/env.ts)
```typescript
export const ENV_CONFIG = {
  AMAP_KEY: process.env.REACT_APP_AMAP_KEY || 'f5c712f69f486f3c20627dee943e0a32',
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  ENABLE_ALIYUN_LOGIN: process.env.REACT_APP_ENABLE_ALIYUN_LOGIN === 'true'
};
```

## 关键特性实现

### 1. 响应式设计与移动端优化

#### 自适应布局 (App.tsx:66)
- 动态viewport设置
- 移动设备检测
- 字体缩放修复
- 触摸优化

#### 双平台UI (App.tsx:1440)
```typescript
// 桌面端：显示进度条、用户菜单
{Platform.OS === 'web' && width > 768 && (
  <ProgressSteps currentStep={currentStep} />
)}

// 移动端：紧凑型头部、手势操作
{Platform.OS !== 'web' && (
  <MobileHeader title={getStepTitle(currentStep)} />
)}
```

### 2. 快速下单模式 (App.tsx:1066)

#### 智能偏好检测
```typescript
const preferencesCheck = await checkPreferencesCompleteness(userId);
if (preferencesCheck.can_quick_order) {
  // 自动填充历史偏好数据
  // 跳转到确认步骤
  setIsQuickOrderMode(true);
}
```

#### 用户体验优化
- 老用户登录后自动检测历史偏好
- 预填充表单数据
- 直接跳转到最终确认步骤
- 仍允许用户修改任意字段

### 3. 免单邀请系统

#### 邀请逻辑 (src/components/InviteModalWithFreeDrink.tsx)
- 每个用户有唯一邀请码
- 成功邀请后获得免单资格
- 全局免单数量限制
- 免单使用状态跟踪

#### 免单流程自动化 (App.tsx:655)
```typescript
useEffect(() => {
  if (isFreeOrder && currentStep === 1) {
    // 免单模式自动选择奶茶并推进流程
    setTimeout(() => formSteps.handleNext(), 1000);
  }
}, [isFreeOrder, currentStep]);
```

### 4. 地址搜索优化 (src/services/api.ts:439)

#### 智能搜索策略
- 最少4个汉字触发搜索
- 500ms防抖减少API调用  
- 5分钟智能缓存
- 最多8个地址建议

#### 降级处理
```typescript
// 高德API失败时的graceful degradation
if (!AMAP_KEY || !response.ok) {
  return getFallbackResults(keywords);
}
```

## 数据持久化

### 1. Cookie/LocalStorage管理 (src/utils/cookieManager.ts)

#### 数据分层存储：
- **用户会话**: userId, phoneNumber, isNewUser
- **对话状态**: 当前步骤、已完成答案、编辑状态
- **UI偏好**: 焦点模式、主题设置

#### 状态恢复机制 (src/hooks/useAppState.ts:132)
```typescript
useEffect(() => {
  // 页面刷新时自动恢复状态
  const savedSession = CookieManager.getUserSession();
  const savedConversation = CookieManager.getConversationState();
  
  if (savedSession) {
    // 恢复认证状态和表单数据
  }
}, []);
```

### 2. 开发模式支持 (src/constants/index.ts:62)
```typescript
export const DEV_CONFIG = {
  SKIP_AUTH: false,           // 跳过认证（开发调试）
  MOCK_USER: {...},           // 模拟用户数据
  DEV_VERIFICATION_CODE: '100000',  // 开发验证码
  ENABLE_COLOR_PALETTE: false       // 调色板工具
};
```

## 部署配置

### 1. 构建脚本 (package.json:5)
```json
{
  "scripts": {
    "start": "expo start",
    "build": "expo export -p web --output-dir dist",
    "build:production": "REACT_APP_API_URL=https://omnilaze-universal-api.stevenxxzg.workers.dev expo export -p web --output-dir dist",
    "build:aws": "REACT_APP_API_URL=https://backend.omnilaze.co expo export -p web --output-dir dist"
  }
}
```

### 2. 多环境支持
- **开发环境**: localhost:3000
- **生产环境**: AWS后端 / Cloudflare Workers
- **移动端**: Expo Go / 独立应用

### 3. 静态资源管理 (assets/)
- 食物类型图标：美食、饮品、其他
- 过敏源图标：坚果、海鲜、乳制品等
- 口味偏好图标：清淡、香辣、甜口等
- 应用图标和启动页

## 代码规范与最佳实践

### 1. TypeScript规范
- 严格类型检查
- 接口定义分离 (src/types/index.ts)
- 泛型API响应类型

### 2. 组件设计原则
- 单一职责：每个组件功能明确
- Props接口标准化
- 可复用性：BaseInput, ActionButton等
- 响应式设计：Platform.OS条件渲染

### 3. 性能优化
- useCallback/useMemo优化重渲染
- 图像懒加载
- API请求缓存
- 动画性能优化（useNativeDriver）

### 4. 错误处理
- API错误统一处理
- 用户友好错误提示
- 网络错误重试机制
- 开发环境详细日志

## 开发调试

### 1. 开发模式功能
- 跳过认证流程
- 模拟用户数据
- 调色板工具（主题定制）
- 详细控制台日志

### 2. 调试工具
- React Developer Tools支持
- Expo DevTools集成
- TypeScript类型检查
- Hot Reload开发

### 3. 测试支持
- 移动端：Expo Go扫码测试
- Web端：localhost开发服务器
- 生产模拟：构建后本地测试

## 主要开发注意事项

### 1. 状态管理
- 优先使用useAppState管理全局状态
- 组件间通信通过props传递
- 避免prop drilling，合理使用Context

### 2. 动画开发
- 所有动画使用useNativeDriver提升性能
- 注意动画冲突，使用动画锁机制
- 移动端动画简化，避免性能问题

### 3. API集成
- 使用统一的API服务层
- 错误处理要考虑网络异常
- 敏感数据使用JWT认证
- API响应要进行类型检查

### 4. 平台兼容性
- 使用Platform.OS进行平台特定代码
- 注意移动端和Web端的差异
- 测试多平台行为一致性

这个文档提供了对Omnilaze前端项目的全面理解，涵盖了架构设计、核心功能、技术实现和开发实践。在修改代码时，请遵循现有的架构模式和代码规范。