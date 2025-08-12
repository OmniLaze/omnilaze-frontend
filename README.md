# 项目开发指南

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── ActionButton.tsx          # 通用按钮组件
│   ├── AddressAutocomplete.tsx   # 地址自动完成组件 ⭐
│   ├── AuthComponent.tsx         # 认证组件
│   ├── BaseInput.tsx             # 基础输入组件
│   ├── BudgetInput.tsx           # 预算输入组件
│   ├── CompletedQuestion.tsx     # 已完成问题组件
│   ├── CurrentQuestion.tsx       # 当前问题组件
│   ├── DevAuthComponent.tsx      # 开发模式认证组件
│   ├── ImageCheckbox.tsx         # 图像复选框组件
│   ├── MapComponent.tsx          # 地图组件
│   ├── ProgressSteps.tsx         # 进度步骤组件
│   └── WebPortal.tsx             # Web端Portal组件
├── config/
│   └── env.ts                    # 环境变量配置 ⭐
├── constants/
│   └── index.ts                  # 项目常量
├── data/
│   ├── checkboxOptions.ts        # 复选框选项数据
│   └── stepContent.ts            # 步骤内容数据
├── hooks/
│   └── index.ts                  # 自定义Hooks
├── services/
│   └── api.ts                    # API服务层 ⭐
├── styles/
│   ├── addressStyles.ts          # 地址组件样式 ⭐
│   ├── global.css                # 全局CSS
│   ├── globalStyles.ts           # 全局样式
│   ├── inputStyles.ts            # 输入框样式
│   └── mapStyles.ts              # 地图样式
└── types/
    └── index.ts                  # TypeScript类型定义
```

## 🌟 核心功能 - 地址自动完成

### 功能特点
- ✅ **真实地址搜索** - 集成高德地图API
- ✅ **智能输入限制** - 至少4个汉字才开始搜索
- ✅ **智能缓存机制** - 5分钟缓存，减少API调用70-85%
- ✅ **防抖优化** - 500ms延迟避免频繁请求
- ✅ **降级处理** - API失败时不显示模拟数据
- ✅ **跨平台支持** - Web和Native环境

### 使用方法
```tsx
import { AddressAutocomplete } from '../components/AddressAutocomplete';

<AddressAutocomplete
  value={address}
  onChangeText={handleAddressChange}
  onSelectAddress={handleSelectAddress}
  placeholder="请输入您的地址"
/>
```

### 配置要求
1. **高德API Key**: 在 `src/config/env.ts` 中配置
2. **输入限制**: 至少4个汉字（使用 `/[\u4e00-\u9fff]/g` 识别）
3. **缓存策略**: 自动管理，无需手动清理

## 🔧 开发模式

### 快速启动
项目支持开发模式，可跳过JWT认证直接测试功能：

```typescript
// src/constants/index.ts
export const DEV_CONFIG = {
  SKIP_AUTH: true,  // 设置为true启用开发模式
  MOCK_USER: {
    user_id: 'dev_user_123',
    phone_number: '13800138000',
    is_new_user: false,
  },
};
```

### 开发模式特点
- 🔧 **自动认证** - 应用启动时自动完成认证
- 🔧 **跳过验证** - 无需真实手机号和验证码
- 🔧 **功能完整** - 除认证外所有功能正常工作

## 🚀 部署配置

### AWS部署（推荐）
```bash
# 首次设置AWS基础设施
./infra/setup-aws-frontend.sh

# 部署到AWS S3 + CloudFront
./deploy-aws.sh
```

详细部署指南请查看：[AWS-DEPLOYMENT.md](./AWS-DEPLOYMENT.md)

### Cloudflare部署（旧方式）
项目原本部署在Cloudflare Pages，配置已保留在`_redirects`文件中。

### 环境变量
```bash
# AWS生产环境（推荐）
REACT_APP_API_URL=https://backend.omnilaze.co
REACT_APP_AMAP_KEY=your_amap_key_here

# Cloudflare环境（备用）
REACT_APP_API_URL=https://omnilaze-universal-api.stevenxxzg.workers.dev
REACT_APP_AMAP_KEY=your_amap_key_here

# 本地开发
REACT_APP_API_URL=http://localhost:5002
REACT_APP_AMAP_KEY=your_amap_key_here
```

### 生产环境
1. 获取高德API Key：[高德开放平台](https://lbs.amap.com/)
2. 配置环境变量到部署平台
3. 关闭开发模式：`DEV_CONFIG.SKIP_AUTH = false`

## 📊 性能优化

### API调用优化
- **输入限制**: 4个汉字 → 减少无效搜索
- **防抖延迟**: 500ms → 避免频繁调用
- **缓存机制**: 5分钟 → 重复搜索使用缓存
- **结果限制**: 最多8个 → 减少数据传输

### 预期效果
- **API调用减少**: 70-85%
- **响应速度**: 缓存命中时几乎无延迟
- **用户体验**: 流畅的输入和选择体验

## 🐛 故障排除

### 地址搜索不工作
1. 检查API Key配置：`src/config/env.ts`
2. 确认输入至少4个汉字
3. 查看控制台错误信息
4. 测试API连通性

### 点击建议无响应
1. 检查控制台日志："建议项被选择"
2. 确认TouchableOpacity配置
3. 验证事件处理链

### 开发模式问题
1. 确认 `DEV_CONFIG.SKIP_AUTH` 设置
2. 重启开发服务器
3. 清理缓存：`rm -rf .expo node_modules/.cache`

## 📝 代码规范

### 组件命名
- PascalCase for components: `AddressAutocomplete.tsx`
- camelCase for functions: `handleSelectAddress`
- UPPER_CASE for constants: `DEV_CONFIG`

### 文件组织
- 一个组件一个文件
- 相关样式放在同一目录
- 共享类型统一在 `types/` 目录

### 注释规范
- 公共API必须有JSDoc注释
- 复杂逻辑添加说明注释
- TODO标记待优化项

## 🔄 更新日志

### v1.2.0 (当前版本)
- ✅ 集成高德地图API
- ✅ 实现地址自动完成功能
- ✅ 优化API调用策略
- ✅ 添加开发模式支持
- ✅ 完善错误处理和降级方案

### 下一步计划
- 🔄 集成更多地图服务提供商
- 🔄 添加地址历史记录
- 🔄 优化移动端体验
- 🔄 添加单元测试

---

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 📄 许可证

MIT License - 详见LICENSE文件