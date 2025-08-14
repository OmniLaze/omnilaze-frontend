import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ColorThemeContext';

const { width } = Dimensions.get('window');

interface DeliveryTimeStepProps {
  onConfirm: (deliveryTime: string) => void;
  initialValue?: string;
}

export const DeliveryTimeStep: React.FC<DeliveryTimeStepProps> = ({
  onConfirm,
  initialValue = '',
}) => {
  const { theme } = useTheme();
  const [selectedOption, setSelectedOption] = useState<'asap' | 'scheduled' | null>(
    initialValue === 'ASAP' ? 'asap' : initialValue ? 'scheduled' : null
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    initialValue !== 'ASAP' ? initialValue : ''
  );
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));

  // 生成可用时间列表
  useEffect(() => {
    const generateTimeSlots = () => {
      const times: string[] = [];
      const now = new Date();
      // 转换为北京时间 (UTC+8)
      const beijingOffset = 8 * 60; // 北京时间偏移分钟数
      const localOffset = now.getTimezoneOffset(); // 本地时区偏移分钟数
      const totalOffset = beijingOffset + localOffset;
      
      now.setMinutes(now.getMinutes() + totalOffset);
      
      // 从当前时间1小时后开始
      const startTime = new Date(now);
      startTime.setHours(startTime.getHours() + 1);
      startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15); // 向上取整到15分钟
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
      
      // 生成到今天23:45的时间段
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 45, 0, 0);
      
      let currentTime = new Date(startTime);
      while (currentTime <= endOfDay) {
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        times.push(`${hours}:${minutes}`);
        currentTime.setMinutes(currentTime.getMinutes() + 15);
      }
      
      return times;
    };

    setAvailableTimes(generateTimeSlots());
    
    // 每分钟更新一次可用时间
    const interval = setInterval(() => {
      setAvailableTimes(generateTimeSlots());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleOptionSelect = (option: 'asap' | 'scheduled') => {
    setSelectedOption(option);
    if (option === 'asap') {
      setSelectedTime('');
    }
    
    // 点击动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedOption('scheduled');
  };

  const handleConfirm = () => {
    if (selectedOption === 'asap') {
      onConfirm('ASAP');
    } else if (selectedOption === 'scheduled' && selectedTime) {
      onConfirm(selectedTime);
    }
  };

  const isConfirmDisabled = !selectedOption || (selectedOption === 'scheduled' && !selectedTime);

  return (
    <Animated.View style={[createStyles(theme).container, { opacity: fadeAnim }]}>
      
      {/* 快速选项 */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            createStyles(theme).quickOption,
            selectedOption === 'asap' && createStyles(theme).quickOptionSelected,
          ]}
          onPress={() => handleOptionSelect('asap')}
          activeOpacity={0.8}
        >
          <View style={createStyles(theme).quickOptionContent}>
            <Feather 
              name="zap" 
              size={24} 
              color={selectedOption === 'asap' ? theme.PRIMARY : '#666'} 
            />
            <View style={createStyles(theme).quickOptionText}>
              <Text style={[
                createStyles(theme).quickOptionTitle,
                selectedOption === 'asap' && createStyles(theme).quickOptionTitleSelected
              ]}>
                越快越好
              </Text>
              <Text style={[
                createStyles(theme).quickOptionSubtitle,
                selectedOption === 'asap' && createStyles(theme).quickOptionSubtitleSelected
              ]}>
                约45分钟送达
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 时间选择选项 */}
      <TouchableOpacity
        style={[
          createStyles(theme).quickOption,
          selectedOption === 'scheduled' && createStyles(theme).quickOptionSelected,
        ]}
        onPress={() => handleOptionSelect('scheduled')}
        activeOpacity={0.8}
      >
        <View style={createStyles(theme).quickOptionContent}>
          <Feather 
            name="clock" 
            size={24} 
            color={selectedOption === 'scheduled' ? theme.PRIMARY : '#666'} 
          />
          <View style={createStyles(theme).quickOptionText}>
            <Text style={[
              createStyles(theme).quickOptionTitle,
              selectedOption === 'scheduled' && createStyles(theme).quickOptionTitleSelected
            ]}>
              预约时间
            </Text>
            <Text style={[
              createStyles(theme).quickOptionSubtitle,
              selectedOption === 'scheduled' && createStyles(theme).quickOptionSubtitleSelected
            ]}>
              {selectedTime || '选择送达时间'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* 时间选择器 */}
      {selectedOption === 'scheduled' && (
        <Animated.View 
          style={[
            createStyles(theme).timePickerContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={createStyles(theme).timeScrollContent}
          >
            {availableTimes.length > 0 ? (
              availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    createStyles(theme).timeSlot,
                    selectedTime === time && createStyles(theme).timeSlotSelected,
                  ]}
                  onPress={() => handleTimeSelect(time)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      createStyles(theme).timeSlotText,
                      selectedTime === time && createStyles(theme).timeSlotTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={createStyles(theme).noTimesText}>今日已无可预约时间</Text>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* 确认按钮 */}
      <TouchableOpacity
        style={[
          createStyles(theme).confirmButton,
          isConfirmDisabled && createStyles(theme).confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={isConfirmDisabled}
        activeOpacity={0.8}
      >
        <Text style={[
          createStyles(theme).confirmButtonText,
          isConfirmDisabled && createStyles(theme).confirmButtonTextDisabled,
        ]}>
          确认时间
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    marginTop: width > 768 ? 16 : 8, // 与其他组件保持一致的响应式间距
    marginLeft: 0,
    maxWidth: 500,
  },
  quickOption: {
    backgroundColor: theme.WHITE,
    borderRadius: width > 768 ? 12 : 8,
    borderWidth: 1.8,
    borderColor: '#EEEAE7', // 与ImageCheckbox保持一致的浅灰边框
    padding: width > 768 ? 12 : 12,
    alignItems: 'center',
    justifyContent: width > 768 ? 'space-between' : 'flex-start',
    flexDirection: width > 768 ? 'column' : 'row',
    position: 'relative',
    elevation: 2,
    marginBottom: 12,
  },
  quickOptionSelected: {
    borderColor: theme.PRIMARY, // 只改变边框颜色，与ImageCheckbox一致
  },
  quickOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  quickOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  quickOptionTitle: {
    fontSize: width > 768 ? 21 : 16,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
    marginBottom: 2,
  },
  quickOptionTitleSelected: {
    color: theme.PRIMARY, // 与ImageCheckbox一致，选中时文字变主色
    fontWeight: '600',
  },
  quickOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  quickOptionSubtitleSelected: {
    color: theme.PRIMARY, // 与ImageCheckbox一致
  },
  timePickerContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  timeScrollContent: {
    paddingHorizontal: 4,
  },
  timeSlot: {
    backgroundColor: theme.WHITE,
    borderRadius: width > 768 ? 12 : 8,
    borderWidth: 1.8,
    borderColor: '#EEEAE7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    minWidth: 70,
    alignItems: 'center',
    elevation: 2,
  },
  timeSlotSelected: {
    borderColor: theme.PRIMARY,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
  },
  timeSlotTextSelected: {
    color: theme.PRIMARY,
    fontWeight: '600',
  },
  noTimesText: {
    fontSize: 14,
    color: '#999',
    padding: 20,
  },
  confirmButton: {
    backgroundColor: theme.PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
});