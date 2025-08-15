import { Platform, NativeModules } from 'react-native';

// 智能解析开发环境 API 地址，避免移动端使用 localhost 导致请求失败
function resolveDevApiUrl(): string {
  // 明确配置 > 一切自动推断
  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

  // 移动端（React Native/Expo）：默认使用线上后端，避免 iOS ATS/Android 明文 HTTP 限制
  if (Platform.OS !== 'web') {
    // 如需使用本地后端，请显式设置 REACT_APP_API_URL
    // 例如在开发时：REACT_APP_API_URL=http://<你的局域网IP>:3000
    const preferLocal = (process.env.REACT_APP_USE_LOCAL_BACKEND || 'false') === 'true';
    if (preferLocal) {
      try {
        const scriptURL: string = (NativeModules as any)?.SourceCode?.scriptURL || '';
        // 例如: http://192.168.1.23:19000/index.bundle?platform=ios&dev=true 或 exp://192.168.1.23:19000
        const match = scriptURL.match(/^[a-zA-Z]+:\/\/([\d.]+):\d+/);
        if (match && match[1]) {
          const hostIp = match[1];
          return `http://${hostIp}:3000`;
        }
      } catch {
        // 忽略，走兜底逻辑
      }
    }
    // 默认：使用线上后端，避免明文 HTTP 被系统拦截
    return 'https://backend.omnilaze.co';
  }

  // Web端开发：基于当前访问的主机推断
  try {
    // @ts-ignore: window 仅在 Web 存在
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
    // 如果是局域网IP或自定义域名，尝试同主机的3000端口
    // 简单匹配 IPv4
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return `http://${host}:3000`;
    // 其他情况兜底线上后端
    return 'https://backend.omnilaze.co';
  } catch {
    return 'http://localhost:3000';
  }
}

// 环境变量配置 - Web/Native 通用
export const ENV_CONFIG = {
  // 高德地图API Key - 从环境变量获取
  AMAP_KEY: process.env.REACT_APP_AMAP_KEY || 'f5c712f69f486f3c20627dee943e0a32',

  // 后端API URL（生产用线上域名；开发做平台自适应）
  API_URL:
    process.env.NODE_ENV === 'production'
      ? 'https://backend.omnilaze.co'
      : resolveDevApiUrl(),

  // 是否启用阿里云一键登录（仅Web端）
  ENABLE_ALIYUN_LOGIN: (process.env.REACT_APP_ENABLE_ALIYUN_LOGIN || 'false') === 'true',
};

// 开发期调试：输出解析后的 API 地址
// eslint-disable-next-line no-console
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // @ts-ignore
  const resolved = ENV_CONFIG.API_URL;
  // eslint-disable-next-line no-console
  console.log(`[ENV] API_URL -> ${resolved}`);
}
