import React from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthMeterProps {
  password?: string;
}

const checkPasswordStrength = (password: string): number => {
  let score = 0;
  if (!password) return 0;

  // Award points for different criteria
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  // Adjust score based on length
  if (password.length < 8) return Math.min(score, 1);
  if (password.length >= 12) score++;

  return Math.min(score - 1, 4); // return a value between 0 and 4
};

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const { t } = useTranslation();
  const strength = checkPasswordStrength(password);

  const strengthLabels: string[] = [
    t('users.password_strength_levels.0'),
    t('users.password_strength_levels.1'),
    t('users.password_strength_levels.2'),
    t('users.password_strength_levels.3'),
    t('users.password_strength_levels.4'),
  ];

  const strengthColors: string[] = [
    'bg-red-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-green-500',
  ];

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {t('users.password_strength')}
        </span>
        {password.length > 0 && (
          <span className="text-xs font-semibold">{strengthLabels[strength]}</span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${strengthColors[strength]}`}
          style={{ width: `${(strength + 1) * 20}%` }}
        ></div>
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
