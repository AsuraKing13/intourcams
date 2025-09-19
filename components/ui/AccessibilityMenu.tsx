import React from 'react';
import { useAccessibility } from '../AccessibilityContext.tsx';
import { FontSize } from '../../types.ts';
import Button from './Button.tsx';

interface AccessibilityMenuProps {
  onClose: () => void;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ onClose }) => {
  const { fontSize, setFontSize, contrastMode, toggleContrastMode } = useAccessibility();

  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
  };
  
  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-card-bg-light dark:bg-card-bg rounded-lg shadow-xl border border-neutral-300-light dark:border-neutral-700-dark z-50 animate-modalShow origin-top-right p-4 space-y-4">
        <div>
            <h4 className="font-semibold text-brand-text-light dark:text-brand-text mb-2">Font Size</h4>
            <div className="flex justify-between gap-2">
                <Button size="sm" variant={fontSize === 'normal' ? 'primary' : 'secondary'} onClick={() => handleFontSizeChange('normal')} className="flex-1">A</Button>
                <Button size="sm" variant={fontSize === 'large' ? 'primary' : 'secondary'} onClick={() => handleFontSizeChange('large')} className="flex-1 text-lg">A</Button>
                <Button size="sm" variant={fontSize === 'extra-large' ? 'primary' : 'secondary'} onClick={() => handleFontSizeChange('extra-large')} className="flex-1 text-xl">A</Button>
            </div>
        </div>
        <div>
            <h4 className="font-semibold text-brand-text-light dark:text-brand-text mb-2">Contrast</h4>
            <div className="flex items-center justify-between p-2 bg-neutral-100-light dark:bg-neutral-800-dark rounded-lg">
                <label htmlFor="contrast-toggle-switch" className="text-sm font-medium text-brand-text-light dark:text-brand-text cursor-pointer">
                    High Contrast Mode
                </label>
                <label htmlFor="contrast-toggle-switch" className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        id="contrast-toggle-switch"
                        className="sr-only peer"
                        checked={contrastMode === 'high'}
                        onChange={toggleContrastMode}
                    />
                    <div className="w-11 h-6 bg-neutral-300-light peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-green/50 rounded-full peer dark:bg-neutral-700-dark peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand-green"></div>
                </label>
            </div>
        </div>
    </div>
  );
};

export default AccessibilityMenu;
