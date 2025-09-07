import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { PaymentStatus } from '../types/order';

// Auth Context
interface AuthContextValue {
  isAuthenticated: boolean;
  authResult: any;
  authQuestionText: string;
  authResetTrigger: number;
  setIsAuthenticated: (value: boolean) => void;
  setAuthResult: (value: any) => void;
  setAuthQuestionText: (value: string) => void;
  setAuthResetTrigger: (value: number) => void;
  resetAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResult, setAuthResult] = useState<any>(null);
  const [authQuestionText, setAuthQuestionText] = useState('手机号？');
  const [authResetTrigger, setAuthResetTrigger] = useState(0);

  const resetAuth = useCallback(() => {
    setIsAuthenticated(false);
    setAuthResult(null);
    setAuthQuestionText('手机号？');
    setAuthResetTrigger((prev) => prev + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        authResult,
        authQuestionText,
        authResetTrigger,
        setIsAuthenticated,
        setAuthResult,
        setAuthQuestionText,
        setAuthResetTrigger,
        resetAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Form Context
interface FormContextValue {
  address: string;
  budget: string;
  deliveryTime: string;
  selectedAllergies: string[];
  selectedPreferences: string[];
  selectedFoodType: string[];
  otherAllergyText: string;
  otherPreferenceText: string;
  showMap: boolean;
  isAddressConfirmed: boolean;
  selectedAddressSuggestion: any;
  currentStep: number;
  completedAnswers: Record<number, any>;
  editingStep: number | null;
  originalAnswerBeforeEdit: any;
  setAddress: (value: string) => void;
  setBudget: (value: string) => void;
  setDeliveryTime: (value: string) => void;
  setSelectedAllergies: (value: string[]) => void;
  setSelectedPreferences: (value: string[]) => void;
  setSelectedFoodType: (value: string[]) => void;
  setOtherAllergyText: (value: string) => void;
  setOtherPreferenceText: (value: string) => void;
  setShowMap: (value: boolean) => void;
  setIsAddressConfirmed: (value: boolean) => void;
  setSelectedAddressSuggestion: (value: any) => void;
  setCurrentStep: (value: number) => void;
  setCompletedAnswers: (value: Record<number, any> | ((prev: Record<number, any>) => Record<number, any>)) => void;
  setEditingStep: (value: number | null) => void;
  setOriginalAnswerBeforeEdit: (value: any) => void;
  resetForm: () => void;
}

const FormContext = createContext<FormContextValue | undefined>(undefined);

export const FormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedFoodType, setSelectedFoodType] = useState<string[]>([]);
  const [otherAllergyText, setOtherAllergyText] = useState('');
  const [otherPreferenceText, setOtherPreferenceText] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  const [selectedAddressSuggestion, setSelectedAddressSuggestion] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedAnswers, setCompletedAnswers] = useState<Record<number, any>>({});
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [originalAnswerBeforeEdit, setOriginalAnswerBeforeEdit] = useState<any>(null);

  const resetForm = useCallback(() => {
    setAddress('');
    setBudget('');
    setDeliveryTime('');
    setSelectedAllergies([]);
    setSelectedPreferences([]);
    setSelectedFoodType([]);
    setOtherAllergyText('');
    setOtherPreferenceText('');
    setShowMap(false);
    setIsAddressConfirmed(false);
    setSelectedAddressSuggestion(null);
    setCurrentStep(0);
    setCompletedAnswers({});
    setEditingStep(null);
    setOriginalAnswerBeforeEdit(null);
  }, []);

  return (
    <FormContext.Provider
      value={{
        address,
        budget,
        deliveryTime,
        selectedAllergies,
        selectedPreferences,
        selectedFoodType,
        otherAllergyText,
        otherPreferenceText,
        showMap,
        isAddressConfirmed,
        selectedAddressSuggestion,
        currentStep,
        completedAnswers,
        editingStep,
        originalAnswerBeforeEdit,
        setAddress,
        setBudget,
        setDeliveryTime,
        setSelectedAllergies,
        setSelectedPreferences,
        setSelectedFoodType,
        setOtherAllergyText,
        setOtherPreferenceText,
        setShowMap,
        setIsAddressConfirmed,
        setSelectedAddressSuggestion,
        setCurrentStep,
        setCompletedAnswers,
        setEditingStep,
        setOriginalAnswerBeforeEdit,
        resetForm,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within FormProvider');
  }
  return context;
};

// Order Context
interface OrderContextValue {
  // 订单基础信息
  currentOrderId: string | null;
  currentOrderNumber: string | null;
  currentUserSequenceNumber: number | null;
  
  // 订单流程状态
  isOrderSubmitting: boolean;
  isSearchingRestaurant: boolean;
  isOrderCompleted: boolean;
  orderMessage: string;
  
  // 支付状态管理 - 统一的支付状态
  paymentStatus: PaymentStatus;
  isPaymentCompleted: boolean;
  showPaymentModal: boolean;
  
  // 免单和快捷订单
  isFreeOrder: boolean;
  showFreeDrinkModal: boolean;
  isQuickOrderMode: boolean;
  showGoToPaymentButton: boolean;
  
  // 状态设置方法
  setCurrentOrderId: (value: string | null) => void;
  setCurrentOrderNumber: (value: string | null) => void;
  setCurrentUserSequenceNumber: (value: number | null) => void;
  setIsOrderSubmitting: (value: boolean) => void;
  setIsSearchingRestaurant: (value: boolean) => void;
  setIsOrderCompleted: (value: boolean) => void;
  setOrderMessage: (value: string) => void;
  setPaymentStatus: (value: PaymentStatus) => void;
  setIsPaymentCompleted: (value: boolean) => void;
  setShowPaymentModal: (value: boolean) => void;
  setIsFreeOrder: (value: boolean) => void;
  setShowFreeDrinkModal: (value: boolean) => void;
  setIsQuickOrderMode: (value: boolean) => void;
  setShowGoToPaymentButton: (value: boolean) => void;
  
  // 早期订单创建
  createEarlyOrder: () => Promise<boolean>;
  
  // 重置方法
  resetOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 订单基础信息
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [currentUserSequenceNumber, setCurrentUserSequenceNumber] = useState<number | null>(null);
  
  // 订单流程状态
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [isSearchingRestaurant, setIsSearchingRestaurant] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  
  // 支付状态管理 - 统一的支付状态
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // 免单和快捷订单
  const [isFreeOrder, setIsFreeOrder] = useState(false);
  const [showFreeDrinkModal, setShowFreeDrinkModal] = useState(false);
  const [isQuickOrderMode, setIsQuickOrderMode] = useState(false);
  const [showGoToPaymentButton, setShowGoToPaymentButton] = useState(false);

  // 早期订单创建函数 - 在用户开始填写表单时就创建订单
  const createEarlyOrder = useCallback(async (): Promise<boolean> => {
    // 如果已经存在订单，直接返回成功
    if (currentOrderId) {
      console.log('订单已存在，跳过早期创建:', currentOrderId);
      return true;
    }

    try {
      // 导入API函数（延迟导入避免循环依赖）
      const { createEarlyOrder: apiCreateEarlyOrder } = await import('../services/api');
      
      // 这里需要获取用户信息，暂时使用占位实现
      // TODO: 从AuthContext获取用户信息
      const userId = 'temp-user-id';
      const phoneNumber = 'temp-phone';
      
      const result = await apiCreateEarlyOrder(userId, phoneNumber);
      
      if (result.success && result.order_id) {
        setCurrentOrderId(result.order_id);
        setCurrentOrderNumber(result.order_number || null);
        setCurrentUserSequenceNumber(result.user_sequence_number || null);
        setPaymentStatus('unpaid');
        
        console.log('早期订单创建成功:', {
          orderId: result.order_id,
          orderNumber: result.order_number
        });
        
        return true;
      } else {
        console.error('早期订单创建失败:', result.message);
        return false;
      }
    } catch (error) {
      console.error('早期订单创建异常:', error);
      return false;
    }
  }, [currentOrderId]);

  const resetOrder = useCallback(() => {
    setCurrentOrderId(null);
    setCurrentOrderNumber(null);
    setCurrentUserSequenceNumber(null);
    setIsOrderSubmitting(false);
    setIsSearchingRestaurant(false);
    setIsOrderCompleted(false);
    setOrderMessage('');
    setPaymentStatus('unpaid');
    setIsPaymentCompleted(false);
    setShowPaymentModal(false);
    setIsFreeOrder(false);
    setShowFreeDrinkModal(false);
    setIsQuickOrderMode(false);
    setShowGoToPaymentButton(false);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        // 订单基础信息
        currentOrderId,
        currentOrderNumber,
        currentUserSequenceNumber,
        
        // 订单流程状态
        isOrderSubmitting,
        isSearchingRestaurant,
        isOrderCompleted,
        orderMessage,
        
        // 支付状态管理
        paymentStatus,
        isPaymentCompleted,
        showPaymentModal,
        
        // 免单和快捷订单
        isFreeOrder,
        showFreeDrinkModal,
        isQuickOrderMode,
        showGoToPaymentButton,
        
        // 状态设置方法
        setCurrentOrderId,
        setCurrentOrderNumber,
        setCurrentUserSequenceNumber,
        setIsOrderSubmitting,
        setIsSearchingRestaurant,
        setIsOrderCompleted,
        setOrderMessage,
        setPaymentStatus,
        setIsPaymentCompleted,
        setShowPaymentModal,
        setIsFreeOrder,
        setShowFreeDrinkModal,
        setIsQuickOrderMode,
        setShowGoToPaymentButton,
        
        // 早期订单创建
        createEarlyOrder,
        
        // 重置方法
        resetOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within OrderProvider');
  }
  return context;
};

// UI Context
interface UIContextValue {
  completedQuestionsOffset: any;
  currentPushOffset: number;
  isStateRestored: boolean;
  inputError: string;
  setCompletedQuestionsOffset: (value: any) => void;
  setCurrentPushOffset: (value: number) => void;
  setIsStateRestored: (value: boolean) => void;
  setInputError: (value: string) => void;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [completedQuestionsOffset, setCompletedQuestionsOffset] = useState<any>(null);
  const [currentPushOffset, setCurrentPushOffset] = useState(0);
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [inputError, setInputError] = useState('');

  return (
    <UIContext.Provider
      value={{
        completedQuestionsOffset,
        currentPushOffset,
        isStateRestored,
        inputError,
        setCompletedQuestionsOffset,
        setCurrentPushOffset,
        setIsStateRestored,
        setInputError,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};

// Combined App Provider
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <FormProvider>
        <OrderProvider>
          <UIProvider>{children}</UIProvider>
        </OrderProvider>
      </FormProvider>
    </AuthProvider>
  );
};