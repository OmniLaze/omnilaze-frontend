import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../contexts/ColorThemeContext';
import { ENV_CONFIG } from '../config/env';

interface OrderVoiceRecorderProps {
  orderId: string;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrderVoiceRecorder: React.FC<OrderVoiceRecorderProps> = ({
  orderId,
  userId,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 清理函数
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 开始录音
  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        
        // 启动计时器
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        setIsRecording(true);
      } else {
        // Expo Audio implementation would go here
        Alert.alert('提示', '移动端录音功能需要额外配置 expo-av');
      }
    } catch (error) {
      console.error('录音失败:', error);
      Alert.alert('错误', '无法访问麦克风，请检查权限设置');
    }
  };

  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 播放录音
  const playRecording = () => {
    if (audioBlob && Platform.OS === 'web') {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      audioRef.current = audio;
      setIsPlaying(true);
    }
  };

  // 停止播放
  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }
  };

  // 重新录制
  const resetRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  // 上传录音
  const uploadRecording = async () => {
    if (!audioBlob) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('user_id', userId);
      formData.append('duration_sec', recordingTime.toString());
      
      const response = await fetch(`${ENV_CONFIG.API_URL}/v1/orders/${orderId}/feedback/audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('成功', '语音反馈已上传');
        onSuccess?.();
        onClose();
      } else {
        Alert.alert('错误', result.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>语音反馈</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* 录音时间显示 */}
        <View style={styles.timeDisplay}>
          <Text style={styles.timeText}>{formatTime(recordingTime)}</Text>
          {isRecording && <Text style={styles.recordingIndicator}>● 录音中</Text>}
        </View>

        {/* 控制按钮 */}
        <View style={styles.controls}>
          {!audioBlob ? (
            // 录音控制
            <View style={styles.recordingControls}>
              {!isRecording ? (
                <TouchableOpacity 
                  style={[styles.button, styles.recordButton]} 
                  onPress={startRecording}
                >
                  <Text style={styles.buttonText}>开始录音</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.stopButton]} 
                  onPress={stopRecording}
                >
                  <Text style={styles.buttonText}>停止录音</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // 播放和上传控制
            <View style={styles.playbackControls}>
              {!isPlaying ? (
                <TouchableOpacity 
                  style={[styles.button, styles.playButton]} 
                  onPress={playRecording}
                >
                  <Text style={styles.buttonText}>播放</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.button, styles.stopButton]} 
                  onPress={stopPlaying}
                >
                  <Text style={styles.buttonText}>停止</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={[styles.button, styles.resetButton]} 
                onPress={resetRecording}
              >
                <Text style={styles.buttonText}>重录</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.uploadButton, isUploading && styles.disabledButton]} 
                onPress={uploadRecording}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>上传</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 提示信息 */}
        <Text style={styles.hint}>
          {!audioBlob 
            ? '点击开始录音，最长支持3分钟' 
            : '您可以播放录音检查，或直接上传'}
        </Text>
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.BACKGROUND,
    borderRadius: 12,
    padding: 20,
    width: Platform.OS === 'web' ? 400 : '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.TEXT_PRIMARY,
  },
  closeButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.TEXT_SECONDARY,
  },
  content: {
    alignItems: 'center',
  },
  timeDisplay: {
    marginBottom: 30,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 36,
    fontWeight: '300',
    color: theme.TEXT_PRIMARY,
  },
  recordingIndicator: {
    fontSize: 14,
    color: '#FF4444',
    marginTop: 8,
  },
  controls: {
    marginBottom: 20,
  },
  recordingControls: {
    alignItems: 'center',
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#FF4444',
  },
  stopButton: {
    backgroundColor: theme.TEXT_SECONDARY,
  },
  playButton: {
    backgroundColor: theme.PRIMARY,
  },
  resetButton: {
    backgroundColor: theme.TEXT_SECONDARY,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: theme.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: 10,
  },
});
