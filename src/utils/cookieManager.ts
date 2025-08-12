import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web' && typeof document !== 'undefined';
const memoryStore = new Map<string, string>();

// Basic in-memory fallback for native platforms
const memorySet = (name: string, value: string) => memoryStore.set(name, value);
const memoryGet = (name: string): string | null => (memoryStore.has(name) ? (memoryStore.get(name) as string) : null);
const memoryDelete = (name: string) => memoryStore.delete(name);

// Cookie管理工具（Web 使用 cookie，原生使用内存存储作为兼容层）
export const CookieManager = {
  // 设置Cookie
  setCookie: (name: string, value: string, days: number = 7) => {
    if (isWeb) {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    } else {
      memorySet(name, value);
    }
  },

  // 获取Cookie
  getCookie: (name: string): string | null => {
    if (isWeb) {
      const nameEQ = name + '=';
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }
    return memoryGet(name);
  },

  // 删除Cookie
  deleteCookie: (name: string) => {
    if (isWeb) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    } else {
      memoryDelete(name);
    }
  },

  // 保存用户会话
  saveUserSession: (userId: string, phoneNumber: string, isNewUser: boolean) => {
    const sessionData = {
      userId,
      phoneNumber,
      isNewUser,
      loginTime: new Date().getTime()
    };
    CookieManager.setCookie('user_session', JSON.stringify(sessionData), 7); // 7天有效期
  },

  // 获取用户会话
  getUserSession: () => {
    const sessionData = CookieManager.getCookie('user_session');
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        // 检查是否在7天内
        const now = new Date().getTime();
        const loginTime = parsed.loginTime;
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        if (now - loginTime < sevenDays) {
          return parsed;
        } else {
          // 会话过期，删除cookie
          CookieManager.deleteCookie('user_session');
          return null;
        }
      } catch (e) {
        // JSON解析失败，删除损坏的cookie
        CookieManager.deleteCookie('user_session');
        return null;
      }
    }
    return null;
  },

  // 清除用户会话
  clearUserSession: () => {
    CookieManager.deleteCookie('user_session');
  },

  // 清除所有会话（包括token）
  clearSession: () => {
    CookieManager.deleteCookie('user_session');
    CookieManager.deleteCookie('auth_token');
    CookieManager.deleteCookie('conversation_state');
  },

  // 保存对话状态
  saveConversationState: (state: any) => {
    const sessionData = CookieManager.getUserSession();
    if (sessionData) {
      const conversationData = {
        ...state,
        timestamp: new Date().getTime()
      };
      CookieManager.setCookie('conversation_state', JSON.stringify(conversationData), 1); // 1天有效期
    }
  },

  // 获取对话状态
  getConversationState: () => {
    const conversationData = CookieManager.getCookie('conversation_state');
    if (conversationData) {
      try {
        const parsed = JSON.parse(conversationData);
        // 检查是否在1天内
        const now = new Date().getTime();
        const timestamp = parsed.timestamp;
        const oneDay = 24 * 60 * 60 * 1000;
        
        if (now - timestamp < oneDay) {
          return parsed;
        } else {
          CookieManager.deleteCookie('conversation_state');
          return null;
        }
      } catch (e) {
        CookieManager.deleteCookie('conversation_state');
        return null;
      }
    }
    return null;
  },

  // 清除对话状态
  clearConversationState: () => {
    CookieManager.deleteCookie('conversation_state');
  },

  // 通用存储方法 (兼容React Native AsyncStorage接口)
  saveItem: (key: string, value: string) => {
    CookieManager.setCookie(key, value, 30); // Web: 30天有效期；原生：内存
  },

  // 通用获取方法 - 同步版本
  getItem: (key: string): string | null => {
    return CookieManager.getCookie(key);
  },

  // 通用获取方法 - 异步版本（保留兼容性）
  getItemAsync: async (key: string): Promise<string | null> => {
    return CookieManager.getCookie(key);
  },

  // 通用删除方法
  removeItem: (key: string) => {
    CookieManager.deleteCookie(key);
  }
};