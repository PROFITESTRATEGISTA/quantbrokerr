import React, { useState } from 'react';
import { X, Clock, CheckCircle, Mail, Phone, User, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

// RD Station integration
declare global {
  interface Window {
    RdIntegration?: any;
  }
}

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioType: string;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, portfolioType }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [capitalAvailable, setCapitalAvailable] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load RD Station script
  React.useEffect(() => {
    if (!window.RdIntegration) {
      const script = document.createElement('script');
      script.src = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const getPortfolioDisplayName = (type: string) => {
    const names = {
      'bitcoin': 'Portfólio Bitcoin',
      'mini-indice': 'Portfólio Mini Índice',
      'mini-dolar': 'Portfólio Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return names[type as keyof typeof names] || type;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validação básica
      if (!fullName || !email || !phone) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      // Inserir na fila de espera
      const { error: insertError } = await supabase
        .from('waitlist_entries')
        .insert({
          full_name: fullName,
          email: email,
          phone: phone,
          portfolio_type: portfolioType,
          capital_available: capitalAvailable,
          message: message,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Enviar para RD Station
      try {
        if (window.RdIntegration) {
          window.RdIntegration.post({
            token_rdstation: '57e7abbb49395ca58551fe103433f9da',
            identificador: 'fila-espera-portfolio',
            nome: fullName,
            email: email,
            telefone: phone,
            cf_portfolio_interesse: getPortfolioDisplayName(portfolioType),
            cf_capital_disponivel: capitalAvailable,
            cf_mensagem_adicional: message,
            tags: ['fila-espera', 'portfolio-interesse', 'lead-qualificado', portfolioType]
          });
        }
      } catch (rdError) {
        console.warn('RD Station integration error:', rdError);
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('Waitlist error:', error);
      setError(error.message || 'Erro ao entrar na fila de espera');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setCapitalAvailable('');
    setMessage('');
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {success ? 'Inscrição Confirmada!' : 'Fila de Espera'}
            </h2>
            <p className="text-sm text-gray-600">
              {getPortfolioDisplayName(portfolioType)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Você está na fila!
            </h3>
            <p className="text-gray-600 mb-6">
              Sua inscrição para o <strong>{getPortfolioDisplayName(portfolioType)}</strong> foi 
              registrada com sucesso. Nossa equipe entrará em contato em breve.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2">Próximos Passos:</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• Você receberá um email de confirmação</li>
                <li>• Nossa equipe analisará sua solicitação</li>
                <li>• Entraremos em contato via WhatsApp</li>
                <li>• Você será notificado quando houver vagas</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open('https://wa.me/5511911560276', '_blank')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <h4 className="font-semibold text-orange-900">Fila de Espera</h4>
                  <p className="text-orange-800 text-sm">
                    Este portfólio tem vagas limitadas. Inscreva-se para ser notificado quando houver disponibilidade.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                Nome Completo *
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Telefone (WhatsApp) *
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            <div>
              <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-1">
                Capital Disponível
              </label>
              <select
                id="capital"
                value={capitalAvailable}
                onChange={(e) => setCapitalAvailable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Selecione uma faixa</option>
                <option value="R$ 3.000 - R$ 10.000">R$ 3.000 - R$ 10.000</option>
                <option value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</option>
                <option value="R$ 25.000 - R$ 50.000">R$ 25.000 - R$ 50.000</option>
                <option value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</option>
                <option value="R$ 100.000+">R$ 100.000+</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Mensagem Adicional (Opcional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Conte-nos mais sobre seus objetivos ou dúvidas..."
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>Privacidade:</strong> Seus dados serão usados apenas para contato sobre este portfólio. 
                Não compartilhamos informações com terceiros.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Inscrevendo...' : 'Entrar na Fila de Espera'}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Ao se inscrever, você concorda em receber contato da nossa equipe via email e WhatsApp.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WaitlistModal;