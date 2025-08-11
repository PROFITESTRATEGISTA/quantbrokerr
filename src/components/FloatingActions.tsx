import React, { useState } from 'react';
import { MessageCircle, Calendar, X, Zap, Bell, HelpCircle } from 'lucide-react';

interface FloatingActionsProps {
  onOpenQuestionnaire: () => void;
  onNavigateToPlans: () => void;
  onOpenLogin?: () => void;
}

const FloatingActions: React.FC<FloatingActionsProps> = ({ onOpenQuestionnaire, onNavigateToPlans, onOpenLogin }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleScheduleMeeting = () => {
    console.log('🔐 Botão de Login clicado!');
    if (onOpenLogin) {
      onOpenLogin();
      setIsExpanded(false);
    } else {
      console.error('❌ onOpenLogin não está definido!');
    }
  };

  const handleQuestionnaireClick = () => {
    onOpenQuestionnaire();
    setIsExpanded(false);
  };

  const handlePlansClick = () => {
    onNavigateToPlans();
    setIsExpanded(false);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Call-to-action text bubble */}
      {!isExpanded && (
        <div className="absolute bottom-16 right-0 mb-2 mr-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse w-64">
          <div className="text-sm font-medium text-center">
            Agende uma reunião e conheça os resultados no detalhe agora!
          </div>
          {/* Arrow pointing to button */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-600"></div>
        </div>
      )}
      
      {/* Notification Badge */}
      {!isExpanded && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse z-10">
          <Bell className="h-3 w-3 text-white" />
        </div>
      )}
      
      {/* Expanded Actions */}
      {isExpanded && (
        <div className="mb-4 space-y-3">
          <button
            onClick={handleQuestionnaireClick}
            className="flex items-center px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap"
          >
            <HelpCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Qual Portfólio é Ideal?</span>
          </button>
          
          <button
            onClick={handlePlansClick}
            className="flex items-center px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap"
          >
            <Zap className="h-5 w-5 mr-2" />
            <span className="font-medium">Ver Todos os Planos</span>
          </button>
          
          <button
            onClick={handleScheduleMeeting}
            className="flex items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap"
          >
            <Calendar className="h-5 w-5 mr-2" />
            <span className="font-medium">Conhecer Resultados</span>
          </button>
          
          <button
            onClick={() => {
              console.log('📱 Botão WhatsApp clicado!');
              window.open('https://wa.me/5511975333355?text=Olá%2C%20quero%20conhecer%20mais%20sobre%20os%20Portfólios%20de%20IA%20Quant%20Broker.%20Pode%20me%20orientar%20no%20processo%3F', '_blank');
            }}
            className="flex items-center px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all whitespace-nowrap"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">Falar com Consultor Quant</span>
          </button>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={toggleExpanded}
        className={`w-14 h-14 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all flex items-center justify-center ${
          isExpanded 
            ? 'bg-gray-600 text-white' 
            : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white animate-pulse'
        }`}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>

      {/* Pulsing indicator when collapsed */}
      {!isExpanded && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 animate-ping opacity-30 pointer-events-none"></div>
      )}
    </div>
  );
};

export default FloatingActions;