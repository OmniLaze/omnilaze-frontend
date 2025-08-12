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
    message: "好的，这一顿打算花多少钱？",
    showBudgetInput: true,
    inputType: "budget"
  }
];