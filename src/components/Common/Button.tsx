import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className,
  title,
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-[transform,opacity] duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden transform hover:scale-105 active:scale-95';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg focus:ring-primary-500 dark:bg-primary-600/80 dark:hover:bg-primary-600/90 dark:backdrop-blur-sm dark:border dark:border-primary-500/50',
    secondary: 'bg-white dark:bg-neutral-800/70 dark:backdrop-blur-sm border border-gray-200 dark:border-white/20 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-neutral-700/80 focus:ring-gray-500 dark:focus:ring-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg focus:ring-red-500 dark:bg-red-600/80 dark:hover:bg-red-600/90 dark:backdrop-blur-sm dark:border dark:border-red-500/50',
    ghost: 'hover:bg-gray-500/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className,
        'group'
      )}
      title={title}
    >
      {/* Glow effect - removed for ghost variant */}
      {variant !== 'ghost' && (
        <span className="absolute top-0 left-0 w-full h-full bg-white/30 dark:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow" />
      )}
      
      <span className="relative z-10 flex items-center">
        {loading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className={clsx('w-4 h-4', children && 'mr-2')} />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
              <Icon className={clsx('w-4 h-4', children && 'ml-2')} />
            )}
          </>
        )}
      </span>
    </button>
  );
};

export default Button;
