
import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', wrapperClassName = '', id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  
  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-text-secondary-light dark:text-neutral-500-dark">{icon}</div>}
        <input
          id={inputId}
          className={`w-full p-2.5 rounded-lg outline-none transition-colors 
                     bg-input-bg-light dark:bg-input-bg 
                     border border-neutral-300-light dark:border-neutral-600-dark 
                     text-brand-text-light dark:text-brand-text 
                     focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-dark-green 
                     focus:border-brand-green dark:focus:border-brand-dark-green 
                     disabled:opacity-60 disabled:cursor-not-allowed
                     ${icon ? 'pl-10' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;
