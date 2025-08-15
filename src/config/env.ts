import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';

// 智能解析开发环境 API 地址，避免移动端使用 localhost 导致请求失败
function resolveDevApiUrl(): string {
  // 明确配置 > 一切自动推断
  const fromEnv = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();

  // 移动端（React Native/Expo）：默认使用线上后端，避免 iOS ATS/Android 明文 HTTP 限制
  if (Platform.OS !== 'web') {
    // 如需使用本地后端，请显式设置 EXPO_PUBLIC_API_URL 或 EXPO_PUBLIC_USE_LOCAL_BACKEND=true
    const preferLocal = (process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND || 'false') === 'true';
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
    // 默认：使用线上后端（可通过 app.config.ts extra 覆盖），避免明文 HTTP 被系统拦截
    return ((Constants?.expoConfig?.extra as any)?.apiUrl) || 'https://backend.omnilaze.co';
  }

  // Web端开发：基于当前访问的主机推断
  try {
    // @ts-ignore: window 仅在 Web 存在
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
    // 如果是局域网IP或自定义域名，尝试同主机的3000端口
    // 简单匹配 IPv4
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return `http://${host}:3000`;
    // 其他情况兜底线上后端（可通过 app.config.ts extra 覆盖）
    return ((Constants?.expoConfig?.extra as any)?.apiUrl) || 'https://backend.omnilaze.co';
  } catch {
    return ((Constants?.expoConfig?.extra as any)?.apiUrl) || 'http://localhost:3000';
  }
}

// 环境变量配置 - Web/Native 通用
export const ENV_CONFIG = {
  // 高德地图API Key - 从环境变量获取
  AMAP_KEY: (process.env.EXPO_PUBLIC_AMAP_KEY as string) || ((Constants?.expoConfig?.extra as any)?.amapKey) || 'f5c712f69f486f3c20627dee943e0a32',

  // 后端API URL（生产用线上域名；开发做平台自适应）
  API_URL:
    process.env.NODE_ENV === 'production'
      ? (((Constants?.expoConfig?.extra as any)?.apiUrl) || 'https://backend.omnilaze.co')
      : resolveDevApiUrl(),

  // 是否启用阿里云一键登录（仅Web端）
  ENABLE_ALIYUN_LOGIN:
    ((process.env.EXPO_PUBLIC_ENABLE_ALIYUN_LOGIN as string) || 'false') === 'true' ||
    Boolean((Constants?.expoConfig?.extra as any)?.enableAliyunLogin),
};

// 开发期调试：输出解析后的 API 地址
// eslint-disable-next-line no-console
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  // @ts-ignore
  const resolved = ENV_CONFIG.API_URL;
  // eslint-disable-next-line no-console
  console.log(`[ENV] API_URL -> ${resolved}`);
}
