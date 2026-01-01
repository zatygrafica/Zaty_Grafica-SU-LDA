import React from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import { ASSETS } from '../../utils/assetPath';

const InitialLoadingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <img src={ASSETS.LOGO} alt="ZATY GRÁFICA Logo" className="h-20 w-auto mb-6" />
      <LoadingSpinner size="md" />
    </div>
  );
};

export default InitialLoadingScreen;
