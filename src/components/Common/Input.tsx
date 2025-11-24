import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'date' | 'time';
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  className?: string;
  inputClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  iconPosition = 'left',
  className,
  inputClassName,
  ...props
}, ref) => {
  const inputClasses = clsx(
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm',
    'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    'dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-gray-500',
    'dark:focus:border-primary-400 dark:focus:ring-primary-400',
    'dark:disabled:bg-neutral-800',
    {
      'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600': error,
      'pl-10': Icon && iconPosition === 'left',
      'pr-10': Icon && iconPosition === 'right',
      'dark:[color-scheme:dark]': type === 'date' || type === 'time',
    },
    inputClassName
  );

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className={clsx(
            'absolute inset-y-0 flex items-center pointer-events-none',
            iconPosition === 'left' ? 'left-0 pl-3' : 'right-0 pr-3'
          )}>
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
