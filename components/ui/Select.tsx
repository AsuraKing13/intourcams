
import React, { useId } from 'react';
import { ChevronDownIcon } from '../../constants.tsx';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
  wrapperClassName?: string;
}

const Select: React.FC<SelectProps> = ({ label, options, className = '', wrapperClassName = '', id, ...props }) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  
  return (
    <div className={`w-full ${wrapperClassName}`}>
      {label && <label htmlFor={selectId} className="block text-sm font-medium text-brand-text-secondary-light dark:text-brand-text-secondary mb-1">{label}</label>}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none p-2.5 pr-8 rounded-lg outline-none transition-colors 
                     bg-input-bg-light dark:bg-input-bg 
                     border border-neutral-300-light dark:border-neutral-600-dark 
                     text-brand-text-light dark:text-brand-text 
                     focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-dark-green 
                     focus:border-brand-green dark:focus:border-brand-dark-green
                     disabled:opacity-60 disabled:cursor-not-allowed
                     ${className}`}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-input-bg-light dark:bg-input-bg text-brand-text-light dark:text-brand-text">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-brand-text-secondary-light dark:text-neutral-500-dark">
          <ChevronDownIcon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default Select;
