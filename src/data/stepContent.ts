import { StepContent } from '../types';

export const STEP_CONTENT: StepContent[] = [
  {
    message: "想在哪里收到你的外卖？",
    showAddressInput: true, 
    inputType: "address"
  },
  {
    message: "喝奶茶还是吃饭呢？",
    showFoodTypeInput: true,
    inputType: "foodType"
  },
  {
    message: "有忌口或者过敏源嘛？",
    showAllergyInput: true,
    inputType: "allergy"
  },
  {
    message: "想吃什么口味的？",
    showPreferenceInput: true,
    inputType: "preference"
  },
  {
    message: "想什么时候用餐？",
    showDeliveryTimeInput: true,
    inputType: "deliveryTime"
  },
  {
    message: "好的，这一顿打算花多少钱？",
    showBudgetInput: true,
    inputType: "budget"
  },
  {
    message: "", // 空文本，因为总结文字由OrderConfirmationComponent直接管理
    showOrderConfirmation: true,
    inputType: "orderConfirmation"
  }
];