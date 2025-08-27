import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BaseInput } from './BaseInput';
import { ActionButton } from './ActionButton';
import { VerificationCodeInput } from './VerificationCodeInput';
import { sendVerificationCode, verifyCodeAndLogin, verifyInviteCodeAndCreateUser, loginWithAliyunSpToken } from '../services/api';
import { useAliyunOneClickLogin, AliyunOneClickLogin } from '../services/aliyunLogin';
import { ENV_CONFIG } from '../config/env';
import { DEV_CONFIG } from '../constants';
import { useSafeTimeout } from '../hooks/useSafeTimeout';

export interface AuthResult {
  success: boolean;
  isNewUser: boolean;
  userId?: string;
  phoneNumber: string;
  message?: string;
  isPhoneVerificationStep?: boolean; // 标识这只是手机号验证步骤
}

export interface AuthComponentProps {
  onAuthSuccess: (result: AuthResult) => void;
  onError: (error: string) => void;
  onQuestionChange: (question: string) => void; // 新增：更新问题文本的回调
  animationValue: any;
  validatePhoneNumber: (phone: string) => boolean;
  triggerShake: () => void;
  changeEmotion: (emoji: string) => void;
  resetTrigger?: number; // 新增：重置触发器，当这个值改变时重置组件状态
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
  const { setSafeTimeout } = useSafeTimeout();
  // 登录方式状态（默认短信；仅在显式启用且Web端时默认阿里云）
  const aliyunEnabled = ENV_CONFIG.ENABLE_ALIYUN_LOGIN && Platform.OS === 'web';
  const [authMode, setAuthMode] = useState<'aliyun' | 'sms'>(aliyunEnabled ? 'aliyun' : 'sms');
  
  // 通用状态
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 阿里云一键登录Hook（仅在启用时使用）
  const aliyunLogin = useAliyunOneClickLogin((process.env.EXPO_PUBLIC_ALIYUN_APP_ID as string) || 'demo');
  
  // 短信验证相关状态
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false);
  
  // 临时SP Token输入（调试用）
  const [spToken, setSpToken] = useState('');

  // 初始化时设置问题文本
  useEffect(() => {
    if (authMode === 'aliyun') {
      if (!aliyunEnabled) {
        setAuthMode('sms');
        onQuestionChange('请输入手机号获取验证码');
        return;
      }
      if (aliyunLogin.isSupported) {
        onQuestionChange('使用一键登录快速进入');
      } else {
        onQuestionChange('请粘贴一键登录凭证或切换短信验证');
      }
    } else {
      onQuestionChange('请输入手机号获取验证码');
    }
  }, [authMode, aliyunLogin.isSupported, aliyunEnabled]);

  // 验证码阶段问题文本更新
  useEffect(() => {
    if (authMode === 'sms' && isVerificationCodeSent && !isPhoneVerified) {
      onQuestionChange('请输入收到的6位验证码');
    }
  }, [authMode, isVerificationCodeSent, isPhoneVerified]);

  // 重置功能：当resetTrigger改变时重置所有状态
  useEffect(() => {
    if (resetTrigger !== undefined) {
      resetAllStates();
    }
  }, [resetTrigger]);

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
    
    if (authMode === 'aliyun' && aliyunEnabled) {
      if (aliyunLogin.isSupported) {
        onQuestionChange('使用一键登录快速进入');
      } else {
        onQuestionChange('请粘贴一键登录凭证或切换短信验证');
      }
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
      changeEmotion('🚀');
    } else {
      changeEmotion('📱');
    }
  };

  // 倒计时 useEffect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 阿里云一键登录处理
  const handleAliyunOneClickLogin = async () => {
    if (!aliyunEnabled || !aliyunLogin.isSupported) {
      setInputError('当前环境不支持一键登录');
      triggerShake();
      return;
    }

    setIsLoading(true);
    setInputError('');
    onError('');
    changeEmotion('⚡');

    try {
      const spToken = await aliyunLogin.getSpToken();
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
      const errorMsg = error instanceof Error ? error.message : '网络错误，请重试';
      setInputError(errorMsg);
      triggerShake();
      changeEmotion('❌');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动输入SP Token登录
  const handleSpTokenLogin = async () => {
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
      const errorMsg = error instanceof Error ? error.message : '网络错误，请重试';
      setInputError(errorMsg);
      triggerShake();
      changeEmotion('❌');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11) {
      triggerShake();
      setInputError('请输入正确的11位手机号');
      return;
    }
    
    // 防止重复点击
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    setInputError('');
    onError(''); // 清除父组件错误
    
    try {
      const result = await sendVerificationCode(phoneNumber);
      
      if (result.success) {
        setIsVerificationCodeSent(true);
        setCountdown(180); // 3分钟倒计时
        changeEmotion('📱');
        
        // 触发手机号作为答案的动画 - 通过调用父组件的成功回调
        // 这里我们传递一个特殊标识，表示这只是第一步完成
        onAuthSuccess({
          success: true,
          isNewUser: false, // 临时值，真实值在验证码验证后确定
          userId: 'temp', // 临时值
          phoneNumber: phoneNumber,
          isPhoneVerificationStep: true, // 特殊标识
        });
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '发送验证码失败，请重试';
      setInputError(errorMessage);
      triggerShake();
      // 发送验证码失败时静默处理
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationCodeComplete = async (code: string) => {
    setVerificationCode(code);
    
    try {
      const result = await verifyCodeAndLogin(phoneNumber, code);
      
      if (result.success) {
        setIsVerificationSuccess(true); // 设置验证成功状态
        setIsPhoneVerified(true);
        setInputError('');
        onError(''); // 清除父组件错误
        changeEmotion('✅');
        
        // 显示成功动画一段时间后再继续
        setSafeTimeout(() => {
          // 判断是否为新用户
          const isUserNew = result.is_new_user || false;
          setIsNewUser(isUserNew);
          
          if (isUserNew) {
            // 新用户需要输入邀请码
            changeEmotion('🔑');
            onQuestionChange('欢迎新用户！请输入邀请码完成注册');
          } else {
            // 老用户直接成功 - 触发答案动画
            onAuthSuccess({
              success: true,
              isNewUser: false,
              userId: result.user_id,
              phoneNumber: result.phone_number || phoneNumber,
              userSequence: result.user_sequence, // 传递用户注册次序
            });
          }
        }, 1000); // 显示成功状态1秒
      } else {
        setInputError(result.message);
        triggerShake();
      }
    } catch (error) {
      const errorMessage = '验证失败，请重试';
      setInputError(errorMessage);
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
        onError(''); // 清除父组件错误
        
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
      const errorMessage = '验证邀请码失败，请重试';
      setInputError(errorMessage);
      triggerShake();
      // 邀请码验证失败时静默处理
    }
  };

  const renderPhoneInput = () => (
    <BaseInput
      value={phoneNumber}
      onChangeText={isVerificationCodeSent ? undefined : setPhoneNumber} // 验证码阶段不允许修改
      placeholder="请输入11位手机号"
      iconName="phone"
      keyboardType="numeric"
      maxLength={11}
      isError={!validatePhoneNumber(phoneNumber) && phoneNumber.length > 0}
      onClear={isVerificationCodeSent ? undefined : () => setPhoneNumber('')} // 验证码阶段不允许清除
      animationValue={animationValue}
      errorMessage={inputError}
      editable={!isVerificationCodeSent} // 验证码阶段禁止编辑
    />
  );

  const renderVerificationCodeInput = () => (
    <VerificationCodeInput
      value={verificationCode}
      onChangeText={setVerificationCode}
      onComplete={handleVerificationCodeComplete}
      errorMessage={inputError.includes('验证码') ? inputError : ''}
      animationValue={animationValue}
      visible={true} // 始终可见，因为这个组件只在需要的时候才渲染
      isVerificationSuccess={isVerificationSuccess}
    />
  );

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
    </View>
  );

  const renderActionButtons = () => {
    // 新用户邀请码验证阶段
    if (isPhoneVerified && isNewUser) {
      return (
        <ActionButton
          onPress={handleVerifyInviteCode}
          title="验证邀请码"
          disabled={inviteCode.length < 4}
          isActive={inviteCode.length >= 4}
          animationValue={animationValue}
        />
      );
    }
    
    // 手机号步骤的按钮
    if (!isVerificationCodeSent) {
      return (
        <ActionButton
          onPress={handleSendVerificationCode}
          title={isLoading ? "发送中..." : "发送验证码"}
          disabled={!validatePhoneNumber(phoneNumber) || phoneNumber.length !== 11 || isLoading}
          isActive={validatePhoneNumber(phoneNumber) && phoneNumber.length === 11 && !isLoading}
          animationValue={animationValue}
        />
      );
    }
    
    // 验证码步骤的按钮 - 重新发送
    if (isVerificationCodeSent && !isPhoneVerified) {
      return (
        <ActionButton
          onPress={handleSendVerificationCode}
          title={isLoading ? "发送中..." : (countdown > 0 ? `重新发送(${countdown}s)` : "重新发送")}
          disabled={countdown > 0 || isLoading}
          isActive={countdown === 0 && !isLoading}
          animationValue={animationValue}
        />
      );
    }
    
    return null;
  };

  // 临时：支持输入阿里云 SpToken 的隐藏入口（便于调试和接入初期）
  const renderAliyunSpTokenLogin = () => (
    <View style={{ marginTop: 16 }}>
      <BaseInput
        value={spToken}
        onChangeText={setSpToken}
        placeholder="粘贴阿里云 SpToken（临时）"
        iconName="vpn-key"
        isError={false}
        onClear={() => setSpToken('')}
        animationValue={animationValue}
      />
      <View style={{ marginTop: 12 }}>
        <ActionButton
          onPress={async () => {
            if (!spToken) {
              setInputError('请粘贴有效的 SpToken');
              triggerShake();
              return;
            }
            setIsLoading(true);
            try {
              const result = await loginWithAliyunSpToken(spToken);
              if (result.success) {
                // 新用户：提示邀请码；老用户：直接登录成功
                if (result.is_new_user) {
                  setIsPhoneVerified(true);
                  setIsNewUser(true);
                  changeEmotion('🔑');
                  onQuestionChange('欢迎新用户！请输入邀请码完成注册');
                  setPhoneNumber(result.phone_number || '');
                } else {
                  onAuthSuccess({
                    success: true,
                    isNewUser: false,
                    userId: result.user_id,
                    phoneNumber: result.phone_number || '',
                    userSequence: result.user_sequence,
                  });
                }
              } else {
                setInputError(result.message);
                triggerShake();
              }
            } finally {
              setIsLoading(false);
            }
          }}
          title={isLoading ? '一键登录中...' : '使用阿里云一键登录'}
          disabled={!spToken || isLoading}
          isActive={!!spToken && !isLoading}
          animationValue={animationValue}
        />
      </View>
    </View>
  );

  // 获取SP Token的提示信息
  const getSpTokenHint = () => {
    if (Platform.OS === 'web') {
      return '请在移动端获取一键登录凭证后粘贴到此处';
    }
    return '点击下方按钮获取一键登录凭证，或手动粘贴';
  };

  // 渲染登录方式切换
  const renderAuthModeSwitch = () => {
    if (!aliyunEnabled) return null; // 隐藏一键登录切换
    return (
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
  };

  // 渲染阿里云登录界面
  const renderAliyunAuth = () => (
    <View style={styles.aliyunContainer}>
      {/* 支持状态提示 */}
      {!aliyunLogin.isSupported && (
        <Text style={styles.supportHintText}>
          {aliyunLogin.getSupportStatus().reason}
        </Text>
      )}
      
      {/* 一键登录按钮 */}
      {aliyunLogin.isSupported && (
        <View style={{ marginBottom: 16 }}>
          <ActionButton
            onPress={handleAliyunOneClickLogin}
            title={isLoading ? '获取中...' : '🚀 一键登录'}
            disabled={isLoading}
            isActive={!isLoading}
            animationValue={animationValue}
          />
        </View>
      )}
      
      {/* 手动输入SP Token */}
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
          onPress={handleSpTokenLogin}
          title={isLoading ? '登录中...' : '使用凭证登录'}
          disabled={!spToken.trim() || isLoading}
          isActive={!!spToken.trim() && !isLoading}
          animationValue={animationValue}
        />
      </View>
    </View>
  );

  // 渲染短信验证登录界面
  const renderSmsAuth = () => (
    <View>
      {/* 手机号输入 */}
      {!isVerificationCodeSent ? (
        <View>
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
        </View>
      ) : null}

      {/* 验证码输入 */}
      {isVerificationCodeSent && !isPhoneVerified ? (
        <View>
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
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 登录方式切换 - 只在未验证阶段显示 */}
      {!isPhoneVerified && aliyunEnabled ? renderAuthModeSwitch() : null}
      
      {/* 主要登录界面 */}
      {!isPhoneVerified ? (
        <View>
          {authMode === 'aliyun' && aliyunEnabled ? renderAliyunAuth() : null}
          {authMode === 'sms' ? renderSmsAuth() : null}
        </View>
      ) : null}
      
      {/* 邀请码输入阶段 */}
      {isPhoneVerified && isNewUser ? renderInviteCodeInput() : null}
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
  supportHintText: {
    fontSize: 12,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
    backgroundColor: '#fff5f5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
