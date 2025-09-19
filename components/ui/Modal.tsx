
import React, { useEffect, useRef, useCallback } from 'react';
import { XMarkIcon } from '../../constants.tsx';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const handleFocusTrap = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'
    );
    if (focusableElements.length === 0) return; // No focusable elements, do nothing
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) { // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else { // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }, []);
  
  // Effect for adding/removing event listeners
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleFocusTrap);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleFocusTrap);
    };
  }, [isOpen, handleKeyDown, handleFocusTrap]);

  // Separate effect for setting initial focus, only runs when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use a timeout to ensure elements are rendered and focusable, especially with animations
      const timer = setTimeout(() => {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])'
        );
        // Focus the first element (often the close button) as a default, good for accessibility.
        focusableElements?.[0]?.focus();
      }, 100); // 100ms is a safe delay

      return () => clearTimeout(timer);
    }
  }, [isOpen]); // <-- This now ONLY depends on `isOpen`

  if (!isOpen) return null;

  let sizeClasses = 'max-w-md';
  if (size === 'sm') sizeClasses = 'max-w-sm';
  if (size === 'lg') sizeClasses = 'max-w-lg';
  if (size === 'xl') sizeClasses = 'max-w-xl';
  if (size === '2xl') sizeClasses = 'max-w-2xl';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className={`rounded-lg shadow-xl w-full ${sizeClasses} 
                   bg-card-bg-light dark:bg-card-bg
                   border border-neutral-300-light dark:border-neutral-700-dark 
                   transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalShow
                   flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex items-center justify-between p-4 border-b border-neutral-200-light dark:border-neutral-600-dark flex-shrink-0">
          <h3 id="modal-title" className="text-xl font-semibold text-brand-green-text dark:text-brand-dark-green-text">{title}</h3>
          <button 
            onClick={onClose} 
            className="text-brand-text-secondary-light dark:text-brand-text-secondary hover:text-brand-green-text dark:hover:text-brand-dark-green-text p-1 rounded-full hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;