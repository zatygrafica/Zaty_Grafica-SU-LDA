import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Switch = forwardRef<HTMLDivElement, SwitchProps>(({ checked, onChange, disabled = false }, ref) => {
  return (
    <div
      ref={ref}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        'flex w-12 h-7 rounded-full items-center p-1 transition-colors cursor-pointer',
        checked ? 'bg-primary-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 700, damping: 30 }}
        className="w-5 h-5 bg-white rounded-full shadow-md"
      />
    </div>
  );
});

Switch.displayName = 'Switch';

export default Switch;
