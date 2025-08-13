import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { 
  allergyMap, 
  preferenceMap, 
  foodTypeMap, 
  convertToChineseDisplay,
  formatDeliveryTime,
  formatOrderStatus 
} from '../utils/orderDataMapper';

interface Order {
  id: string;
  orderNumber: string;
  address: string;
  budget?: string;
  amount?: string;
  totalAmount?: string;
  status: 'pending' | 'processing' | 'delivering' | 'completed' | 'cancelled';
  createdAt: string;
  deliveryTime?: string;
  foodType?: string[];
  preferences?: string[];
  allergies?: string[];
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

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.modal}>
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
                  <Text style={[styles.value, { color: getStatusColor(order.status) }]}>
                    {getStatusText(order.status)}
                  </Text>
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
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: theme.BACKGROUND,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
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
  amount: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.PRIMARY,
  },
  address: {
    fontSize: 13,
    lineHeight: 18,
  },
});