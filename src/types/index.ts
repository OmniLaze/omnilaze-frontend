export interface Answer {
  type: 'address' | 'phone' | 'budget' | 'allergy' | 'preference' | 'foodType' | 'payment' | 'deliveryTime' | 'orderConfirmation';
  value: string;
}

export interface CompletedAnswers {
  [key: number]: Answer;
}

export interface StepContent {
  message: string;
  showAddressInput?: boolean;
  showPhoneInput?: boolean;
  showBudgetInput?: boolean;
  showAllergyInput?: boolean;
  showPreferenceInput?: boolean;
  showFoodTypeInput?: boolean;
  showDeliveryTimeInput?: boolean;
  showCompleted?: boolean;
  showPayment?: boolean;
  showOrderConfirmation?: boolean;
  inputType: 'address' | 'phone' | 'budget' | 'allergy' | 'preference' | 'foodType' | 'deliveryTime' | 'completed' | 'payment' | 'orderConfirmation';
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface AddressSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface AddressSearchResponse {
  success: boolean;
  message: string;
  predictions: AddressSuggestion[];
}

export interface AuthResult {
  userId?: string;
  phoneNumber: string;
  isNewUser: boolean;
  userSequence?: number; // 用户注册次序
  isPhoneVerificationStep?: boolean; // 标识这只是手机号验证步骤
  isTestUser?: boolean; // 标识是否为测试用户
}