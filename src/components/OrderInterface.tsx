import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { OrderDetailSection } from './OrderDetailSection';
import { Order, PaymentStatus } from '../types/order';
import { formatOrderForDisplay } from '../utils/orderTransformer';
import { ActionButton } from './ActionButton';
import { getOrderDisplayStatus, createPaymentForHistoryOrder } from '../services/api';
import { ENV_CONFIG } from '../config/env';

interface OrderInterfaceProps {
  order: Order;
  showPaymentButton?: boolean;
  onPayment?: () => void;
  onOrderUpdate?: (updatedOrder: Order) => void;
  compact?: boolean; // 紧凑模式，用于历史页面
  showFullDetails?: boolean; // 是否显示完整详情
  enablePaymentContinuation?: boolean; // 是否启用支付继续功能
}

/**
 * 统一的订单界面组件
 * 可用于主界面的订单确认和历史页面的订单详情
 */
export const OrderInterface: React.FC<OrderInterfaceProps> = ({
  order,
  showPaymentButton = false,
  onPayment,
  onOrderUpdate,
  compact = false,
  showFullDetails = true,
  enablePaymentContinuation = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 格式化订单数据用于显示
  const displayOrder = formatOrderForDisplay(order);
  
  // 获取订单显示状态信息
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

  // 处理支付按钮点击 - 支持继续支付功能
  const handlePaymentClick = async () => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      
      if (enablePaymentContinuation && statusInfo.canContinuePayment) {
        // 从历史订单继续支付
        setShowPaymentModal(true);
      } else if (onPayment) {
        // 常规支付流程
        await onPayment();
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      Alert.alert('支付失败', '请重试');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 处理历史订单支付确认
  const handleHistoryOrderPayment = async () => {
    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      
      const paymentData = {
        provider: 'alipay' as const,
        amount: order.budgetAmount,
        paymentMethod: 'h5' as const,
      };

      const response = await createPaymentForHistoryOrder(order.id, paymentData);
      
      if (response.success && response.data?.h5_url) {
        // 跳转到支付页面
        const { redirectToAlipayPayment } = await import('../services/api');
        redirectToAlipayPayment(response.data.h5_url);
        
        // 开始轮询支付状态（可以在这里添加轮询逻辑）
        Alert.alert('支付提示', '请在弹出的页面完成支付，支付完成后订单状态会自动更新');
        setShowPaymentModal(false);
      } else {
        Alert.alert('支付失败', response.message || '创建支付失败');
      }
    } catch (error) {
      console.error('历史订单支付失败:', error);
      Alert.alert('支付失败', '请重试');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // 判断是否需要显示支付按钮
  const shouldShowPaymentButton = showPaymentButton || 
    (enablePaymentContinuation && statusInfo.canContinuePayment);

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* 订单状态指示器 */}
      <View style={styles.statusSection}>
        <View style={[styles.statusPill, { backgroundColor: statusInfo.displayStatusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusInfo.displayStatusColor }]}>
            {statusInfo.displayStatusText}
          </Text>
        </View>
        {(order.paymentStatus === 'unpaid' || order.paymentStatus === 'failed') && (
          <Text style={styles.unpaidHint}>
            {order.paymentStatus === 'failed' ? '支付失败' : '未支付'}
          </Text>
        )}
      </View>

      {/* 测试订单标识 */}
      {order.isTestOrder && ENV_CONFIG.TEST_MODE.SHOW_TEST_INDICATORS && (
        <View style={styles.testIndicator}>
          <Text style={styles.testIndicatorText}>🧪 测试订单</Text>
        </View>
      )}

      {/* 基本信息 */}
      <View style={styles.section}>
        <OrderDetailSection
          label="订单号"
          value={`#${order.orderNumber}`}
          icon="receipt"
        />
        <OrderDetailSection
          label="下单时间"
          value={formatDateTime(order.createdAt)}
          icon="clock"
        />
        <OrderDetailSection
          label="订单金额"
          value={displayOrder.displayAmount}
          icon="dollar-sign"
          showDivider={!compact && showFullDetails}
        />
      </View>

      {/* 完整详情信息 */}
      {showFullDetails && !compact && (
        <>
          {/* 配送信息 */}
          <View style={styles.section}>
            <OrderDetailSection
              label="配送地址"
              value={order.deliveryAddress}
              icon="map-pin"
            />
            <OrderDetailSection
              label="用餐时间"
              value={displayOrder.displayDeliveryTime}
              icon="clock"
            />
            <OrderDetailSection
              label="预计送达"
              value={getEtaDisplay()}
              icon="truck"
            />
            <View style={styles.divider} />
          </View>

          {/* 点单详情 */}
          <View style={styles.section}>
            <OrderDetailSection
              label="食物类型"
              value={displayOrder.displayFoodType}
              icon="coffee"
            />
            <OrderDetailSection
              label="忌口说明"
              value={displayOrder.displayDietaryRestrictions}
              icon="x-circle"
            />
            <OrderDetailSection
              label="口味偏好"
              value={displayOrder.displayFoodPreferences}
              icon="heart"
            />
          </View>
        </>
      )}

      {/* 支付按钮 */}
      {shouldShowPaymentButton && (
        <View style={styles.paymentSection}>
          <ActionButton
            onPress={handlePaymentClick}
            title={isProcessingPayment ? "处理中..." : 
                  enablePaymentContinuation ? "继续支付" : "去支付"}
            disabled={isProcessingPayment}
            isActive={!isProcessingPayment}
          />
          {isProcessingPayment && (
            <ActivityIndicator 
              style={styles.paymentLoader} 
              color={theme.PRIMARY} 
              size="small" 
            />
          )}
        </View>
      )}

      {/* 历史订单支付确认弹窗 */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>继续支付</Text>
            <Text style={styles.modalText}>
              订单金额：¥{order.budgetAmount.toFixed(2)}
            </Text>
            <Text style={styles.modalNote}>
              将使用支付宝完成此订单的支付
            </Text>
            
            <View style={styles.modalButtons}>
              <ActionButton
                onPress={handleHistoryOrderPayment}
                title={isProcessingPayment ? "处理中..." : "确认支付"}
                disabled={isProcessingPayment}
                isActive={!isProcessingPayment}
              />
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
                disabled={isProcessingPayment}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.BACKGROUND,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
  },
  compactContainer: {
    padding: 12,
    marginVertical: 4,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  unpaidHint: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '500',
  },
  testIndicator: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  testIndicatorText: {
    fontSize: 12,
    color: '#856404',
    fontWeight: '500',
  },
  section: {
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    marginVertical: 8,
  },
  paymentSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.BORDER || 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    position: 'relative',
  },
  paymentLoader: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.BACKGROUND,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
    margin: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.TEXT_PRIMARY,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
    color: theme.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalNote: {
    fontSize: 14,
    color: theme.TEXT_SECONDARY,
    marginBottom: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalButtons: {
    gap: 12,
  },
  cancelButton: {
    backgroundColor: theme.BORDER || '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: theme.TEXT_SECONDARY,
    fontSize: 16,
    fontWeight: '500',
  },
});