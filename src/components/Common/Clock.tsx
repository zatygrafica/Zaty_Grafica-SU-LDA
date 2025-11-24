import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const timeZone = 'Africa/Maputo';

  const formattedTime = time.toLocaleTimeString('pt-PT', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'full',
    timeZone,
  }).format(time);

  return (
    <div className="text-center">
      <div className="font-semibold text-gray-800 dark:text-gray-200 text-lg tracking-wider">
        {formattedTime}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
        {formattedDate}
      </div>
    </div>
  );
};

export default Clock;
