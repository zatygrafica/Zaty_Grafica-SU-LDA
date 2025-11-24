import React, { useState } from 'react';
import { evaluate } from 'mathjs';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { Delete } from 'lucide-react';

const CalculatorButton = ({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={cn(
      'rounded-lg text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors',
      'dark:focus:ring-offset-neutral-900',
      className
    )}
  >
    {children}
  </motion.button>
);

const IntelligentCalculator: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  const handleInput = (value: string) => {
    if (result && !['+', '-', '*', '/', '%'].includes(value)) {
      setExpression(value);
      setResult('');
    } else if (result && ['+', '-', '*', '/', '%'].includes(value)) {
      setExpression(result + value);
      setResult('');
    }
    else {
      setExpression((prev) => prev + value);
    }
  };

  const handleClear = () => {
    setExpression('');
    setResult('');
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
    setResult('');
  };

  const handleCalculate = () => {
    if (!expression) return;
    try {
      // Sanitize expression to prevent security issues, although mathjs is safer than eval
      const sanitizedExpression = expression.replace(/[^-()\d/*+.%]/g, '');
      const evalResult = evaluate(sanitizedExpression);
      setResult(String(evalResult));
    } catch (error) {
      setResult('Erro');
    }
  };

  const buttons = [
    { label: 'C', action: handleClear, className: 'bg-red-500/80 hover:bg-red-500 text-white' },
    { label: <Delete className="mx-auto h-7 w-7" />, action: handleBackspace, className: 'bg-gray-200 dark:bg-neutral-700' },
    { label: '%', action: () => handleInput('%'), className: 'bg-gray-200 dark:bg-neutral-700' },
    { label: '÷', action: () => handleInput('/'), className: 'bg-primary-500/80 hover:bg-primary-500 text-white' },
    { label: '7', action: () => handleInput('7'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '8', action: () => handleInput('8'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '9', action: () => handleInput('9'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '×', action: () => handleInput('*'), className: 'bg-primary-500/80 hover:bg-primary-500 text-white' },
    { label: '4', action: () => handleInput('4'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '5', action: () => handleInput('5'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '6', action: () => handleInput('6'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '−', action: () => handleInput('-'), className: 'bg-primary-500/80 hover:bg-primary-500 text-white' },
    { label: '1', action: () => handleInput('1'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '2', action: () => handleInput('2'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '3', action: () => handleInput('3'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '+', action: () => handleInput('+'), className: 'bg-primary-500/80 hover:bg-primary-500 text-white' },
    { label: '0', action: () => handleInput('0'), className: 'col-span-2 bg-gray-100 dark:bg-neutral-600' },
    { label: '.', action: () => handleInput('.'), className: 'bg-gray-100 dark:bg-neutral-600' },
    { label: '=', action: handleCalculate, className: 'bg-primary-600 hover:bg-primary-700 text-white' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="max-w-xs mx-auto bg-white dark:bg-neutral-900/50 rounded-2xl shadow-2xl p-4 border border-gray-200 dark:border-neutral-800"
    >
      {/* Display */}
      <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4 mb-4 text-right break-all">
        <div className="text-gray-500 dark:text-gray-400 text-xl h-8">{expression.replace(/\//g, '÷').replace(/\*/g, '×') || '0'}</div>
        <div className="text-gray-900 dark:text-white text-4xl font-bold h-12">{result}</div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {buttons.map((btn, index) => (
          <CalculatorButton key={index} onClick={btn.action} className={cn('py-4', btn.className)}>
            {btn.label}
          </CalculatorButton>
        ))}
      </div>
    </motion.div>
  );
};

export default IntelligentCalculator;
