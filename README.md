根据项目配置分析，在另一台电脑上运行前端需要以下条件：

  1. 📋 基础环境要求

  # Node.js环境
  Node.js: 18+ 版本
  npm: 最新版本 (或 yarn@4.9.1)

  # 移动端开发工具 (可选)
  Expo CLI: npm install -g @expo/cli
  Android Studio (Android开发)
  Xcode (iOS开发，仅macOS)

  2. 📂 项目文件

  需要完整的前端项目文件：
  omnilaze-universal/omnilaze-frontend/
  ├── package.json          # 依赖配置
  ├── src/                  # 源代码
  ├── assets/              # 静态资源
  ├── App.tsx              # 主应用文件
  └── 其他配置文件...

  3. 🔑 环境变量配置

  必需的环境变量:
  # 方式1: 创建 .env 文件
  REACT_APP_AMAP_KEY=f5c712f69f486f3c20627dee943e0a32
  REACT_APP_API_URL=http://localhost:3000  # 本地开发时
  # 或
  REACT_APP_API_URL=https://backend.omnilaze.co  # 如果后端部署了

  # 方式2: 直接在终端设置
  export REACT_APP_AMAP_KEY=f5c712f69f486f3c20627dee943e0a32
  export REACT_APP_API_URL=http://localhost:3000

  4. 🛠️ 安装和启动步骤

  # 1. 克隆或复制项目
  cd omnilaze-frontend

  # 2. 安装依赖
  npm install
  # 或
  yarn install

  # 3. 启动开发服务器
  npm start          # 启动Expo开发服务器
  npm run web        # 直接启动Web版本
  npm run android    # Android版本 (需要Android Studio)
  npm run ios        # iOS版本 (需要Xcode，仅macOS)

  5. 🔧 开发模式配置 (可选)

  如果想跳过认证直接测试，修改 src/constants/index.ts:
  export const DEV_CONFIG = {
    SKIP_AUTH: true,  // 设置为true启用开发模式
    MOCK_USER: {
      user_id: 'dev_user_123',
      phone_number: '13800138000',
      is_new_user: false,
    },
  };

  6. 🌐 后端API配置

  选择1: 无后端（仅前端界面演示）
  REACT_APP_API_URL=https://httpbin.org  # 或其他测试API

  选择2: 使用已部署的后端 (已停止)
  # AWS后端已删除，不可用
  REACT_APP_API_URL=https://backend.omnilaze.co

  选择3: 本地运行后端
  需要同时运行后端项目:
  REACT_APP_API_URL=http://localhost:3000

  7. 📱 移动端测试 (可选)

  # 安装Expo Go应用到手机
  # 启动项目后扫描二维码即可在手机上测试
  npm start