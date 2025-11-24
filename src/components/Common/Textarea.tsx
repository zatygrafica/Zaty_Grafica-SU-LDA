import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  rows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  className,
  rows = 3,
  ...props
}, ref) => {
  const textareaClasses = clsx(
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm',
    'focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
    'dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-gray-500',
    'dark:focus:border-primary-400 dark:focus:ring-primary-400',
    'dark:disabled:bg-neutral-800',
    {
      'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600': error,
    }
  );

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
