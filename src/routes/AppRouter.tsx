import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';
import { ProtectedRoute } from './ProtectedRoute';
import LoginPage from '../pages/Auth/Login';

export const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<App />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
