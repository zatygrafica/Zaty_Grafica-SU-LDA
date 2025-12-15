import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '../pages/Auth/Login';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfUse from '../pages/TermsOfUse';

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<App />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
