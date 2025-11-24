import { getDaysInMonth, parse } from 'date-fns';

/**
 * Calculates the salary deduction based on absence or delay.
 * @param salary - The employee's monthly salary.
 * @param dailyWorkHours - The total hours in the employee's workday.
 * @param date - The date of the event.
 * @param type - The type of event ('absence' or 'delay').
 * @param timeValue - The duration of the event (minutes for delay).
 * @returns The calculated deduction amount.
 */
export const calculateSalaryDeduction = (
  salary: number,
  dailyWorkHours: number,
  date: Date,
  type: 'absence' | 'delay',
  timeValue?: number // minutes for delay
): number => {
  if (!salary || salary <= 0) {
    return 0;
  }

  const daysInMonth = getDaysInMonth(date);

  if (type === 'absence') {
    // For a full-day absence, the deduction is one day's worth of salary.
    return salary / daysInMonth;
  }
  
  if (type === 'delay' && dailyWorkHours > 0 && timeValue && timeValue > 0) {
    const monthlyWorkHours = dailyWorkHours * daysInMonth;
    const hourlyRate = salary / monthlyWorkHours;
    const deduction = hourlyRate * (timeValue / 60); // timeValue is in minutes
    return deduction;
  }

  return 0;
};

/**
 * Calculates the difference in minutes between two time strings (HH:mm).
 * @param standardTime - The standard time, e.g., "08:00".
 * @param actualTime - The actual time, e.g., "08:45".
 * @returns The difference in minutes. Returns 0 if times are invalid or actual is not after standard.
 */
export const calculateDelayMinutes = (standardTime: string, actualTime: string): number => {
  try {
    const baseDate = new Date();
    const standardDateTime = parse(standardTime, 'HH:mm', baseDate);
    const actualDateTime = parse(actualTime, 'HH:mm', baseDate);

    if (isNaN(standardDateTime.getTime()) || isNaN(actualDateTime.getTime())) {
      return 0;
    }

    const diffMs = actualDateTime.getTime() - standardDateTime.getTime();
    
    if (diffMs <= 0) {
      return 0;
    }

    return Math.round(diffMs / (1000 * 60));
  } catch (error) {
    console.error("Error calculating delay minutes:", error);
    return 0;
  }
};
