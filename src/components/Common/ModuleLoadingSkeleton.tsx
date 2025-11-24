import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const ModuleLoadingSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <LoadingSpinner size="lg" />
    </div>
  );
};

export default ModuleLoadingSkeleton;
