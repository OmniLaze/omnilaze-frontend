import React, { useState, useEffect, useCallback } from 'react';
import { View, Animated, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { ActionButton } from './ActionButton';
import { useTheme } from '../contexts/ColorThemeContext';

interface OrderConfirmationComponentProps {
  // 用户填写的所有信息
  address: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  budget: string;
  isFreeOrder?: boolean;
  
  // 动画和状态
  animationValue: Animated.Value;
  onConfirmOrder: () => void;
  onPaymentComplete?: (success: boolean, orderText?: string) => void;
  
  // 处理状态
  isOrderProcessing?: boolean;
  isPaymentModalVisible?: boolean;
}

export const OrderConfirmationComponent: React.FC<OrderConfirmationComponentProps> = ({
  address,
  deliveryTime,
  selectedAllergies,
  selectedPreferences,
  selectedFoodType,
  budget,
  isFreeOrder = false,
  animationValue,
  onConfirmOrder,
  onPaymentComplete,
  isOrderProcessing = false,
  isPaymentModalVisible = false,
}) => {
  const { theme } = useTheme();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // 格式化用户信息为订单确认文字
  const formatOrderConfirmationText = useCallback(() => {
    const foodTypeText = selectedFoodType.includes('drink') ? '奶茶' : '正餐';
    const allergyText = selectedAllergies.length > 0 
      ? Array.from(new Set(selectedAllergies.filter(a => a !== 'none').map(a => {
          // 只包含 checkboxOptions.ts 中原有的选项
          const allergyMap: Record<string, string> = {
            'seafood': '海鲜类',
            'nuts': '坚果类',
            'eggs': '蛋类',
            'soy': '大豆类',
            'dairy': '乳制品类',
            'other-allergy': '其他'
          };
          return allergyMap[a] || a;
        }))).sort((a, b) => a.localeCompare(b, 'zh-CN')).join('、')
      : '';
    
    const preferenceText = selectedPreferences.map(p => {
      const preferenceMap: Record<string, string> = {
        'spicy': '辣',
        'mild': '不辣',
        'sour': '酸',
        'sweet': '甜',
        'light': '清淡',
        'rich': '浓郁',
        'sour-sweet': '酸甜',
        'salty': '咸香',
        'creamy': '奶香',
        'other-preference': '其他'
      };
      return preferenceMap[p] || p;
    }).join('、');
    
    const deliveryTimeText = deliveryTime === 'ASAP' ? '越快越好' : deliveryTime;
    
    let text = `收到，我现在下单\n`;
    text += `为你在 ${address}，\n`;
    text += `安排一份${allergyText ? `不要${allergyText}的` : ''}${preferenceText}口味${foodTypeText}，\n`;
    text += `并且选择${deliveryTimeText}的配送。\n`;
    text += `我会尽力使订单价格逼近${budget}元，\n`;
    text += `若实际下单费用小于${budget}，超出部分将自动退款至你的账户。\n\n`;
    text += `感谢信任！`;
    
    return text;
  }, [address, deliveryTime, selectedAllergies, selectedPreferences, selectedFoodType, budget]);
  
  // 处理确认下单
  const handleConfirmOrder = () => {
    setShowPaymentModal(true);
  };
  
  // 处理支付完成
  const handlePaymentComplete = (success: boolean) => {
    setShowPaymentModal(false);
    
    if (success) {
      // 获取订单确认文字
      const orderText = formatOrderConfirmationText();
      // 通知父组件支付完成，并传递订单文字
      onPaymentComplete?.(true, orderText);
      // 触发订单创建流程
      onConfirmOrder();
    } else {
      onPaymentComplete?.(false);
    }
  };
  
  const styles = createStyles(theme);
  
  const WrapperComponent = animationValue ? Animated.View : View;
  const wrapperProps = animationValue 
    ? {
        style: [
          styles.container,
          {
            opacity: animationValue,
            transform: [{
              translateY: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          },
        ],
      }
    : { style: styles.container };

  return (
    <WrapperComponent {...wrapperProps}>
      <ActionButton
        onPress={handleConfirmOrder}
        title="确认下单"
        isActive={true}
        animationValue={animationValue}
      />
      
      {/* 支付弹窗 */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>支付确认</Text>
            <Text style={styles.modalText}>
              支付金额：¥{budget}
            </Text>
            <Text style={styles.modalNote}>
              {isFreeOrder ? '免单订单' : '请在付款时备注完整手机号'}
            </Text>
            
            {/* 这里预留支付接口 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => handlePaymentComplete(true)}
              >
                <Text style={styles.confirmButtonText}>模拟支付成功</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => handlePaymentComplete(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WrapperComponent>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
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
    flexDirection: 'column',
    gap: 12,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: theme.PRIMARY,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: theme.TEXT_SECONDARY,
    fontSize: 16,
  },
});