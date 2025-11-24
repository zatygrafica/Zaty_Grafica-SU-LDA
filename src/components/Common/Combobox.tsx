import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { clsx } from 'clsx';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(({
  label,
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = query === ''
    ? options
    : options.filter(option =>
        option.label.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className={clsx('space-y-1', className)} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          ref={ref}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'relative w-full cursor-default rounded-lg border bg-white py-2 pl-3 pr-10 text-left text-sm shadow-sm',
            'focus:outline-none focus:ring-1',
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-700',
            'dark:bg-neutral-900 dark:text-white',
            disabled && 'cursor-not-allowed bg-gray-50 text-gray-500 dark:bg-neutral-800'
          )}
        >
          <span className="block truncate">
            {selectedOption ? selectedOption.label : <span className="text-gray-400 dark:text-gray-500">{placeholder || 'Selecione...'}</span>}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-neutral-900 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            <div className="p-2">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white dark:bg-neutral-800 dark:border-neutral-700 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Pesquisar..."
                  autoFocus
                />
              </div>
            </div>
            {filteredOptions.length === 0 && query !== '' ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                Nenhum resultado.
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={clsx(
                    'relative cursor-pointer select-none py-2 px-4 text-gray-900 dark:text-gray-100',
                    'hover:bg-primary-100 dark:hover:bg-neutral-700'
                  )}
                >
                  {option.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
});

Combobox.displayName = 'Combobox';

export default Combobox;
