// 环境变量配置 - Web环境直接配置
export const ENV_CONFIG = {
  // 高德地图API Key - 从环境变量获取
  AMAP_KEY: process.env.REACT_APP_AMAP_KEY || 'f5c712f69f486f3c20627dee943e0a32',
  
  // 后端API URL
  API_URL: process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://backend.omnilaze.co' : 'http://localhost:3000'),

  // 是否启用阿里云一键登录（仅Web端）
  ENABLE_ALIYUN_LOGIN: (process.env.REACT_APP_ENABLE_ALIYUN_LOGIN || 'false') === 'true',
};
