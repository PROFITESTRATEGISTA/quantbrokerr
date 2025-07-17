import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load components to improve performance
const HomePage = React.lazy(() => import('../pages/HomePage'));
const PlanosPage = React.lazy(() => import('../pages/PlanosPage'));
const ResultadosPage = React.lazy(() => import('../pages/ResultadosPage'));
const FAQPage = React.lazy(() => import('../pages/FAQPage'));
const AdminPage = React.lazy(() => import('../pages/AdminPage'));
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const TutorialPage = React.lazy(() => import('../pages/TutorialPage'));

const Router: React.FC = () => {
  const { isLoggedIn, isAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/planos" element={<PlanosPage />} />
          <Route path="/faq" element={<FAQPage />} />
          
          {/* Protected Routes */}
          <Route 
            path="/resultados" 
            element={
              isLoggedIn ? <ResultadosPage /> : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              isLoggedIn ? <DashboardPage /> : <Navigate to="/" replace />
            } 
          />
          <Route 
            path="/tutorial" 
            element={
              isLoggedIn ? <TutorialPage /> : <Navigate to="/" replace />
            } 
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              isAdmin ? <AdminPage /> : <Navigate to="/" replace />
            } 
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;