import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { AuthComponent } from '../components/AuthComponent';

export const AliyunLoginDemo = () => {
  const [animationValue] = React.useState(new Animated.Value(1));
  const [authResult, setAuthResult] = React.useState(null);
  const [error, setError] = React.useState('');
  const [question, setQuestion] = React.useState('');

  const handleAuthSuccess = (result) => {
    setAuthResult(result);
    setError('');
    console.log('登录成功:', result);
  };

  const handleError = (errorMsg) => {
    setError(errorMsg);
    setAuthResult(null);
    console.log('登录错误:', errorMsg);
  };

  const handleQuestionChange = (questionText) => {
    setQuestion(questionText);
  };

  const validatePhoneNumber = (phone) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  const triggerShake = () => {
    // 实现震动动画
    console.log('触发震动效果');
  };

  const changeEmotion = (emoji) => {
    console.log('情绪变化:', emoji);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>阿里云一键登录演示</Text>
          <Text style={styles.subtitle}>OmniLaze 登录系统</Text>
        </View>

        {/* 当前问题显示 */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        {/* 登录组件 */}
        <View style={styles.authContainer}>
          <AuthComponent
            onAuthSuccess={handleAuthSuccess}
            onError={handleError}
            onQuestionChange={handleQuestionChange}
            animationValue={animationValue}
            validatePhoneNumber={validatePhoneNumber}
            triggerShake={triggerShake}
            changeEmotion={changeEmotion}
          />
        </View>

        {/* 错误显示 */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        )}

        {/* 成功结果显示 */}
        {authResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>✅ 登录成功!</Text>
            <Text style={styles.resultText}>用户ID: {authResult.userId}</Text>
            <Text style={styles.resultText}>手机号: {authResult.phoneNumber}</Text>
            <Text style={styles.resultText}>新用户: {authResult.isNewUser ? '是' : '否'}</Text>
            {authResult.userSequence && (
              <Text style={styles.resultText}>用户序号: {authResult.userSequence}</Text>
            )}
          </View>
        )}

        {/* 使用说明 */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>使用说明:</Text>
          <Text style={styles.instructionText}>
            1. 🚀 一键登录: 在移动端使用移动网络时可用
          </Text>
          <Text style={styles.instructionText}>
            2. 📱 短信验证: 传统手机号+验证码登录
          </Text>
          <Text style={styles.instructionText}>
            3. 凭证登录: 手动粘贴阿里云SP Token
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  questionContainer: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    color: '#1976d2',
    textAlign: 'center',
    fontWeight: '500',
  },
  authContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 4,
  },
  instructionsContainer: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#bf360c',
    marginBottom: 8,
    lineHeight: 20,
  },
});

import { Animated } from 'react-native';