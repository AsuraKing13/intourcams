import React from 'react';
import { useToastContext } from '../ToastContext.tsx';
import { XMarkIcon } from '../../constants.tsx';

// Individual Toast component
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onDismiss: () => void }> = ({ message, type, onDismiss }) => {
  const baseStyle = 'flex items-center w-full max-w-xs p-4 space-x-4 rounded-lg shadow-xl text-white';
  let typeStyle = '';

  // Tailwind CSS classes for different toast types
  switch (type) {
    case 'success':
      typeStyle = 'bg-green-500 dark:bg-green-600';
      break;
    case 'error':
      typeStyle = 'bg-red-500 dark:bg-red-600';
      break;
    case 'info':
    default:
      typeStyle = 'bg-brand-blue dark:bg-brand-blue-dark';
      break;
  }

  return (
    <div className={`${baseStyle} ${typeStyle} animate-modalShow`} role="alert" aria-live="assertive">
      <div className="text-sm font-semibold flex-grow">{message}</div>
      <button 
        type="button" 
        className="inline-flex items-center justify-center h-8 w-8 -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-white/50 p-1.5 hover:bg-white/20 transition-colors" 
        onClick={onDismiss} 
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

// Container for all toasts
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastContext();

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="fixed top-20 right-5 z-[9999] space-y-3">
      {toasts.map(({ id, message, type }) => (
        <Toast key={id} message={message} type={type} onDismiss={() => removeToast(id)} />
      ))}
    </div>
  );
};