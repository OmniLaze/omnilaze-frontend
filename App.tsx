import React, { useState, useCallback, useEffect, memo } from 'react';
import {
  Platform,
  StatusBar,
  ScrollView,
  View,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useWindowDimensions } from 'react-native';

// Load global CSS on web
if (Platform.OS === 'web') {
  require('./src/styles/global.css');
}

// Context Providers
import { AppProviders, useAuth, useForm, useOrder, useUI } from './src/contexts/AppContext';
import { ColorThemeProvider, useTheme } from './src/contexts/ColorThemeContext';

// Components
import { ProgressSteps } from './src/components/ProgressSteps';
import { MobileHeader } from './src/components/MobileHeader';
import { UserMenu } from './src/components/UserMenu';
import { InviteModalWithFreeDrink } from './src/components/InviteModalWithFreeDrink';
import { OrderHistorySidebar } from './src/components/OrderHistorySidebar';
import QuestionWizard from './src/components/QuestionWizard';
import { TextNodeDebugger } from './src/components/TextNodeDebugger';

// Hooks
import { useWebAdaptation } from './src/platform/useWebAdaptation';
import { useOrderSocket } from './src/hooks/useOrderSocket';
import { useAnimationManager } from './src/hooks/useAnimationManager';

// Styles
import { createGlobalStyles } from './src/styles/globalStyles';

// Constants
const { height, width: screenWidth } = Dimensions.get('window');

// Main App Component (wrapped with providers)
const AppContent = memo(() => {
  // Web adaptation
  useWebAdaptation();
  
  // Get dimensions
  const { width, height: windowHeight } = useWindowDimensions();
  
  // Context hooks
  const auth = useAuth();
  const form = useForm();
  const order = useOrder();
  const ui = useUI();
  
  // Theme
  const { theme } = useTheme();
  const globalStyles = createGlobalStyles(theme, { width, height: windowHeight });
  
  // Animation manager
  const { emotionAnimation } = useAnimationManager();
  
  // Local state
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [previousStep, setPreviousStep] = useState<number | undefined>(undefined);
  const [orderMessagesLog, setOrderMessagesLog] = useState<any[]>([]);
  
  // Order message push function
  const pushOrderMessage = useCallback((text: string, avatar: 'assistant' | 'delivery') => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setOrderMessagesLog(prev => [...prev, { id, text, avatar }]);
  }, []);
  
  // WebSocket configuration
  const socketConfig = React.useMemo(() => ({
    userId: auth.authResult?.userId,
    orderId: order.currentOrderId,
    enabled: auth.isAuthenticated && order.isPaymentCompleted && order.currentOrderId,
    jwtToken: auth.authResult?.token,
    onOrderStatusChanged: (event: any) => {
      if (event.message) {
        pushOrderMessage(event.message, 'assistant');
      }
    },
    onOrderETASet: (event: any) => {
      if (event.message) {
        pushOrderMessage(event.message, 'assistant');
      }
    },
    onOrderDelivered: (event: any) => {
      if (event.message) {
        pushOrderMessage(event.message, 'delivery');
      }
    },
  }), [auth.authResult, auth.isAuthenticated, order.currentOrderId, order.isPaymentCompleted, pushOrderMessage]);
  
  const { isConnected: isSocketConnected, subscribeToOrder } = useOrderSocket(socketConfig);
  
  // Subscribe to order updates
  useEffect(() => {
    if (isSocketConnected && order.currentOrderId && order.isPaymentCompleted) {
      subscribeToOrder(order.currentOrderId);
    }
  }, [isSocketConnected, order.currentOrderId, order.isPaymentCompleted, subscribeToOrder]);
  
  // Persist order messages
  useEffect(() => {
    if (!ui.isStateRestored || !auth.isAuthenticated) return;
    const key = `order_messages_log_${auth.authResult?.userId || 'unknown'}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setOrderMessagesLog(parsed);
        }
      }
    } catch {}
  }, [ui.isStateRestored, auth.isAuthenticated, auth.authResult]);
  
  useEffect(() => {
    if (!auth.isAuthenticated) return;
    const key = `order_messages_log_${auth.authResult?.userId || 'unknown'}`;
    try {
      localStorage.setItem(key, JSON.stringify(orderMessagesLog));
    } catch {}
  }, [orderMessagesLog, auth.isAuthenticated, auth.authResult]);
  
  // Handle step changes
  useEffect(() => {
    setPreviousStep(form.currentStep);
  }, [form.currentStep]);
  
  // Get step title
  const getStepTitle = (step: number) => {
    const titles = [
      '配送地址',
      '食物类型',
      '忌口说明',
      '口味偏好',
      '用餐时间',
      '预算设置',
      '订单确认'
    ];
    return titles[step] || '懒得点外卖';
  };
  
  // Handle logout
  const handleLogout = useCallback(() => {
    // Clear storage
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('user_id');
      localStorage.removeItem('phone_number');
    }
    
    // Reset all contexts
    auth.resetAuth();
    form.resetForm();
    order.resetOrder();
    ui.setInputError('');
    ui.setIsStateRestored(false);
    
    // Clear messages
    setOrderMessagesLog([]);
  }, [auth, form, order, ui]);
  
  // Handle invite
  const handleInvite = useCallback(() => {
    order.setShowFreeDrinkModal(true);
  }, [order]);
  
  // Handle free drink claim
  const handleFreeDrinkClaim = useCallback(() => {
    order.setShowFreeDrinkModal(false);
    order.setIsFreeOrder(true);
    form.setSelectedFoodType(['drink']);
    form.setBudget('0');
    form.setCurrentStep(0);
    form.setEditingStep(null);
    form.setCompletedAnswers({});
  }, [order, form]);
  
  // Handle new order
  const handleNewOrder = useCallback(() => {
    order.setIsOrderCompleted(false);
    order.setIsSearchingRestaurant(false);
    order.setOrderMessage('');
    form.setEditingStep(null);
    form.setCurrentStep(0);
    form.setBudget('');
    order.setIsPaymentCompleted(false);
    order.setShowGoToPaymentButton(false);
    order.setShowPaymentModal(false);
    order.setIsQuickOrderMode(false);
    
    const currentAnswers = { ...form.completedAnswers };
    delete currentAnswers[5]; // Remove budget answer
    form.setCompletedAnswers(currentAnswers);
    
    setOrderMessagesLog([]);
    try {
      const key = `order_messages_log_${auth.authResult?.userId || 'unknown'}`;
      localStorage.setItem(key, JSON.stringify([]));
    } catch {}
  }, [order, form, auth.authResult]);
  
  // Set state restored flag
  useEffect(() => {
    ui.setIsStateRestored(true);
  }, []);
  
  return (
    <View style={[globalStyles.container, { backgroundColor: theme.BACKGROUND }]}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.BACKGROUND} />
      
      {/* User Menu - Desktop only */}
      {auth.isAuthenticated && (
        <UserMenu
          isVisible={Platform.OS === 'web' && width > 768}
          onLogout={handleLogout}
          onInvite={handleInvite}
          phoneNumber={auth.authResult?.phoneNumber || ''}
        />
      )}
      
      {/* Order History Sidebar */}
      {auth.isAuthenticated && (
        <OrderHistorySidebar
          isVisible={showOrderHistory}
          onClose={() => setShowOrderHistory(false)}
          userId={auth.authResult?.userId || null}
        />
      )}
      
      {/* Invite Modal */}
      {auth.authResult && (
        <InviteModalWithFreeDrink
          isVisible={order.showFreeDrinkModal}
          onClose={() => order.setShowFreeDrinkModal(false)}
          onFreeDrinkClaim={handleFreeDrinkClaim}
          userPhoneNumber={auth.authResult.phoneNumber}
          userId={auth.authResult.userId!}
        />
      )}
      
      {/* Progress Steps - Desktop only */}
      {auth.isAuthenticated && Platform.OS === 'web' && (
        <ProgressSteps currentStep={form.currentStep} />
      )}
      
      {/* Mobile Header */}
      {auth.isAuthenticated && (
        <MobileHeader
          title={getStepTitle(form.currentStep)}
          phoneNumber={auth.authResult?.phoneNumber}
          emotionAnimation={emotionAnimation}
          onMenuPress={() => order.setShowFreeDrinkModal(true)}
          onLogout={handleLogout}
          onInvite={handleInvite}
          onHistoryPress={() => setShowOrderHistory(true)}
          onNewOrderPress={handleNewOrder}
          currentStep={form.currentStep}
          previousStep={previousStep}
          isOrderCompleted={order.isOrderCompleted}
        />
      )}
      
      {/* Main Question Wizard */}
      <QuestionWizard
        theme={theme}
        width={width}
        height={windowHeight}
        orderMessagesLog={orderMessagesLog}
        pushOrderMessage={pushOrderMessage}
      />
    </View>
  );
});

AppContent.displayName = 'AppContent';

// Main App Component with all providers
function App() {
  return (
    <TextNodeDebugger>
      <ColorThemeProvider>
        <AppProviders>
          <AppContent />
        </AppProviders>
      </ColorThemeProvider>
    </TextNodeDebugger>
  );
}

export default App;