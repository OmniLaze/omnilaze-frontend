import { Platform } from 'react-native';

/**
 * 统一的认证服务
 * 只负责管理 JWT Token，不存储任何用户敏感信息
 * 用户信息从 JWT 解析或从后端获取
 */
class AuthService {
  private static TOKEN_KEY = 'auth_token';
  
  /**
   * 保存 JWT Token
   */
  static setToken(token: string): void {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
    // React Native 环境需要使用 AsyncStorage
    // 这里暂时使用内存存储作为示例
  }
  
  /**
   * 获取 JWT Token
   */
  static getToken(): string | null {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }
  
  /**
   * 清除 JWT Token
   */
  static clearToken(): void {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }
  
  /**
   * 从 JWT 解析用户基本信息（不包含敏感信息）
   * 注意：这只是为了前端显示，真正的验证在后端进行
   */
  static parseToken(): { userId?: string; phone?: string; exp?: number } | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      // JWT 格式: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // 解码 payload（base64）
      const payload = JSON.parse(atob(parts[1]));
      
      return {
        userId: payload.sub,  // JWT 标准中 sub 代表 subject (用户ID)
        phone: payload.phone,
        exp: payload.exp,     // 过期时间
      };
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }
  
  /**
   * 检查是否已认证（Token 存在且未过期）
   */
  static isAuthenticated(): boolean {
    const tokenData = this.parseToken();
    if (!tokenData || !tokenData.exp) return false;
    
    // 检查 token 是否过期
    const now = Date.now() / 1000;
    return tokenData.exp > now;
  }
  
  /**
   * 获取当前用户ID（从 JWT 解析）
   */
  static getCurrentUserId(): string | null {
    const tokenData = this.parseToken();
    return tokenData?.userId || null;
  }
  
  /**
   * 获取当前用户手机号（从 JWT 解析，仅用于显示）
   */
  static getCurrentUserPhone(): string | null {
    const tokenData = this.parseToken();
    return tokenData?.phone || null;
  }
  
  /**
   * 登出（清除所有认证信息）
   */
  static logout(): void {
    this.clearToken();
    // 清除其他非敏感的UI状态可以保留在 CookieManager
    // 但不应该包含 userId, phoneNumber 等信息
  }
}

export default AuthService;