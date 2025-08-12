import React from 'react';
import { ExternalLink, BarChart3, TrendingUp, Shield, Settings, BookOpen, Building2, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigateToTutorial?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTutorial }) => {
  const { user, isAdmin } = useAuth();
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found for this user - this is okay
          setUserProfile(null);
        } else {
          throw error;
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasActivePlan = userProfile?.contracted_plan && userProfile.contracted_plan !== 'none';
  const canAccessTridar = hasActivePlan || isAdmin;

  const handleRedirectToResults = () => {
    window.open('https://tridar.log.br/login', '_blank');
  };

  const handleTutorial = () => {
    if (onNavigateToTutorial) {
      onNavigateToTutorial();
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-2 sm:mr-3" />
            <span className="text-sm sm:text-lg font-semibold text-gray-700">Parceria Exclusiva Mosaico BTG</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 px-2">
            Dashboard - Área do Cliente Portfólios de IA Quant Broker
          </h1>
          <h2 className="text-base sm:text-lg lg:text-xl text-gray-600 px-2">
            Configure seu Copy Trade Quant Broker e acompanhe sua performance
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            </div>
            
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Tutorial de Ativação
            </h3>
            
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
              Aprenda como ativar seu Copy Trade Quant Broker no Mosaico BTG + MetaTrader 5 em poucos passos simples.
            </p>

            <button
              onClick={handleTutorial}
              className="inline-flex items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Iniciar Tutorial
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
            </div>
            
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              Dashboard de Resultados
            </h3>
            
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 lg:mb-8 leading-relaxed">
              Acompanhe suas operações, performance e resultados em tempo real através da nossa plataforma especializada.
            </p>

            <button
              onClick={handleRedirectToResults}
              className="inline-flex items-center px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Acessar Dashboard de Resultados</span>
              <span className="sm:hidden">Dashboard Resultados</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Alavancagem Extra
            </h3>
            
            <p className="text-gray-600 mb-8">
              Potencialize seus resultados com alavancagem adicional para maximizar oportunidades de mercado.
            </p>

            <button
              onClick={() => window.open('https://buy.stripe.com/4gw3fPePObfffiU3cP', '_blank')}
              className="inline-flex items-center px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Contratar Alavancagem
            </button>
          </div>

          {/* Tridar Registration Card - Only for active plan members */}
          {canAccessTridar && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-10 w-10 text-cyan-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Cadastro Tridar
              </h3>
              
              <p className="text-gray-600 mb-8">
                Complete seu cadastro na plataforma Tridar para acompanhar seus resultados detalhados e métricas avançadas.
              </p>

              <button
                onClick={() => window.open('https://form.respondi.app/MnbrQZ6E', '_blank')}
                className="inline-flex items-center px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Cadastrar no Tridar
              </button>
              
              <div className="mt-4 text-xs text-gray-500">
                Disponível apenas para membros com plano ativo
              </div>
            </div>
          )}
          {/* Tridar Registration Card - Only for active plan members */}
          {hasActivePlan && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-10 w-10 text-cyan-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Cadastro Tridar
              </h3>
              
              <p className="text-gray-600 mb-8">
                Complete seu cadastro na plataforma Tridar para acompanhar seus resultados detalhados e métricas avançadas.
              </p>

              <button
                onClick={() => window.open('https://form.respondi.app/MnbrQZ6E', '_blank')}
                className="inline-flex items-center px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Cadastrar no Tridar
              </button>
              
              <div className="mt-4 text-xs text-gray-500">
                Disponível apenas para membros com plano ativo
              </div>
            </div>
          )}
          {/* Tridar Registration Card - Only for active plan members */}
          {hasActivePlan && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-10 w-10 text-cyan-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Cadastro Tridar
              </h3>
              
              <p className="text-gray-600 mb-8">
                Complete seu cadastro na plataforma Tridar para acompanhar seus resultados detalhados e métricas avançadas.
              </p>

              <button
                onClick={() => window.open('https://form.respondi.app/MnbrQZ6E', '_blank')}
                className="inline-flex items-center px-8 py-4 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Cadastrar no Tridar
              </button>
              
              <div className="mt-4 text-xs text-gray-500">
                Disponível apenas para membros com plano ativo
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Recursos Disponíveis</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl text-center sm:text-left">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto sm:mx-0 mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Performance</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Acompanhe seus resultados e métricas de performance</p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl text-center sm:text-left">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto sm:mx-0 mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Controle de Risco</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Monitore o gerenciamento de risco automatizado</p>
            </div>
            
            <div className="bg-gray-50 p-4 sm:p-6 rounded-xl text-center sm:text-left">
              <Settings className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto sm:mx-0 mb-2 sm:mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Configurações</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Ajuste suas preferências e parâmetros</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;