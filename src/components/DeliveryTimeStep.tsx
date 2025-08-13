import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface DeliveryTimeStepProps {
  onConfirm: (deliveryTime: string) => void;
  initialValue?: string;
}

export const DeliveryTimeStep: React.FC<DeliveryTimeStepProps> = ({
  onConfirm,
  initialValue = '',
}) => {
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      
      {/* 快速选项 */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.quickOption,
            selectedOption === 'asap' && styles.quickOptionSelected,
          ]}
          onPress={() => handleOptionSelect('asap')}
          activeOpacity={0.8}
        >
          <View style={styles.quickOptionContent}>
            <Feather 
              name="zap" 
              size={24} 
              color={selectedOption === 'asap' ? '#fff' : '#FF6B35'} 
            />
            <View style={styles.quickOptionText}>
              <Text style={[
                styles.quickOptionTitle,
                selectedOption === 'asap' && styles.quickOptionTitleSelected
              ]}>
                越快越好
              </Text>
              <Text style={[
                styles.quickOptionSubtitle,
                selectedOption === 'asap' && styles.quickOptionSubtitleSelected
              ]}>
                约45分钟送达
              </Text>
            </View>
          </View>
          {selectedOption === 'asap' && (
            <Feather name="check-circle" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* 时间选择选项 */}
      <TouchableOpacity
        style={[
          styles.quickOption,
          selectedOption === 'scheduled' && styles.quickOptionSelected,
        ]}
        onPress={() => handleOptionSelect('scheduled')}
        activeOpacity={0.8}
      >
        <View style={styles.quickOptionContent}>
          <Feather 
            name="clock" 
            size={24} 
            color={selectedOption === 'scheduled' ? '#fff' : '#FF6B35'} 
          />
          <View style={styles.quickOptionText}>
            <Text style={[
              styles.quickOptionTitle,
              selectedOption === 'scheduled' && styles.quickOptionTitleSelected
            ]}>
              预约时间
            </Text>
            <Text style={[
              styles.quickOptionSubtitle,
              selectedOption === 'scheduled' && styles.quickOptionSubtitleSelected
            ]}>
              {selectedTime || '选择送达时间'}
            </Text>
          </View>
        </View>
        {selectedOption === 'scheduled' && selectedTime && (
          <Feather name="check-circle" size={20} color="#fff" />
        )}
      </TouchableOpacity>

      {/* 时间选择器 */}
      {selectedOption === 'scheduled' && (
        <Animated.View 
          style={[
            styles.timePickerContainer,
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
            contentContainerStyle={styles.timeScrollContent}
          >
            {availableTimes.length > 0 ? (
              availableTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.timeSlotSelected,
                  ]}
                  onPress={() => handleTimeSelect(time)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      selectedTime === time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noTimesText}>今日已无可预约时间</Text>
            )}
          </ScrollView>
        </Animated.View>
      )}

      {/* 确认按钮 */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          isConfirmDisabled && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={isConfirmDisabled}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.confirmButtonText,
          isConfirmDisabled && styles.confirmButtonTextDisabled,
        ]}>
          确认时间
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  quickOption: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#f0f0f0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickOptionSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  quickOptionTitleSelected: {
    color: '#fff',
  },
  quickOptionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  quickOptionSubtitleSelected: {
    color: '#ffe0d6',
  },
  timePickerContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  timeScrollContent: {
    paddingHorizontal: 4,
  },
  timeSlot: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#f0f0f0',
    minWidth: 70,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  timeSlotTextSelected: {
    color: '#fff',
  },
  noTimesText: {
    fontSize: 14,
    color: '#999',
    padding: 20,
  },
  confirmButton: {
    backgroundColor: '#FF6B35',
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