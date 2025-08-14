/**
 * 阿里云一键登录 JS SDK 集成
 * 用于获取 SP Token 进行手机号验证
 */

// 声明阿里云一键登录全局对象
declare global {
  interface Window {
    AliyunVerify: {
      init: (config: AliyunVerifyConfig) => void;
      getPhone: (callback: (result: AliyunPhoneResult) => void) => void;
      destroy: () => void;
    };
  }
}

export interface AliyunVerifyConfig {
  appId: string;
  scene?: string;
  success?: (data: AliyunVerifyResult) => void;
  fail?: (error: AliyunVerifyError) => void;
  complete?: () => void;
}

export interface AliyunVerifyResult {
  success: boolean;
  spToken: string;
  scene?: string;
}

export interface AliyunPhoneResult {
  success: boolean;
  spToken?: string;
  phone?: string;
  errorCode?: string;
  errorMsg?: string;
}

export interface AliyunVerifyError {
  errorCode: string;
  errorMsg: string;
}

export class AliyunOneClickLogin {
  private appId: string;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor(appId: string) {
    this.appId = appId;
  }

  /**
   * 加载阿里云一键登录SDK
   */
  private async loadSDK(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('阿里云一键登录仅支持浏览器环境');
    }

    // 如果SDK已经加载，直接返回
    if (window.AliyunVerify) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://g.alicdn.com/aliyun-next/aliyun-phone-verification/1.0.0/index.js';
      script.async = true;
      
      script.onload = () => {
        if (window.AliyunVerify) {
          resolve();
        } else {
          reject(new Error('阿里云SDK加载失败'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('阿里云SDK加载失败'));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 初始化阿里云一键登录
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      await this.loadSDK();
      
      return new Promise<void>((resolve, reject) => {
        window.AliyunVerify.init({
          appId: this.appId,
          scene: 'login',
          success: () => {
            this.isInitialized = true;
            resolve();
          },
          fail: (error) => {
            reject(new Error(`初始化失败: ${error.errorMsg}`));
          }
        });
      });
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  /**
   * 获取一键登录凭证
   */
  async getSpToken(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise<string>((resolve, reject) => {
      try {
        window.AliyunVerify.getPhone((result: AliyunPhoneResult) => {
          if (result.success && result.spToken) {
            resolve(result.spToken);
          } else {
            reject(new Error(result.errorMsg || '获取登录凭证失败'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 销毁SDK实例
   */
  destroy(): void {
    if (window.AliyunVerify && this.isInitialized) {
      window.AliyunVerify.destroy();
      this.isInitialized = false;
      this.initPromise = null;
    }
  }

  /**
   * 检查是否支持一键登录
   */
  static isSupported(): boolean {
    // 检查是否在移动端浏览器
    const userAgent = (navigator?.userAgent || '').toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // 检查网络环境（一键登录需要移动网络）
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const isWifi = connection && connection.type === 'wifi';
    
    return isMobile && !isWifi;
  }

  /**
   * 获取支持状态描述
   */
  static getSupportStatus(): {
    supported: boolean;
    reason?: string;
    suggestion?: string;
  } {
    const userAgent = (navigator?.userAgent || '').toLowerCase();
    const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    if (!isMobile) {
      return {
        supported: false,
        reason: '一键登录仅支持移动设备',
        suggestion: '请使用手机或平板电脑访问，或选择短信验证登录'
      };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const isWifi = connection && connection.type === 'wifi';
    
    if (isWifi) {
      return {
        supported: false,
        reason: '一键登录需要使用移动网络',
        suggestion: '请关闭WiFi使用移动数据网络，或选择短信验证登录'
      };
    }

    return { supported: true };
  }
}

/**
 * 创建全局阿里云一键登录实例
 */
export function createAliyunLogin(appId: string): AliyunOneClickLogin {
  return new AliyunOneClickLogin(appId);
}

/**
 * React Hook: 使用阿里云一键登录
 */
export function useAliyunOneClickLogin(appId: string) {
  const [isSupported, setIsSupported] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aliyunLogin] = useState(() => new AliyunOneClickLogin(appId));

  useEffect(() => {
    const status = AliyunOneClickLogin.getSupportStatus();
    setIsSupported(status.supported);
    if (!status.supported) {
      setError(status.reason || '不支持一键登录');
    }
  }, []);

  const initialize = useCallback(async () => {
    if (!isSupported) {
      throw new Error('当前环境不支持一键登录');
    }

    setIsLoading(true);
    setError(null);

    try {
      await aliyunLogin.initialize();
      setIsInitialized(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '初始化失败';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [aliyunLogin, isSupported]);

  const getSpToken = useCallback(async (): Promise<string> => {
    if (!isInitialized) {
      await initialize();
    }

    setIsLoading(true);
    setError(null);

    try {
      const spToken = await aliyunLogin.getSpToken();
      return spToken;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取登录凭证失败';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [aliyunLogin, isInitialized, initialize]);

  const destroy = useCallback(() => {
    aliyunLogin.destroy();
    setIsInitialized(false);
  }, [aliyunLogin]);

  return {
    isSupported,
    isInitialized,
    isLoading,
    error,
    initialize,
    getSpToken,
    destroy,
    getSupportStatus: AliyunOneClickLogin.getSupportStatus
  };
}

// 导入React hooks
import { useState, useEffect, useCallback } from 'react';