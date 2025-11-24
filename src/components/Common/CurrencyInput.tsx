import React, { useState, useEffect, forwardRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import Input from './Input';
import { LucideIcon } from 'lucide-react';

interface CurrencyInputProps {
  label?: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  icon?: LucideIcon;
  className?: string;
  inputClassName?: string;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(({
  value,
  onChange,
  onBlur,
  label,
  inputClassName,
  ...props
}, ref) => {
  const { settings } = useStore();
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const formatToCurrency = useCallback((val: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: settings.currency || 'MZN',
    }).format(val);
  }, [settings.currency]);

  useEffect(() => {
    if (!isFocused) {
      if (value != null && !isNaN(value)) {
        setDisplayValue(formatToCurrency(value));
      } else {
        setDisplayValue('');
      }
    }
  }, [value, isFocused, formatToCurrency]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value != null ? String(value) : '');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (/^\d*\.?\d*$/.test(rawValue)) {
      setDisplayValue(rawValue);
      const numericValue = parseFloat(rawValue);
      onChange(isNaN(numericValue) ? null : numericValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const numericValue = parseFloat(e.target.value);
    if (numericValue != null && !isNaN(numericValue)) {
      setDisplayValue(formatToCurrency(numericValue));
    } else {
      setDisplayValue('');
      onChange(null);
    }
    onBlur?.(e);
  };

  return (
    <Input
      ref={ref}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      label={label}
      inputClassName={`text-right ${inputClassName || ''}`}
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
