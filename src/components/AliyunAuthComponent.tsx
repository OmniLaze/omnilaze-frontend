import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BaseInput } from './BaseInput';
import { ActionButton } from './ActionButton';
import { VerificationCodeInput } from './VerificationCodeInput';
import { loginWithAliyunSpToken, sendVerificationCode, verifyCodeAndLogin, verifyInviteCodeAndCreateUser } from '../services/api';
import { DEV_CONFIG } from '../constants';

export interface AuthResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  phoneNumber: string;
  message?: string;
  isPhoneVerificationStep?: boolean;
}

export interface AuthComponentProps {
  onAuthSuccess: (result: AuthResult) => void;
  onError: (error: string) => void;
  onQuestionChange: (question: string) => void;
  animationValue: any;
  validatePhoneNumber: (phone: string) => boolean;
  triggerShake: () => void;
  changeEmotion: (emoji: string) => void;
  resetTrigger?: number;
}

export const AuthComponent: React.FC<AuthComponentProps> = ({
  onAuthSuccess,
  onError,
  onQuestionChange,
  animationValue,
  validatePhoneNumber,
  triggerShake,
  changeEmotion,
  resetTrigger,
}) => {
  // 登录方式状态
  const [authMode, setAuthMode] = useState<'aliyun' | 'sms'>('aliyun'); // 默认阿里云登录
  
  // 通用状态
  const [isLoading, setIsLoading] = useState(false);
  const [inputError, setInputError] = useState('');
  
  // 阿里云登录相关
  const [spToken, setSpToken] = useState('');
  
  // 短信验证相关
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false);

  // 初始化时设置问题文本
  useEffect(() => {
    if (authMode === 'aliyun') {
      onQuestionChange('使用一键登录快速进入');
    } else {
      onQuestionChange('请输入手机号获取验证码');
    }
  }, [authMode]);

  // 验证码阶段问题文本更新
  useEffect(() => {
    if (authMode === 'sms' && isVerificationCodeSent && !isPhoneVerified) {
      onQuestionChange('请输入收到的6位验证码');
    }
  }, [authMode, isVerificationCodeSent, isPhoneVerified]);

  // 重置功能
  useEffect(() => {
    if (resetTrigger !== undefined) {
      resetAllStates();
    }
  }, [resetTrigger]);

  // 倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const resetAllStates = () => {
    setSpToken('');
    setPhoneNumber('');
    setVerificationCode('');
    setInviteCode('');
    setIsVerificationCodeSent(false);
    setIsPhoneVerified(false);
    setIsNewUser(false);
    setCountdown(0);
    setInputError('');
    setIsLoading(false);
    setIsVerificationSuccess(false);
    if (authMode === 'aliyun') {
      onQuestionChange('使用一键登录快速进入');
    } else {
      onQuestionChange('请输入手机号获取验证码');
    }
  };

  // 切换登录方式
  const switchAuthMode = (mode: 'aliyun' | 'sms') => {
    if (isLoading) return;
    
    setAuthMode(mode);
    resetAllStates();
    
    if (mode === 'aliyun') {
      onQuestionChange('使用一键登录快速进入');
      changeEmotion('🚀');
    } else {
      onQuestionChange('请输入手机号获取验证码');
      changeEmotion('📱');
    }
  };

  // 阿里云一键登录处理
  const handleAliyunLogin = async () => {
    if (!spToken.trim()) {
      setInputError('请粘贴有效的一键登录凭证');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setInputError('');
    onError('');
    changeEmotion('⚡');

    try {
      const result = await loginWithAliyunSpToken(spToken);
      
      if (result.success) {
        if (result.is_new_user) {
          // 新用户需要邀请码
          setIsPhoneVerified(true);
          setIsNewUser(true);
          setPhoneNumber(result.phone_number || '');
          changeEmotion('🔑');
          onQuestionChange('欢迎新用户！请输入邀请码完成注册');
        } else {
          // 老用户直接登录成功
          changeEmotion('✅');
          onAuthSuccess({
            success: true,
            isNewUser: false,
            userId: result.user_id,
            phoneNumber: result.phone_number || '',
            userSequence: result.user_sequence,
          });
        }
      } else {
        setInputError(result.message || '一键登录失败');
        triggerShake();
        changeEmotion('❌');
      }
    } catch (error) {
      setInputError('网络错误，请重试');
      triggerShake();
      changeEmotion('❌');
    } finally {
      setIsLoading(false);
    }
  };

  // 短信验证码登录处理
  const handleSendVerificationCode = async () => {
    if (!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11) {
      triggerShake();
      setInputError('请输入正确的11位手机号');
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    setInputError('');
    onError('');
    
    try {
      const result = await sendVerificationCode(phoneNumber);
      
      if (result.success) {
        setIsVerificationCodeSent(true);
        setCountdown(180);
        changeEmotion('📱');
        
        onAuthSuccess({
          success: true,
          isNewUser: false,
          userId: 'temp',
          phoneNumber: phoneNumber,
          isPhoneVerificationStep: true,
        });
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      setInputError('发送验证码失败，请重试');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationCodeComplete = async (code: string) => {
    setVerificationCode(code);
    
    try {
      const result = await verifyCodeAndLogin(phoneNumber, code);
      
      if (result.success) {
        setIsVerificationSuccess(true);
        setIsPhoneVerified(true);
        setInputError('');
        onError('');
        changeEmotion('✅');
        
        setTimeout(() => {
          const isUserNew = result.is_new_user || false;
          setIsNewUser(isUserNew);
          
          if (isUserNew) {
            changeEmotion('🔑');
            onQuestionChange('欢迎新用户！请输入邀请码完成注册');
          } else {
            onAuthSuccess({
              success: true,
              isNewUser: false,
              userId: result.user_id,
              phoneNumber: result.phone_number || phoneNumber,
              userSequence: result.user_sequence,
            });
          }
        }, 1000);
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      setInputError('验证失败，请重试');
      triggerShake();
    }
  };

  const handleVerifyInviteCode = async () => {
    if (inviteCode.length < 4) {
      setInputError('请输入有效的邀请码');
      triggerShake();
      return;
    }

    try {
      const result = await verifyInviteCodeAndCreateUser(phoneNumber, inviteCode);
      
      if (result.success) {
        changeEmotion('🎉');
        setInputError('');
        onError('');
        
        onAuthSuccess({
          success: true,
          isNewUser: true,
          userId: result.user_id,
          phoneNumber: result.phone_number || phoneNumber,
        });
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      setInputError('验证邀请码失败，请重试');
      triggerShake();
    }
  };

  // 获取SP Token的提示信息
  const getSpTokenHint = () => {
    if (Platform.OS === 'web') {
      return '请在移动端获取一键登录凭证后粘贴到此处';
    }
    return '点击下方按钮获取一键登录凭证，或手动粘贴';
  };

  // 渲染登录方式切换
  const renderAuthModeSwitch = () => (
    <View style={styles.authModeContainer}>
      <TouchableOpacity
        style={[
          styles.authModeButton,
          authMode === 'aliyun' && styles.authModeButtonActive
        ]}
        onPress={() => switchAuthMode('aliyun')}
        disabled={isLoading}
      >
        <Text style={[
          styles.authModeText,
          authMode === 'aliyun' && styles.authModeTextActive
        ]}>
          🚀 一键登录
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.authModeButton,
          authMode === 'sms' && styles.authModeButtonActive
        ]}
        onPress={() => switchAuthMode('sms')}
        disabled={isLoading}
      >
        <Text style={[
          styles.authModeText,
          authMode === 'sms' && styles.authModeTextActive
        ]}>
          📱 短信验证
        </Text>
      </TouchableOpacity>
    </View>
  );

  // 渲染阿里云登录界面
  const renderAliyunAuth = () => (
    <View style={styles.aliyunContainer}>
      <Text style={styles.hintText}>{getSpTokenHint()}</Text>
      
      <BaseInput
        value={spToken}
        onChangeText={setSpToken}
        placeholder="粘贴一键登录凭证"
        iconName="vpn-key"
        isError={!!inputError}
        onClear={() => setSpToken('')}
        animationValue={animationValue}
        errorMessage={inputError}
        multiline={Platform.OS !== 'web'}
        numberOfLines={Platform.OS === 'web' ? 1 : 3}
      />

      <View style={{ marginTop: 16 }}>
        <ActionButton
          onPress={handleAliyunLogin}
          title={isLoading ? '登录中...' : '🚀 一键登录'}
          disabled={!spToken.trim() || isLoading}
          isActive={!!spToken.trim() && !isLoading}
          animationValue={animationValue}
        />
      </View>
      
      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.getTokenButton} disabled={isLoading}>
          <Text style={styles.getTokenText}>
            📲 获取一键登录凭证
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // 渲染短信验证登录界面
  const renderSmsAuth = () => (
    <View>
      {/* 手机号输入 */}
      {!isVerificationCodeSent && (
        <>
          <BaseInput
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="请输入11位手机号"
            iconName="phone"
            keyboardType="numeric"
            maxLength={11}
            isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
            onClear={() => setPhoneNumber('')}
            animationValue={animationValue}
            errorMessage={inputError}
          />
          
          <View style={{ marginTop: 16 }}>
            <ActionButton
              onPress={handleSendVerificationCode}
              title={isLoading ? "发送中..." : "发送验证码"}
              disabled={!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11 || isLoading}
              isActive={validatePhoneNumber(phoneNumber) && phoneNumber.length === 11 && !isLoading}
              animationValue={animationValue}
            />
          </View>
        </>
      )}

      {/* 验证码输入 */}
      {isVerificationCodeSent && !isPhoneVerified && (
        <>
          <VerificationCodeInput
            value={verificationCode}
            onChangeText={setVerificationCode}
            onComplete={handleVerificationCodeComplete}
            errorMessage={inputError.includes('验证码') ? inputError : ''}
            animationValue={animationValue}
            visible={true}
            isVerificationSuccess={isVerificationSuccess}
          />
          
          <View style={{ marginTop: 16 }}>
            <ActionButton
              onPress={handleSendVerificationCode}
              title={isLoading ? "发送中..." : (countdown > 0 ? `重新发送(${countdown}s)` : "重新发送")}
              disabled={countdown > 0 || isLoading}
              isActive={countdown === 0 && !isLoading}
              animationValue={animationValue}
            />
          </View>
        </>
      )}
    </View>
  );

  // 渲染邀请码输入界面
  const renderInviteCodeInput = () => (
    <View style={{ marginTop: 16 }}>
      <BaseInput
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="请输入邀请码"
        iconName="card-membership"
        isError={inputError.includes('邀请码') && inputError.length > 0}
        onClear={() => setInviteCode('')}
        onSubmitEditing={handleVerifyInviteCode}
        animationValue={animationValue}
        errorMessage={inputError}
      />
      
      <View style={{ marginTop: 16 }}>
        <ActionButton
          onPress={handleVerifyInviteCode}
          title="验证邀请码"
          disabled={inviteCode.length < 4}
          isActive={inviteCode.length >= 4}
          animationValue={animationValue}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 登录方式切换 - 只在未验证阶段显示 */}
      {!isPhoneVerified && renderAuthModeSwitch()}
      
      {/* 主要登录界面 */}
      {!isPhoneVerified && (
        <>
          {authMode === 'aliyun' && renderAliyunAuth()}
          {authMode === 'sms' && renderSmsAuth()}
        </>
      )}
      
      {/* 邀请码输入阶段 */}
      {isPhoneVerified && isNewUser && renderInviteCodeInput()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  authModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    padding: 4,
    marginBottom: 20,
  },
  authModeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authModeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  authModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  authModeTextActive: {
    color: '#333',
    fontWeight: '600',
  },
  aliyunContainer: {
    width: '100%',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  getTokenButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  getTokenText: {
    fontSize: 14,
    color: '#666',
  },
});