import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from '../App';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '../pages/Auth/Login';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfUse from '../pages/TermsOfUse';

const RouteLogger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    console.log('[AppRouter] Navigated to:', location.pathname);
  }, [location]);

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  console.log('[AppRouter] Rendering AppRouter');

  return (
    <BrowserRouter>
      <RouteLogger>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<App />} />
          </Route>
        </Routes>
      </RouteLogger>
    </BrowserRouter>
  );
};
