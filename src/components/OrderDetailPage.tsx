import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { SimpleIcon } from './SimpleIcon';
import { OrderDetailSection } from './OrderDetailSection';
import { OrderInterface } from './OrderInterface';
import { Order } from '../types/order';
import { formatOrderForDisplay } from '../utils/orderTransformer';
import { CookieManager } from '../utils/cookieManager';
import { ENV_CONFIG } from '../config/env';
import { getOrderDisplayStatus } from '../services/api';

interface OrderDetailPageProps {
  order: Order;
  onBack: () => void;
  onOrderUpdate?: (updatedOrder: Order) => void;
}

/**
 * 订单详情页 - 使用统一的OrderInterface组件
 */
export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  order,
  onBack,
  onOrderUpdate,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const pressStartYRef = useRef<number | null>(null);
  const shouldUploadRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 格式化订单数据用于显示
  const displayOrder = formatOrderForDisplay(order);
  
  // 获取订单状态信息
  const statusInfo = getOrderDisplayStatus(order);

  // 格式化日期时间
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${year}年${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`;
  };

  // 获取预计送达时间显示
  const getEtaDisplay = (): string => {
    const eta = order.metadata?.eta_estimated_at;
    if (!eta) return '—';
    try {
      const dt = new Date(eta);
      if (isNaN(dt.getTime())) return '—';
      const now = new Date();
      const mins = Math.max(0, Math.round((dt.getTime() - now.getTime()) / 60000));
      const timeStr = dt.toLocaleString('zh-CN');
      return mins > 0 ? `${timeStr}（约${mins}分钟后）` : timeStr;
    } catch {
      return '—';
    }
  };

  // 动画效果
  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // 处理返回
  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onBack();
    });
  };

  // 开始录音
  const startRecording = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('提示', '移动端录音功能开发中');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];
      
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mr.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        const shouldUpload = shouldUploadRef.current && recordingTime > 0;
        if (shouldUpload) {
          await uploadVoiceFeedback(blob);
        }
      };
      
      mr.start();
      mediaRecorderRef.current = mr;
      setRecordingTime(0);
      setIsRecording(true);
      setCancelMode(false);
      shouldUploadRef.current = false;
      
      timerRef.current = setInterval(() => {
        setRecordingTime((s) => {
          if (s + 1 >= 30) {
            // 30秒自动停止
            try {
              mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && mediaRecorderRef.current.stop();
            } catch {}
          }
          return Math.min(30, s + 1);
        });
      }, 1000);
    } catch (err) {
      Alert.alert('无法开始录音', '请检查浏览器麦克风权限');
    }
  };

  // 停止录音
  const stopRecording = () => {
    shouldUploadRef.current = !cancelMode;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // 上传语音反馈
  const uploadVoiceFeedback = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const token = CookieManager.getItem('auth_token') || '';
      const form = new FormData();
      form.append('file', blob, 'voice.webm');
      form.append('duration_sec', String(recordingTime));
      
      const resp = await fetch(`${ENV_CONFIG.API_URL}/v1/orders/${order.id}/feedback/audio`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        body: form,
      });
      
      const json = await resp.json();
      if (!(json && json.success)) throw new Error(json?.message || '上传失败');
      setFeedbackSubmitted(true);
    } catch (e: any) {
      Alert.alert('上传失败', e?.message || '网络错误');
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
      setCancelMode(false);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: slideAnim,
          transform: [{
            translateX: slideAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        },
      ]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SimpleIcon name="arrow-left" size={20} color={theme.TEXT_PRIMARY} />
          </TouchableOpacity>
          
          <Text style={styles.title}>订单详情</Text>
          
          <View style={styles.headerRight}>
            <View style={[styles.statusPill, { backgroundColor: statusInfo.displayStatusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusInfo.displayStatusColor }]}>
                {statusInfo.displayStatusText}
              </Text>
            </View>
          </View>
        </View>

        {/* 内容滚动区域 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 统一的订单界面组件 */}
          <OrderInterface
            order={order}
            showFullDetails={true}
            enablePaymentContinuation={statusInfo.canContinuePayment}
            onOrderUpdate={onOrderUpdate}
          />

          {/* 送达照片 - 如果存在 */}
          {order.arrivalImageUrl && (
            <View style={styles.section}>
              <OrderDetailSection
                label="送达照片"
                value="查看照片"
                icon="camera"
                expandable
              >
                <Image
                  source={{ uri: order.arrivalImageUrl }}
                  style={styles.arrivalImage}
                  resizeMode="cover"
                />
                {order.arrivalImageTakenAt && (
                  <Text style={styles.arrivalImageTime}>
                    拍摄时间: {new Date(order.arrivalImageTakenAt).toLocaleString('zh-CN')}
                  </Text>
                )}
              </OrderDetailSection>
            </View>
          )}

          {/* 语音反馈按钮 */}
          {order.displayStatus === 'completed' && (
            <View style={styles.feedbackSection}>
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={feedbackSubmitted || isUploading}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                onStartShouldSetResponder={() => true}
                onResponderGrant={(ev: any) => {
                  pressStartYRef.current = ev?.nativeEvent?.pageY ?? null;
                  setCancelMode(false);
                }}
                onResponderMove={(ev: any) => {
                  if (!isRecording) return;
                  const startY = pressStartYRef.current;
                  const currY = ev?.nativeEvent?.pageY ?? null;
                  if (startY != null && currY != null) {
                    const dy = startY - currY;
                    setCancelMode(dy > 50);
                  }
                }}
                style={[
                  styles.holdRecordButton,
                  feedbackSubmitted ? styles.holdRecordButtonThanks : 
                  (isRecording ? (cancelMode ? styles.holdRecordButtonCancel : styles.holdRecordButtonActive) : null),
                ]}
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.holdRecordText}>
                    {feedbackSubmitted
                      ? '感谢反馈'
                      : isRecording
                        ? (cancelMode
                            ? `上滑取消  ${String(Math.floor(recordingTime/60)).padStart(2,'0')}:${String(recordingTime%60).padStart(2,'0')}`
                            : `松开发送  ${String(Math.floor(recordingTime/60)).padStart(2,'0')}:${String(recordingTime%60).padStart(2,'0')}`)
                        : '按住录音反馈（≤30s）'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    marginHorizontal: 20,
    marginVertical: 8,
  },
  arrivalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    marginTop: 8,
  },
  arrivalImageTime: {
    fontSize: 12,
    color: theme.TEXT_SECONDARY,
    marginTop: 4,
  },
  feedbackSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  holdRecordButton: {
    backgroundColor: theme.PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  holdRecordButtonActive: {
    backgroundColor: '#FF4444',
  },
  holdRecordButtonCancel: {
    backgroundColor: '#6B7280',
  },
  holdRecordButtonThanks: {
    backgroundColor: '#10b981',
  },
  holdRecordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});