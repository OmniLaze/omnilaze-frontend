import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { OrderVoiceRecorder } from './OrderVoiceRecorder';
import { 
  allergyMap, 
  preferenceMap, 
  foodTypeMap, 
  convertToChineseDisplay,
  formatDeliveryTime,
  formatOrderStatus 
} from '../utils/orderDataMapper';

// Web-only: try to load motion.dev (Motion) react bindings
let MotionDiv: any = null;
let AnimatePresenceCmp: any = null;
try {
  // Only attempt on web
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const motionReact = require('motion/react');
    MotionDiv = motionReact.motion?.div || null;
    AnimatePresenceCmp = motionReact.AnimatePresence || null;
  }
} catch (_) {
  // Module not available; fallback to RN Modal animations
}

interface Order {
  id: string;
  orderNumber: string;
  address: string;
  budget?: string;
  amount?: string;
  totalAmount?: string;
  status: 'draft' | 'submitted' | 'processing' | 'delivering' | 'completed' | 'cancelled' | 'pending';
  createdAt: string;
  deliveryTime?: string;
  foodType?: string[];
  preferences?: string[];
  allergies?: string[];
  userId?: string; // 添加userId字段
  // 到达图片字段
  arrivalImageUrl?: string;
  arrivalImageTakenAt?: string;
  arrivalImageSource?: string;
  form_data?: {
    budget?: string;
    address?: string;
    deliveryTime?: string;
    allergies?: string[];
    preferences?: string[];
    foodType?: string[];
  };
  formData?: {
    budget?: string;
    address?: string;
    deliveryTime?: string;
    allergies?: string[];
    preferences?: string[];
    foodType?: string[];
  };
}

interface OrderDetailModalProps {
  order: Order | null;
  isVisible: boolean;
  onClose: () => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isVisible,
  onClose,
}) => {
  const { theme } = useTheme();
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  // Inline long-press voice record (web)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // seconds
  const [isUploading, setIsUploading] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const pressStartYRef = useRef<number | null>(null);
  const shouldUploadRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<any>(null);
  const nativeRecordingRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!isVisible) {
      try { if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop(); } catch {}
      (async () => { try { if (nativeRecordingRef.current) await nativeRecordingRef.current.stopAndUnloadAsync?.(); } catch {} })();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      setIsRecording(false);
      setRecordingTime(0);
    }
    return () => {
      try { if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop(); } catch {}
      (async () => { try { if (nativeRecordingRef.current) await nativeRecordingRef.current.stopAndUnloadAsync?.(); } catch {} })();
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [isVisible]);

  // 调试：打印完整的订单数据
  React.useEffect(() => {
    if (order && isVisible) {
      console.log('📋 订单详情模态框收到的完整订单数据:', order);
      console.log('📋 订单对象的所有键:', Object.keys(order));
      console.log('📋 订单对象完整JSON:', JSON.stringify(order, null, 2));
      console.log('📋 form_data内容:', order.form_data);
      console.log('📋 formData内容:', order.formData);
    }
  }, [order, isVisible]);

  if (!order) return null;

  const getOrderAmount = (): string => {
    // 优先检查订单对象的直接字段
    let amount = null;
    
    // 直接字段检查 - 扩展检查更多可能的字段名
    if (order.budget && order.budget !== '0' && order.budget !== '') {
      amount = order.budget;
    } else if (order.amount && order.amount !== '0' && order.amount !== '') {
      amount = order.amount;
    } else if (order.totalAmount && order.totalAmount !== '0' && order.totalAmount !== '') {
      amount = order.totalAmount;
    }
    
    // 检查可能的其他字段名
    if (!amount && (order as any).form_data_budget) {
      amount = (order as any).form_data_budget;
    }
    
    if (!amount && (order as any).order_amount) {
      amount = (order as any).order_amount;
    }
    
    // 检查嵌套的form_data
    if (!amount && order.form_data) {
      amount = order.form_data.budget || order.form_data.amount || (order.form_data as any).order_amount;
    }
    
    // 检查嵌套的formData
    if (!amount && order.formData) {
      amount = order.formData.budget || order.formData.amount || (order.formData as any).order_amount;
    }
    
    console.log('💰 订单详情金额获取:', {
      orderId: order.id,
      directBudget: order.budget,
      directAmount: order.amount,
      directTotalAmount: order.totalAmount,
      formDataBudget: order.form_data?.budget,
      formDataBudget2: order.formData?.budget,
      rawOrderKeys: Object.keys(order),
      finalAmount: amount
    });
    
    return amount || '未知';
  };

  const getDeliveryTime = (): string => {
    const time = order.deliveryTime || 
                 order.delivery_time || 
                 order.form_data?.deliveryTime || 
                 order.form_data?.delivery_time || 
                 order.formData?.deliveryTime || 
                 order.formData?.delivery_time;
    
    console.log('⏰ 订单详情时间获取:', {
      orderId: order.id,
      directTime: order.deliveryTime,
      formDataTime: order.form_data?.deliveryTime,
      finalTime: time
    });
    
    return formatDeliveryTime(time);
  };

  const getFoodType = (): string => {
    const foodType = order.foodType || 
                     order.food_type || 
                     order.form_data?.foodType || 
                     order.form_data?.food_type || 
                     order.form_data?.selectedFoodType ||
                     order.formData?.foodType || 
                     order.formData?.food_type ||
                     order.formData?.selectedFoodType || 
                     [];
    
    console.log('🍴 订单详情食物类型获取:', {
      orderId: order.id,
      directFoodType: order.foodType,
      formDataFoodType: order.form_data?.foodType,
      finalFoodType: foodType
    });
    
    if (!foodType || foodType.length === 0) return '未选择';
    return convertToChineseDisplay(foodType, foodTypeMap) || '未选择';
  };

  const getAllergies = (): string => {
    const allergies = order.allergies || 
                      order.form_data?.allergies || 
                      order.form_data?.selectedAllergies ||
                      order.formData?.allergies || 
                      order.formData?.selectedAllergies ||
                      [];
    
    console.log('🥧 订单详情忌口获取:', {
      orderId: order.id,
      directAllergies: order.allergies,
      formDataAllergies: order.form_data?.allergies,
      finalAllergies: allergies
    });
    
    if (!allergies || allergies.length === 0) return '无忌口';
    return convertToChineseDisplay(allergies, allergyMap) || '无忌口';
  };

  const getPreferences = (): string => {
    const preferences = order.preferences || 
                        order.form_data?.preferences || 
                        order.form_data?.selectedPreferences ||
                        order.formData?.preferences || 
                        order.formData?.selectedPreferences ||
                        [];
    
    console.log('🌶️ 订单详情偏好获取:', {
      orderId: order.id,
      directPreferences: order.preferences,
      formDataPreferences: order.form_data?.preferences,
      finalPreferences: preferences
    });
    
    if (!preferences || preferences.length === 0) return '无特殊偏好';
    return convertToChineseDisplay(preferences, preferenceMap) || '无特殊偏好';
  };

  const getAddress = (): string => {
    const address = order.address || 
                    order.form_data?.address || 
                    order.formData?.address ||
                    (order as any).delivery_address ||
                    (order as any).order_address ||
                    '未知地址';
    
    console.log('📦 订单详情地址获取:', {
      orderId: order.id,
      directAddress: order.address,
      formDataAddress: order.form_data?.address,
      formDataAddress2: order.formData?.address,
      rawOrderKeys: Object.keys(order),
      finalAddress: address
    });
    
    return address;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${year}年${month}月${day}日 ${hour}:${minute.toString().padStart(2, '0')}`;
  };

  const getStatusText = (status: string) => {
    return formatOrderStatus(status).text;
  };

  const getStatusColor = (status: string) => {
    return formatOrderStatus(status).color;
  };

  const styles = createStyles(theme);

  // 共享卡片内容（非 Hook）
  const cardBody = (
    <>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.title}>订单详情</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 订单基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>订单信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>订单号</Text>
            <Text style={styles.value}>#{order.orderNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>下单时间</Text>
            <Text style={styles.value}>{formatDate(order.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>订单状态</Text>
            <View style={[styles.valueContainerRight, { flexDirection: 'row', gap: 6 }]}>
              <View style={[styles.statusPill, { backgroundColor: formatOrderStatus(order.status).bgColor }]}>
                <Text style={[styles.statusText, { color: formatOrderStatus(order.status).color }]}>
                  {formatOrderStatus(order.status).text}
                </Text>
              </View>
              {feedbackSubmitted && (
                <View style={styles.feedbackPill}>
                  <Text style={styles.feedbackPillText}>已反馈</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>订单金额</Text>
            <Text style={[styles.value, styles.amount]}>¥{getOrderAmount()}</Text>
          </View>
        </View>

        {/* 配送信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>配送信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>配送地址</Text>
            <Text style={[styles.value, styles.address]}>{getAddress()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>用餐时间</Text>
            <Text style={styles.value}>{getDeliveryTime()}</Text>
          </View>
          {order.arrivalImageUrl && (
            <View style={styles.arrivalImageSection}>
              <Text style={styles.label}>到达照片</Text>
              <TouchableOpacity style={styles.arrivalImageContainer}>
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
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 点单详情 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>点单详情</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>食物类型</Text>
            <Text style={styles.value}>{getFoodType()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>忌口说明</Text>
            <Text style={styles.value}>{getAllergies()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>口味偏好</Text>
            <Text style={styles.value}>{getPreferences()}</Text>
          </View>
        </View>

        {/* 语音反馈按钮 */}
        <View style={[styles.section, { alignItems: 'center', paddingBottom: 8 }] }>
          <TouchableOpacity 
            activeOpacity={0.9}
            disabled={feedbackSubmitted || isUploading}
            onPressIn={async (e: any) => {
              try {
                if (Platform.OS !== 'web') {
                  // Native (Expo) recording via expo-av (dynamic require)
                  const { Audio } = require('expo-av');
                  const perm = await Audio.requestPermissionsAsync();
                  if (!perm?.granted) {
                    Alert.alert('提示', '请授予麦克风权限');
                    return;
                  }
                  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
                  const recording = new Audio.Recording();
                  await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
                  await recording.startAsync();
                  nativeRecordingRef.current = recording;
                  setRecordingTime(0);
                  setIsRecording(true);
                  setCancelMode(false);
                  shouldUploadRef.current = false;
                  pressStartYRef.current = e?.nativeEvent?.pageY ?? null;
                  timerRef.current = setInterval(async () => {
                    setRecordingTime((s) => {
                      const next = s + 1;
                      if (next >= 30) {
                        // auto stop
                        (async () => {
                          try { if (nativeRecordingRef.current) await nativeRecordingRef.current.stopAndUnloadAsync(); } catch {}
                        })();
                      }
                      return Math.min(30, next);
                    });
                  }, 1000);
                  return;
                }
                // Web recording
                // start web recording
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
                audioChunksRef.current = [];
                mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data); };
                mr.onstop = async () => {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  stream.getTracks().forEach(t => t.stop());
                  setIsRecording(false);
                  if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                  const shouldUpload = shouldUploadRef.current && recordingTime > 0;
                  if (shouldUpload) {
                    setIsUploading(true);
                    try {
                      const token = (require('../utils/cookieManager') as any).CookieManager.getItem('auth_token') || '';
                      const { ENV_CONFIG } = require('../config/env');
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
                  }
                };
                mr.start();
                mediaRecorderRef.current = mr;
                setRecordingTime(0);
                setIsRecording(true);
                setCancelMode(false);
                shouldUploadRef.current = false;
                pressStartYRef.current = e?.nativeEvent?.pageY ?? null;
                timerRef.current = setInterval(() => {
                  setRecordingTime((s) => {
                    if (s + 1 >= 30) {
                      // auto stop at 30s
                      try { mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && mediaRecorderRef.current.stop(); } catch {}
                    }
                    return Math.min(30, s + 1);
                  });
                }, 1000);
              } catch (err) {
                Alert.alert('无法开始录音', '请检查浏览器麦克风权限');
              }
            }}
            onPressOut={() => {
              try {
                if (Platform.OS !== 'web') {
                  (async () => {
                    try {
                      if (nativeRecordingRef.current) {
                        await nativeRecordingRef.current.stopAndUnloadAsync();
                        const uri = nativeRecordingRef.current.getURI?.();
                        setIsRecording(false);
                        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
                        const shouldUpload = !cancelMode && recordingTime > 0;
                        if (uri && shouldUpload) {
                          setIsUploading(true);
                          try {
                            const token = (require('../utils/cookieManager') as any).CookieManager.getItem('auth_token') || '';
                            const { ENV_CONFIG } = require('../config/env');
                            const form = new FormData();
                            form.append('file', { uri, name: 'voice.m4a', type: 'audio/m4a' } as any);
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
                        }
                      }
                    } catch {}
                  })();
                  return;
                }
                // Mark upload intent and then stop
                shouldUploadRef.current = !cancelMode;
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') mediaRecorderRef.current.stop();
              } catch {}
            }}
            onStartShouldSetResponder={() => true}
            onResponderGrant={(ev: any) => { pressStartYRef.current = ev?.nativeEvent?.pageY ?? null; setCancelMode(false); }}
            onResponderMove={(ev: any) => {
              if (!isRecording) return;
              const startY = pressStartYRef.current;
              const currY = ev?.nativeEvent?.pageY ?? null;
              if (startY != null && currY != null) {
                const dy = startY - currY; // up is positive
                setCancelMode(dy > 50);
              }
            }}
            onResponderRelease={() => { /* handled by onPressOut */ }}
            style={[
              styles.holdRecordButton,
              feedbackSubmitted ? styles.holdRecordButtonThanks : (isRecording ? (cancelMode ? styles.holdRecordButtonCancel : styles.holdRecordButtonActive) : null),
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
      </ScrollView>
    </>
  );

  // Web（有 motion/react）使用中心卡片 + 过渡动画；否则使用原生 Modal
  if (Platform.OS === 'web' && MotionDiv && AnimatePresenceCmp) {
    return (
      <AnimatePresenceCmp>
        {isVisible && (
          <MotionDiv
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
            onClick={onClose}
          >
            <MotionDiv
              key="card"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, easing: 'ease-out' as any }}
              style={{
                width: 'min(92vw, 560px)',
                maxHeight: '80vh',
                overflowY: 'auto',
                background: theme.BACKGROUND,
                borderRadius: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              }}
              onClick={(e: any) => e.stopPropagation()}
            >
              {cardBody}
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresenceCmp>
    );
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal} onStartShouldSetResponder={() => true}>
            {cardBody}
          </View>
        </SafeAreaView>
      </TouchableOpacity>

      {/* 语音录制模态框 */}
      {showVoiceRecorder && order && (
        <Modal
          visible={showVoiceRecorder}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceRecorder(false)}
        >
          <View style={styles.voiceRecorderOverlay}>
            <OrderVoiceRecorder
              orderId={order.id}
              userId={order.userId || 'unknown'}
              onClose={() => setShowVoiceRecorder(false)}
              onSuccess={() => {
                setShowVoiceRecorder(false);
              }}
            />
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: theme.BACKGROUND,
    borderRadius: 16,
    width: Platform.OS === 'web' ? 'auto' : '92%',
    maxWidth: 560,
    maxHeight: '85%',
    minHeight: '52%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.TEXT_SECONDARY,
    fontWeight: '300',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: theme.TEXT_SECONDARY,
    fontWeight: '300',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: theme.TEXT_PRIMARY,
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  valueContainerRight: {
    flex: 2,
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.PRIMARY,
  },
  address: {
    fontSize: 13,
    lineHeight: 18,
  },
  arrivalImageSection: {
    marginTop: 16,
  },
  arrivalImageContainer: {
    marginTop: 8,
  },
  arrivalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
  },
  arrivalImageTime: {
    fontSize: 12,
    color: theme.TEXT_SECONDARY,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  feedbackPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#FFF3CD',
  },
  feedbackPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#B45309',
  },
  voiceFeedbackButton: {
    backgroundColor: theme.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  voiceFeedbackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // New: long-press record button styles
  holdRecordButton: {
    backgroundColor: theme.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
  },
  holdRecordButtonActive: {
    backgroundColor: '#FF4444',
  },
  holdRecordButtonCancel: {
    backgroundColor: '#6B7280',
  },
  holdRecordButtonThanks: {
    backgroundColor: '#FFE8D0',
  },
  holdRecordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  voiceRecorderOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
