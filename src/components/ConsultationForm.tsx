import React, { useState } from 'react';
import { X, Calendar, User, Mail, Phone, MessageCircle, Clock, CheckCircle, Video, Users, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

// RD Station integration
declare global {
  interface Window {
    RdIntegration?: any;
  }
}

interface ConsultationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultationForm: React.FC<ConsultationFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    preferred_time: '',
    consultation_type: 'results',
    message: '',
    capital_available: ''
  });
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

  const consultationTypes = [
    {
      value: 'results',
      label: 'Conhecer Resultados Detalhados',
      description: 'Análise completa de performance e métricas',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      value: 'strategy',
      label: 'Estratégias Personalizadas',
      description: 'Consultoria para seu perfil específico',
      icon: Users,
      color: 'purple'
    },
    {
      value: 'demo',
      label: 'Demonstração ao Vivo',
      description: 'Veja o sistema funcionando em tempo real',
      icon: Video,
      color: 'green'
    }
  ];

  const timeSlots = [
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validação básica
      if (!formData.full_name || !formData.email || !formData.phone || !formData.preferred_time) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      // Inserir na tabela de formulários de consultoria
      const { error: insertError } = await supabase
        .from('consultation_forms')
        .insert({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          preferred_time: formData.preferred_time,
          consultation_type: formData.consultation_type,
          capital_available: formData.capital_available,
          message: formData.message,
          status: 'pending'
        });

      if (insertError) throw insertError;

      // Enviar para RD Station
      try {
        if (window.RdIntegration) {
          const consultationType = consultationTypes.find(t => t.value === formData.consultation_type);
          
          window.RdIntegration.post({
            token_rdstation: '57e7abbb49395ca58551fe103433f9da',
            identificador: 'agendamento-consultoria',
            nome: formData.full_name,
            email: formData.email,
            telefone: formData.phone,
            cf_horario_preferido: formData.preferred_time,
            cf_tipo_consultoria: consultationType?.label,
            cf_capital_disponivel: formData.capital_available,
            cf_mensagem_adicional: formData.message,
            tags: ['agendamento', 'consultoria', 'lead-qualificado', 'reuniao-consultor']
          });
        }
      } catch (rdError) {
        console.warn('RD Station integration error:', rdError);
      }

      setSuccess(true);
    } catch (error: any) {
      console.error('Consultation form error:', error);
      setError(error.message || 'Erro ao agendar consultoria');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      preferred_time: '',
      consultation_type: 'results',
      message: '',
      capital_available: ''
    });
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Reunião Agendada com Sucesso!
            </h3>
            <p className="text-gray-600 mb-6">
              Recebemos sua solicitação de consultoria. Nossa equipe entrará em contato em breve 
              para confirmar o horário e enviar o link da reunião.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="font-semibold text-blue-900 mb-3">Próximos Passos:</h4>
              <ul className="text-sm text-blue-800 text-left space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                  Confirmação por email em até 2 horas
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                  Link da reunião via WhatsApp
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                  Análise personalizada dos resultados
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                  Recomendações específicas para seu perfil
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp Direto
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Agendar Reunião com Consultor Quant
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Conheça os resultados no detalhe com nossa equipe especializada
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Tipo de Consultoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Consultoria *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {consultationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({...formData, consultation_type: type.value})}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${
                        formData.consultation_type === type.value
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                          type.color === 'blue' ? 'bg-blue-100' :
                          type.color === 'purple' ? 'bg-purple-100' : 'bg-green-100'
                        }`}>
                          <type.icon className={`h-5 w-5 ${
                            type.color === 'blue' ? 'text-blue-600' :
                            type.color === 'purple' ? 'text-purple-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                        {formData.consultation_type === type.value && (
                          <CheckCircle className="h-5 w-5 text-blue-500 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                {/* Horário Preferido */}
                <div>
                  <label htmlFor="preferred_time" className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Horário Preferido *
                  </label>
                  <select
                    id="preferred_time"
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Selecione um horário</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Capital Disponível */}
              <div>
                <label htmlFor="capital" className="block text-sm font-medium text-gray-700 mb-2">
                  Capital Disponível para Investimento
                </label>
                <select
                  id="capital"
                  value={formData.capital_available}
                  onChange={(e) => setFormData({...formData, capital_available: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Selecione uma faixa</option>
                  <option value="R$ 3.000 - R$ 10.000">R$ 3.000 - R$ 10.000</option>
                  <option value="R$ 10.000 - R$ 25.000">R$ 10.000 - R$ 25.000</option>
                  <option value="R$ 25.000 - R$ 50.000">R$ 25.000 - R$ 50.000</option>
                  <option value="R$ 50.000 - R$ 100.000">R$ 50.000 - R$ 100.000</option>
                  <option value="R$ 100.000+">R$ 100.000+</option>
                </select>
              </div>

              {/* Mensagem */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem Adicional (Opcional)
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Conte-nos mais sobre seus objetivos ou dúvidas específicas..."
                />
              </div>

              {/* Benefícios da Consultoria */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  O que você receberá na consultoria:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Análise detalhada de resultados
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Estratégias personalizadas
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Demonstração ao vivo
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Recomendações específicas
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  <strong>Privacidade:</strong> Seus dados serão usados apenas para agendamento da consultoria. 
                  Não compartilhamos informações com terceiros.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Agendando Reunião...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Agendar Reunião Gratuita
                  </div>
                )}
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Ao agendar, você concorda em receber contato da nossa equipe via email e WhatsApp.
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ConsultationForm;