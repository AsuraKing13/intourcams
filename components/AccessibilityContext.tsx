import React, { createContext, useState, useEffect, useCallback, ReactNode, useContext } from 'react';
import { FontSize, ContrastMode } from '../types.ts';

interface AccessibilityContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  contrastMode: ContrastMode;
  toggleContrastMode: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within an AccessibilityProvider');
  return context;
};

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [contrastMode, setContrastModeState] = useState<ContrastMode>('normal');

  useEffect(() => {
    try {
      const savedFontSize = localStorage.getItem('accessibility-font-size') as FontSize | null;
      if (savedFontSize && ['normal', 'large', 'extra-large'].includes(savedFontSize)) {
        setFontSizeState(savedFontSize);
      }

      const savedContrastMode = localStorage.getItem('accessibility-contrast-mode') as ContrastMode | null;
      if (savedContrastMode && ['normal', 'high'].includes(savedContrastMode)) {
        setContrastModeState(savedContrastMode);
      }
    } catch (error) {
        console.error("Could not access localStorage for accessibility settings.", error);
    }
  }, []);
  
  const applySettings = useCallback(() => {
    const root = document.documentElement;
    // Font size
    root.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
    root.classList.add(`font-size-${fontSize}`);

    // Contrast mode
    if (contrastMode === 'high') {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [fontSize, contrastMode]);

  useEffect(() => {
    applySettings();
  }, [applySettings]);


  const setFontSize = (size: FontSize) => {
    try {
      localStorage.setItem('accessibility-font-size', size);
    } catch (error) {
      console.error("Could not save font size to localStorage.", error);
    }
    setFontSizeState(size);
  };
  
  const toggleContrastMode = () => {
    const newMode = contrastMode === 'normal' ? 'high' : 'normal';
    try {
      localStorage.setItem('accessibility-contrast-mode', newMode);
    } catch (error) {
      console.error("Could not save contrast mode to localStorage.", error);
    }
    setContrastModeState(newMode);
  };
  
  return (
    <AccessibilityContext.Provider value={{ fontSize, setFontSize, contrastMode, toggleContrastMode }}>
      {children}
    </AccessibilityContext.Provider>
  );
};
