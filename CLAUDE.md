# Omnilaze Frontend - 懒得点外卖

## 项目概述

这是一个基于 React Native (Expo) 的智能外卖订餐应用前端，名为"懒得点外卖"。项目采用现代化的前端架构，支持 Web、iOS 和 Android 多平台部署，提供智能化的外卖点餐体验。

### 核心特性
- 🔐 **双重认证系统**：阿里云SP Token登录 + 手机验证码登录
- 📱 **智能表单流程**：渐进式信息收集（地址、食物类型、过敏源、口味、时间、预算）
- ⚡ **快速下单模式**：基于历史偏好的一键下单
- 🎁 **免单邀请系统**：邀请好友获得免单奖励
- 📊 **订单实时追踪**：WebSocket实时订单状态更新
- 💳 **支付集成**：支持微信支付等多种支付方式
- 🎨 **主题定制**：颜色主题系统支持
- 📱 **响应式设计**：完美适配移动端和桌面端

## 技术栈

### 核心框架
- **React Native**: 0.79.5 - 跨平台移动应用框架
- **Expo**: ~53.0.20 - React Native开发工具链
- **React**: 19.0.0 - UI组件库
- **TypeScript**: ~5.8.3 - 类型安全

### 关键依赖
- **react-native-web**: 跨平台Web支持
- **socket.io-client**: WebSocket实时通信
- **expo-av**: 音视频功能支持
- **@expo/vector-icons**: 丰富的图标库
- **motion**: 高性能动画库

### 开发工具
- **Webpack**: 构建配置
- **TypeScript**: 严格类型检查
- **ESLint & Prettier**: 代码规范和格式化

## 项目结构

```
omnilaze-frontend/
├── App.tsx                      # 主应用入口组件
├── index.ts                     # Expo入口文件
├── src/
│   ├── components/              # UI组件库
│   │   ├── ActionButton.tsx             # 通用操作按钮
│   │   ├── AddressAutocomplete.tsx      # 地址自动补全（高德地图集成）
│   │   ├── AliyunAuthComponent.tsx      # 阿里云认证组件
│   │   ├── AliyunLoginDemo.tsx          # 阿里云登录演示
│   │   ├── AuthComponent.tsx            # 认证主组件
│   │   ├── BaseInput.tsx               # 基础输入框组件
│   │   ├── BudgetInput.tsx             # 预算输入组件
│   │   ├── ColorPalette.tsx            # 调色板工具
│   │   ├── CompletedQuestion.tsx       # 已完成问题展示
│   │   ├── CurrentQuestion.tsx         # 当前问题展示（打字机效果）
│   │   ├── DeliveryTimeStep.tsx        # 配送时间选择
│   │   ├── ErrorBoundary.tsx           # 错误边界处理
│   │   ├── FloatingConfirmButton.tsx   # 浮动确认按钮
│   │   ├── FormContainers.tsx          # 表单容器组件
│   │   ├── ImageCheckbox.tsx           # 图片复选框
│   │   ├── InviteModalWithFreeDrink.tsx # 免单邀请弹窗
│   │   ├── LoadingDots.tsx             # 加载动画
│   │   ├── MobileHeader.tsx            # 移动端头部导航
│   │   ├── OrderConfirmationComponent.tsx # 订单确认组件
│   │   ├── OrderDetailModal.tsx        # 订单详情模态框
│   │   ├── OrderHistorySidebar.tsx     # 订单历史侧边栏
│   │   ├── OrderMessageBubble.tsx      # 订单消息气泡
│   │   ├── OrderMessageLog.tsx         # 订单消息日志
│   │   ├── OrderVoiceRecorder.tsx      # 语音录制组件
│   │   ├── PaymentComponent.tsx        # 支付组件
│   │   ├── ProgressSteps.tsx           # 进度条组件
│   │   ├── SimpleIcon.tsx              # 简单图标组件
│   │   ├── UserMenu.tsx               # 用户菜单
│   │   ├── VerificationCodeInput.tsx   # 验证码输入组件
│   │   ├── WebPortal.tsx               # Web门户组件
│   │   └── WizardFlatList.tsx          # 向导列表组件
│   ├── contexts/                # React Context
│   │   └── ColorThemeContext.tsx       # 颜色主题管理
│   ├── hooks/                   # 自定义Hooks
│   │   ├── index.ts                    # Hooks导出入口
│   │   ├── useAnimatedValue.ts         # 动画值管理
│   │   ├── useAppState.ts              # 应用状态管理
│   │   ├── useColorTheme.ts            # 颜色主题Hook
│   │   ├── useFormSteps.ts             # 表单步骤管理
│   │   ├── useOrderManagement.ts       # 订单管理逻辑
│   │   ├── useOrderSocket.ts           # WebSocket连接管理
│   │   └── useSafeTimeout.ts           # 安全的定时器管理
│   ├── services/                # API服务层
│   │   ├── api.ts                      # 主API服务
│   │   └── aliyunLogin.ts              # 阿里云登录服务
│   ├── platform/                # 平台特定代码
│   │   ├── useWebAdaptation.ts         # Web适配Hook
│   │   ├── useWebAdaptation.native.ts  # 原生适配Hook
│   │   └── web/
│   │       └── useWebAdaptation.web.ts # Web平台适配
│   ├── types/                   # TypeScript类型定义
│   │   └── index.ts                    # 类型定义文件
│   ├── utils/                   # 工具函数
│   │   ├── cookieManager.ts            # Cookie/Storage管理
│   │   ├── eventBus.ts                 # 事件总线
│   │   └── orderDataMapper.ts          # 订单数据映射
│   ├── data/                    # 静态数据
│   │   ├── checkboxOptions.ts          # 复选框选项配置
│   │   └── stepContent.ts              # 步骤内容配置
│   ├── constants/               # 常量定义
│   │   └── index.ts                    # 应用常量
│   ├── config/                  # 配置文件
│   │   └── env.ts                      # 环境变量配置
│   └── styles/                  # 样式文件
│       ├── global.css                  # 全局CSS（Web端）
│       ├── globalStyles.ts             # 全局样式定义
│       ├── addressStyles.ts            # 地址组件样式
│       └── inputStyles.ts              # 输入框样式
├── assets/                      # 静态资源
│   ├── allergies/               # 过敏源图标
│   ├── food/                    # 食物类型图标
│   ├── preferences/             # 口味偏好图标
│   ├── social/                  # 社交分享图片
│   └── wechatpay/               # 支付相关图片
├── scripts/                     # 构建和部署脚本
├── package.json                 # 项目依赖配置
├── tsconfig.json               # TypeScript配置
├── app.json                    # Expo配置
├── metro.config.js             # Metro打包配置
└── webpack.config.js           # Webpack配置
```

## 核心架构设计

### 1. 状态管理架构

#### 全局状态管理 (`useAppState`)
项目采用基于 React Hooks 的状态管理模式，核心状态管理通过 `useAppState` Hook 实现：

```typescript
// src/hooks/useAppState.ts
export const useAppState = () => {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);
  
  // 表单数据
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedFoodType, setSelectedFoodType] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [deliveryTime, setDeliveryTime] = useState('');
  
  // 流程控制
  const [currentStep, setCurrentStep] = useState(0);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  
  // 订单状态
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  
  // 自动保存到LocalStorage/Cookie
  // 页面刷新时自动恢复状态
};
```

### 2. 表单流程管理

#### 步骤定义和流程控制
```typescript
// src/constants/index.ts
export const STEP_TITLES = [
  "配送地址",    // Step 0: 地址输入（支持高德地图自动补全）
  "食物类型",    // Step 1: 奶茶/饭菜/其他选择
  "忌口说明",    // Step 2: 过敏源选择（可跳过）
  "口味偏好",    // Step 3: 口味偏好选择
  "用餐时间",    // Step 4: ASAP或预约时间
  "预算设置",    // Step 5: 预算金额输入
  "订单确认"     // Step 6: 最终确认
];

// src/hooks/useFormSteps.ts
export const useFormSteps = () => {
  // 智能跳步逻辑
  // - 选择奶茶时自动跳过过敏源步骤
  // - 快速下单模式跳过已有偏好步骤
  // - 支持任意步骤的编辑回退
};
```

### 3. 动画系统

#### 核心动画效果
- **打字机效果**：AI逐字显示问题文本，营造对话感
- **流动动画**：问题完成后平滑上推85px
- **渐变动画**：输入框和按钮的渐入渐出
- **页面切换**：已完成问题和当前问题的滑动切换

```typescript
// App.tsx - 动画常量
const FIXED_PUSH_DISTANCE = 85; // 统一上推距离

// 动画协调系统
const animations = {
  questionAnimations: [], // 每个步骤的问题动画
  answerAnimations: [],   // 每个步骤的答案动画
  currentQuestionAnimation: new Animated.Value(0),
  inputSectionAnimation: new Animated.Value(0)
};
```

### 4. 认证系统架构

#### 双重认证模式
1. **阿里云SP Token认证**（推荐）
   - 一键登录，无需输入手机号
   - 运营商级别安全验证
   - 用户体验最佳

2. **传统短信验证码**（备用）
   - 手机号 + 验证码登录
   - 支持新用户注册
   - 邀请码验证流程

```typescript
// src/components/AliyunAuthComponent.tsx
interface AuthFlow {
  mode: 'aliyun' | 'sms';
  steps: [
    'input',           // 输入SP Token或手机号
    'verification',    // 验证Token或验证码
    'invite'          // 新用户输入邀请码
  ];
}
```

## API集成架构

### 1. 核心API服务 (`src/services/api.ts`)

#### 认证相关API
```typescript
// 阿里云登录
loginWithAliyunSpToken(spToken: string): Promise<AliyunLoginResponse>

// 短信验证
sendVerificationCode(phoneNumber: string): Promise<ApiResponse>
verifyCodeAndLogin(phoneNumber: string, code: string): Promise<VerificationResponse>

// 邀请系统
verifyInviteCodeAndCreateUser(phoneNumber: string, inviteCode: string): Promise<InviteCodeResponse>
getUserInviteStats(userId: string): Promise<UserInviteStatsResponse>
```

#### 地址搜索API（高德地图集成）
```typescript
// 智能地址搜索 - 核心优化功能
searchAddress(keywords: string): Promise<AddressSearchResponse>
// 特性：
// - 最少4个汉字触发搜索
// - 500ms防抖优化
// - 5分钟缓存机制
// - API调用量减少70-85%
```

#### 订单管理API
```typescript
// 订单生命周期
createOrder(orderData: OrderData): Promise<CreateOrderResponse>
submitOrder(orderId: string): Promise<SubmitOrderResponse>
getOrderDetails(orderId: string): Promise<OrderDetailsResponse>
submitOrderFeedback(orderId: string, rating: number, feedback: string): Promise<ApiResponse>

// 快速下单
checkPreferencesCompleteness(userId: string): Promise<PreferencesCheckResponse>
getPreferencesAsFormData(userId: string): Promise<PreferencesFormData>
```

#### 支付相关API
```typescript
// 支付流程
createPaymentSession(orderId: string, paymentMethod: string): Promise<PaymentResponse>
checkPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>
```

### 2. WebSocket实时通信 (`src/hooks/useOrderSocket.ts`)

#### 实时事件监听
```typescript
export const useOrderSocket = (userId?: string) => {
  // 连接管理
  const socket = useRef<Socket | null>(null);
  
  // 事件类型
  // - order:update - 订单状态更新
  // - payment:update - 支付状态更新
  // - order:eta_set - 预计送达时间设置
  // - order:delivered - 订单送达（含图片）
  
  // 自动重连机制
  // 断线重连策略：指数退避
};
```

### 3. 环境配置 (`src/config/env.ts`)
```typescript
export const ENV_CONFIG = {
  // API配置
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  
  // 高德地图配置
  AMAP_KEY: process.env.REACT_APP_AMAP_KEY || 'default_key',
  
  // 功能开关
  ENABLE_ALIYUN_LOGIN: process.env.REACT_APP_ENABLE_ALIYUN_LOGIN === 'true',
  ENABLE_WEBSOCKET: process.env.REACT_APP_ENABLE_WEBSOCKET !== 'false',
  
  // 环境标识
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};
```

## 关键特性实现

### 1. 响应式设计与移动端优化

#### 平台适配策略
```typescript
// src/platform/useWebAdaptation.ts
export const useWebAdaptation = () => {
  // 移动端viewport设置
  // 禁用缩放，固定视口
  // 修复iOS字体缩放问题
  // 处理安全区域（刘海屏）
};
```

#### 响应式布局
- **桌面端**（>768px）：显示进度条、用户菜单、侧边栏
- **移动端**（≤768px）：紧凑头部、底部按钮、手势操作

### 2. 快速下单模式

#### 智能偏好系统
```typescript
// 老用户登录检测
const checkQuickOrder = async (userId: string) => {
  const { can_quick_order, preferences } = await checkPreferencesCompleteness(userId);
  
  if (can_quick_order) {
    // 自动填充历史数据
    // 跳转到确认步骤
    // 仍允许修改任意字段
  }
};
```

#### 用户体验优化
- 老用户登录后自动检测历史偏好
- 预填充表单数据
- 直接跳转到最终确认步骤
- 仍允许用户修改任意字段

### 3. 免单邀请系统

#### 邀请奖励机制
- 每个用户唯一邀请码
- 成功邀请3人获得免单资格
- 全局免单数量限制（前100名）
- 免单自动应用到下一单

```typescript
// src/components/InviteModalWithFreeDrink.tsx
interface InviteRewardSystem {
  userInviteCode: string;        // 用户邀请码
  currentUses: number;           // 已邀请人数
  maxUses: number;              // 需要邀请人数（3人）
  eligibleForFree: boolean;     // 是否有免单资格
  freeOrderClaimed: boolean;    // 是否已使用免单
  globalRemaining: number;      // 全局剩余免单数
}
```

### 4. 地址智能搜索（核心优化）

#### 高德地图集成优化
```typescript
// src/components/AddressAutocomplete.tsx
const AddressAutocomplete = {
  // 输入验证
  minChineseChars: 4,           // 最少汉字数
  debounceDelay: 500,           // 防抖延迟
  
  // 缓存策略
  cacheExpiry: 5 * 60 * 1000,   // 5分钟缓存
  cacheHitRate: '70-85%',       // 缓存命中率
  
  // 搜索优化
  maxSuggestions: 8,             // 最多建议数
  prioritySort: true,            // 按相关度排序
  
  // 降级处理
  fallbackEnabled: false,        // API失败不显示模拟数据
};
```

### 5. 支付集成

#### 支付流程
```typescript
// src/components/PaymentComponent.tsx
interface PaymentFlow {
  methods: ['wechat', 'alipay']; // 支付方式
  
  process: [
    'createSession',    // 创建支付会话
    'showQRCode',      // 显示支付二维码
    'polling',         // 轮询支付状态
    'confirmed'        // 支付确认
  ];
  
  timeout: 300000;     // 5分钟超时
  pollingInterval: 2000; // 2秒轮询
}
```

## 数据持久化

### 1. 状态管理 (`src/utils/cookieManager.ts`)

#### 分层存储策略
```typescript
export const CookieManager = {
  // 用户会话（长期存储）
  userSession: {
    userId: string,
    phoneNumber: string,
    isNewUser: boolean,
    inviteCode?: string
  },
  
  // 对话状态（会话级存储）
  conversationState: {
    currentStep: number,
    completedAnswers: Answer[],
    editingStep?: number,
    formData: FormData
  },
  
  // UI偏好（永久存储）
  preferences: {
    theme: 'light' | 'dark',
    focusMode: boolean,
    language: 'zh-CN' | 'en'
  }
};
```

### 2. 自动恢复机制
- 页面刷新自动恢复表单数据
- 网络中断自动保存进度
- 登录状态7天有效期
- 表单数据24小时有效期

## 开发模式

### 1. 开发配置 (`src/constants/index.ts`)
```typescript
export const DEV_CONFIG = {
  // 功能开关
  SKIP_AUTH: false,              // 跳过认证流程
  MOCK_API_RESPONSES: false,     // 模拟API响应
  ENABLE_COLOR_PALETTE: false,   // 启用调色板工具
  
  // 模拟数据
  MOCK_USER: {
    user_id: 'dev_user_123',
    phone_number: '13800138000',
    is_new_user: false,
  },
  
  // 开发工具
  DEV_VERIFICATION_CODE: '100000',  // 固定验证码
  CONSOLE_LOGS: true,               // 控制台日志
  PERFORMANCE_MONITOR: false        // 性能监控
};
```

### 2. 调试工具
- React Developer Tools集成
- Expo DevTools支持
- Redux DevTools（如使用Redux）
- Network Inspector网络监控
- Performance Monitor性能分析

## 部署配置

### 1. 构建脚本 (`package.json`)
```json
{
  "scripts": {
    // 开发环境
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    
    // 生产构建
    "build": "expo export -p web --output-dir dist",
    "build:production": "REACT_APP_API_URL=https://backend.omnilaze.co expo export -p web --output-dir dist",
    "build:aws": "REACT_APP_API_URL=https://backend.omnilaze.co expo export -p web --output-dir dist"
  }
}
```

### 2. 多环境支持
- **开发环境**: localhost:3000
- **测试环境**: staging.omnilaze.co
- **生产环境**: backend.omnilaze.co
- **CDN部署**: CloudFront/CloudFlare

### 3. 部署脚本 (`deploy-frontend-aws.sh`)
```bash
#!/bin/bash
# AWS S3 + CloudFront部署
npm run build:production
aws s3 sync dist/ s3://omnilaze-frontend --delete
aws cloudfront create-invalidation --distribution-id EXXX --paths "/*"
```

## 性能优化

### 1. 代码分割
- 路由级别的懒加载
- 组件级别的动态导入
- 第三方库按需加载

### 2. 资源优化
- 图片懒加载和压缩
- 字体子集化
- CSS Tree-shaking
- JavaScript压缩混淆

### 3. 缓存策略
- API响应缓存（5分钟）
- 静态资源CDN缓存
- Service Worker离线缓存
- LocalStorage状态缓存

### 4. 动画性能
- 使用`useNativeDriver`优化
- 避免频繁的布局重排
- 使用`InteractionManager`延迟任务
- 动画节流和防抖

## 安全最佳实践

### 1. 认证安全
- JWT Token安全存储
- Token自动刷新机制
- 敏感信息加密传输
- XSS/CSRF防护

### 2. 数据安全
- 输入验证和净化
- SQL注入防护
- API速率限制
- 敏感数据脱敏显示

### 3. 通信安全
- HTTPS强制使用
- WebSocket加密传输
- API签名验证
- 防重放攻击

## 测试策略

### 1. 单元测试
- 组件测试（React Testing Library）
- Hook测试（@testing-library/react-hooks）
- 工具函数测试（Jest）

### 2. 集成测试
- API集成测试
- WebSocket通信测试
- 状态管理测试

### 3. E2E测试
- Detox（React Native）
- Cypress（Web端）
- 用户流程自动化测试

## 代码规范

### 1. TypeScript规范
- 严格类型检查（strict: true）
- 接口优于类型别名
- 避免any类型
- 泛型合理使用

### 2. React规范
- 函数组件 + Hooks
- 组件单一职责原则
- Props接口明确定义
- 避免过度渲染

### 3. 样式规范
- StyleSheet.create使用
- 主题变量统一管理
- 响应式设计优先
- 避免内联样式

### 4. 命名规范
- 组件：PascalCase
- 函数/变量：camelCase
- 常量：UPPER_SNAKE_CASE
- 文件：组件同名

## 故障排查

### 常见问题

1. **地址搜索无结果**
   - 检查高德API Key配置
   - 确认输入至少4个汉字
   - 查看网络请求是否成功

2. **WebSocket连接失败**
   - 检查后端WebSocket服务状态
   - 确认防火墙/代理设置
   - 查看控制台错误信息

3. **支付无法完成**
   - 验证支付配置正确性
   - 检查支付回调URL
   - 查看支付日志

4. **动画卡顿**
   - 启用useNativeDriver
   - 减少同时运行的动画
   - 优化组件重渲染

## 版本历史

### v1.0.0 (2024-01)
- 初始版本发布
- 基础订餐功能
- 手机验证登录

### v1.1.0 (2024-02)
- 新增阿里云SP Token登录
- 优化地址搜索（缓存机制）
- 添加WebSocket实时更新

### v1.2.0 (2024-03)
- 免单邀请系统上线
- 支付功能集成
- 性能优化（减少70%API调用）

## 维护指南

### 日常维护
1. 定期更新依赖包
2. 监控错误日志
3. 性能指标追踪
4. 用户反馈收集

### 紧急响应
1. 生产环境回滚机制
2. 热修复部署流程
3. 错误监控告警
4. 应急联系方式

## 联系方式

- 技术支持：tech@omnilaze.co
- 产品反馈：feedback@omnilaze.co
- 紧急联系：+86 13800138000

---

*本文档最后更新时间：2024-12-27*
*文档版本：v2.0.0*