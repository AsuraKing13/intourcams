
import React from 'react';
import Spinner from './Spinner.tsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyle = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-card-bg focus:ring-offset-card-bg-light transition-all duration-150 ease-in-out inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative';
  
  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-brand-green dark:bg-brand-dark-green text-white hover:bg-brand-green-dark dark:hover:bg-brand-dark-green-hover focus:ring-brand-green dark:focus:ring-brand-dark-green disabled:bg-brand-green/50 dark:disabled:bg-brand-dark-green/50';
      break;
    case 'secondary':
      variantStyle = 'bg-neutral-200-light dark:bg-neutral-600-dark text-brand-text-light dark:text-brand-text hover:bg-neutral-300-light dark:hover:bg-neutral-800-dark focus:ring-neutral-400-light dark:focus:ring-brand-dark-green';
      break;
    case 'outline':
      variantStyle = 'border border-brand-green dark:border-brand-dark-green text-brand-green-text dark:text-brand-dark-green-text hover:bg-brand-green dark:hover:bg-brand-dark-green hover:text-white dark:hover:text-white focus:ring-brand-green dark:focus:ring-brand-dark-green';
      break;
    case 'ghost':
      variantStyle = 'text-brand-green-text dark:text-brand-dark-green-text hover:bg-neutral-200-light dark:hover:bg-neutral-700-dark focus:ring-brand-green dark:focus:ring-brand-dark-green';
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyle = 'px-5 py-2.5 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      break;
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      disabled={isLoading || disabled}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-label="Loading">
            <Spinner />
        </span>
      )}
      <span className={`flex items-center justify-center ${isLoading ? 'invisible' : 'visible'}`}>
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </span>
    </button>
  );
};

export default Button;
