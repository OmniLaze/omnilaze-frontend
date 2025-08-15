import React from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { CookieManager } from '../utils/cookieManager';

type State = { hasError: boolean; message?: string };

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // 基础日志，后续可接入上报
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  handleReset = () => {
    try {
      // 清理Cookie与本地存储，避免损坏状态导致的渲染失败
      CookieManager.clearSession();
      CookieManager.clearConversationState();
      CookieManager.removeItem('auth_token');

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try { localStorage.removeItem('user_id'); } catch {}
        try { localStorage.removeItem('phone_number'); } catch {}
        try { localStorage.removeItem('omnilaze_focus_mode'); } catch {}
        // 强制刷新
        window.location.reload();
      }
    } catch {
      // 兜底刷新
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>页面出了点小问题</Text>
        {!!this.state.message && (
          <Text style={styles.subtitle}>错误信息：{this.state.message}</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>清除缓存并重试</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2a7cf7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

