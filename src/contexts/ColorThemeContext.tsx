import React, { createContext, useContext, ReactNode } from 'react';
import { useColorTheme } from '../hooks/useColorTheme';

interface ColorTheme {
  // 主要颜色系统
  PRIMARY: string;
  PRIMARY_LIGHT: string;
  PRIMARY_DARK: string; 
  BACKGROUND: string;
  WHITE: string;
  BLACK: string;
  
  // 文本颜色系统
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  TEXT_MUTED: string;
  TEXT_INVERSE: string;
  
  // 状态颜色系统
  SUCCESS: string;
  SUCCESS_LIGHT: string;
  ERROR: string;
  ERROR_BACKGROUND: string;
  WARNING: string;
  WARNING_BACKGROUND: string;
  WARNING_BORDER: string;
  WARNING_TEXT: string;
  INFO: string;
  INFO_LIGHT: string;
  
  // 灰色系统
  GRAY_50: string;
  GRAY_100: string;
  GRAY_200: string;
  GRAY_300: string;
  GRAY_400: string;
  GRAY_500: string;
  GRAY_600: string;
  GRAY_700: string;
  GRAY_800: string;
  GRAY_900: string;
  
  // 界面元素颜色
  BORDER: string;
  BORDER_LIGHT: string;
  SHADOW: string;
  CARD_BACKGROUND: string;
  DISABLED_BACKGROUND: string;
  DISABLED_TEXT: string;
  PLACEHOLDER_TEXT: string;
  
  // 特殊效果颜色
  OVERLAY: string;
  OVERLAY_LIGHT: string;
  OVERLAY_DARK: string;
  TRANSPARENT: string;
  
  // 常用的UI颜色
  DIVIDER: string;
  HOVER: string;
  FOCUS: string;
  SELECTED: string;
  HIGHLIGHT: string;
}

interface ColorThemeContextType {
  theme: ColorTheme & {
    PRIMARY_WITH_OPACITY: string;
    BACKGROUND_WITH_OPACITY: string;
  };
  themeState: any;
  isDebugMode: boolean;
  updatePrimaryColor: (color: string) => void;
  updateBackgroundColor: (color: string) => void;
  updateAllColors: (colors: Partial<ColorTheme>) => void;
  updateTextColors: (primaryText: string, secondaryText?: string, mutedText?: string) => void;
  updatePrimaryOpacity: (opacity: number) => void;
  updateBackgroundOpacity: (opacity: number) => void;
  resetTheme: () => void;
  toggleDebugMode: () => void;
  lightenColor: (hex: string, percent: number) => string;
  darkenColor: (hex: string, percent: number) => string;
  hexToRgba: (hex: string, alpha: number) => string;
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined);

export const ColorThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const colorTheme = useColorTheme();

  return (
    <ColorThemeContext.Provider value={colorTheme}>
      {children}
    </ColorThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ColorThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ColorThemeProvider');
  }
  return context;
};