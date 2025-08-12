import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, TrendingUp, User, LogIn, MessageCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  currentView: string;
  isLoggedIn: boolean;
  isAdmin?: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, isLoggedIn, isAdmin = false, onLogin, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const baseMenuItems = [
    { id: 'home', label: 'Home', icon: TrendingUp, path: '/' },
    { id: 'plans', label: 'Planos', icon: TrendingUp, path: '/planos' },
    { id: 'results', label: 'Resultados', icon: TrendingUp, path: '/resultados' },
    { id: 'faq', label: 'FAQ', icon: TrendingUp, path: '/faq' },
  ];

  // Add admin menu only for admin users
  const menuItems = isAdmin 
    ? [...baseMenuItems, { id: 'admin', label: 'Admin', icon: TrendingUp, path: '/admin' }]
    : baseMenuItems;

  const handleNavigation = (path: string, requiresLogin: boolean = false) => {
    // Se a rota requer login e o usuário não está logado, abrir modal de login
    if (requiresLogin && !isLoggedIn) {
      onLogin();
      setIsMenuOpen(false);
      return;
    }
    
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img 
              src="https://i.postimg.cc/GhnKd5J5/Chat-GPT-Image-13-de-jul-de-2025-18-07-15.png" 
              alt="Quant Broker Logo" 
             className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-lg shadow-lg"
            />
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
              Quant Broker
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.path, item.id === 'results' || item.id === 'admin')}
                className={`px-2 xl:px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
              className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden lg:inline">WhatsApp</span>
            </button>
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">{user?.user_metadata?.full_name ? `${user.user_metadata.full_name.split(' ')[0]}` : 'Dashboard'}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="px-2 lg:px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm"
                >
                  <span className="hidden lg:inline">Sair</span>
                  <span className="lg:hidden">×</span>
                </button>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden lg:inline">Entrar</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden pb-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleNavigation(item.path, item.id === 'results' || item.id === 'admin');
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm sm:text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-gray-700">
                <button
                  onClick={() => {
                    window.open('https://wa.me/5511975333355', '_blank');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 bg-green-600 text-white rounded-md mb-2 text-sm sm:text-base"
                >
                  📱 WhatsApp
                </button>
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        handleNavigation('/dashboard');
                      }}
                      className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded-md mb-2 text-sm sm:text-base"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        onLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-gray-300 text-sm sm:text-base"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onLogin();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded-md text-sm sm:text-base"
                  >
                    Entrar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;