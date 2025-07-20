import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FloatingActions from './FloatingActions';
import LoginModal from './LoginModal';
import PortfolioQuestionnaire from './PortfolioQuestionnaire';
import LocalSEO from './LocalSEO';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isLoggedIn, isAdmin, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [recommendedPlan, setRecommendedPlan] = useState<string | null>(null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null);

  const getCurrentView = () => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path === '/planos') return 'plans';
    if (path === '/resultados') return 'results';
    if (path === '/faq') return 'faq';
    if (path === '/admin') return 'admin';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/tutorial') return 'tutorial';
    return 'home';
  };

  const handleLogin = () => {
    setIsLoginModalOpen(false);
    
    // Redirect after login if specified
    if (redirectAfterLogin) {
      window.location.href = redirectAfterLogin;
      setRedirectAfterLogin(null);
    }
  };

  const handleOpenLoginForResults = () => {
    setRedirectAfterLogin('/resultados');
    setIsLoginModalOpen(true);
  };

  const handleQuestionnaireComplete = (recommendation: string) => {
    setRecommendedPlan('portfolio-completo');
    setIsQuestionnaireOpen(false);
    // Navigate to plans page
    window.location.href = '/planos';
  };

  return (
    <div className="min-h-screen bg-white">
      <LocalSEO />
      <Header
        currentView={getCurrentView()}
        isLoggedIn={isLoggedIn}
        isAdmin={isAdmin}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={logout}
      />
      
      <main>
        {children}
      </main>
      
      <Footer />
      
      <FloatingActions 
        onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
        onNavigateToPlans={() => window.location.href = '/planos'}
        onOpenLogin={handleOpenLoginForResults}
      />
      
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      
      {isQuestionnaireOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <PortfolioQuestionnaire
            onComplete={handleQuestionnaireComplete}
            onClose={() => setIsQuestionnaireOpen(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Layout;