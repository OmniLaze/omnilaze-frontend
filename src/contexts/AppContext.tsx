import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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
  currentOrderId: string | null;
  currentOrderNumber: string | null;
  currentUserSequenceNumber: number | null;
  isOrderSubmitting: boolean;
  isSearchingRestaurant: boolean;
  isOrderCompleted: boolean;
  orderMessage: string;
  isFreeOrder: boolean;
  showFreeDrinkModal: boolean;
  isQuickOrderMode: boolean;
  showGoToPaymentButton: boolean;
  isPaymentCompleted: boolean;
  showPaymentModal: boolean;
  setCurrentOrderId: (value: string | null) => void;
  setCurrentOrderNumber: (value: string | null) => void;
  setCurrentUserSequenceNumber: (value: number | null) => void;
  setIsOrderSubmitting: (value: boolean) => void;
  setIsSearchingRestaurant: (value: boolean) => void;
  setIsOrderCompleted: (value: boolean) => void;
  setOrderMessage: (value: string) => void;
  setIsFreeOrder: (value: boolean) => void;
  setShowFreeDrinkModal: (value: boolean) => void;
  setIsQuickOrderMode: (value: boolean) => void;
  setShowGoToPaymentButton: (value: boolean) => void;
  setIsPaymentCompleted: (value: boolean) => void;
  setShowPaymentModal: (value: boolean) => void;
  resetOrder: () => void;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [currentOrderNumber, setCurrentOrderNumber] = useState<string | null>(null);
  const [currentUserSequenceNumber, setCurrentUserSequenceNumber] = useState<number | null>(null);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [isSearchingRestaurant, setIsSearchingRestaurant] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [isFreeOrder, setIsFreeOrder] = useState(false);
  const [showFreeDrinkModal, setShowFreeDrinkModal] = useState(false);
  const [isQuickOrderMode, setIsQuickOrderMode] = useState(false);
  const [showGoToPaymentButton, setShowGoToPaymentButton] = useState(false);
  const [isPaymentCompleted, setIsPaymentCompleted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const resetOrder = useCallback(() => {
    setCurrentOrderId(null);
    setCurrentOrderNumber(null);
    setCurrentUserSequenceNumber(null);
    setIsOrderSubmitting(false);
    setIsSearchingRestaurant(false);
    setIsOrderCompleted(false);
    setOrderMessage('');
    setIsFreeOrder(false);
    setShowFreeDrinkModal(false);
    setIsQuickOrderMode(false);
    setShowGoToPaymentButton(false);
    setIsPaymentCompleted(false);
    setShowPaymentModal(false);
  }, []);

  return (
    <OrderContext.Provider
      value={{
        currentOrderId,
        currentOrderNumber,
        currentUserSequenceNumber,
        isOrderSubmitting,
        isSearchingRestaurant,
        isOrderCompleted,
        orderMessage,
        isFreeOrder,
        showFreeDrinkModal,
        isQuickOrderMode,
        showGoToPaymentButton,
        isPaymentCompleted,
        showPaymentModal,
        setCurrentOrderId,
        setCurrentOrderNumber,
        setCurrentUserSequenceNumber,
        setIsOrderSubmitting,
        setIsSearchingRestaurant,
        setIsOrderCompleted,
        setOrderMessage,
        setIsFreeOrder,
        setShowFreeDrinkModal,
        setIsQuickOrderMode,
        setShowGoToPaymentButton,
        setIsPaymentCompleted,
        setShowPaymentModal,
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