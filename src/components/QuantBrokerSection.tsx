import React, { useState } from 'react';
import { Bot, Brain, Zap, Target, TrendingUp, Shield, BarChart3, Cpu, Database, Eye, Calendar, MessageCircle } from 'lucide-react';

const QuantBrokerSection: React.FC = () => {
  const technologies = [
    {
      icon: Brain,
      title: 'IA de Previsão de Mercado',
      description: 'Algoritmos de machine learning que analisam padrões históricos e preveem movimentos futuros com precisão institucional',
      image: 'https://i.postimg.cc/cJsZXTY2/conceito-de-transformacao-digital-de-fundo-de-cerebro-de-tecnologia-de-ia.jpg'
    },
    {
      icon: Zap,
      title: 'Execução Ultra-Rápida',
      description: 'Tecnologia proprietária de execução em milissegundos com spreads reduzidos e ordens a mercado via BTG Pactual',
      description: 'Tecnologia proprietária de execução em milissegundos com spreads reduzidos e ordens a mercado via Mosaico BTG',
      image: 'https://i.postimg.cc/m2X60w0K/technology-7994887-1280.jpg'
    },
    {
      icon: Database,
      title: 'Análise de Big Data',
      description: 'Processamento de milhões de dados em tempo real para identificar oportunidades invisíveis ao olho humano',
      image: 'https://i.postimg.cc/DZRwjL7G/pessoa-no-escritorio-analisando-e-verificando-graficos-financeiros.jpg'
    }
  ];

  const strategies = [
    {
      icon: Target,
      title: '30+ Estratégias Próprias',
      description: 'Portfólio diversificado de estratégias quantitativas desenvolvidas internamente',
      stats: '30+ estratégias ativas'
    },
    {
      icon: Shield,
      title: 'Stop Curto & Alto Retorno',
      description: 'Anos de experiência em operações de alto risco-retorno com gestão rigorosa',
      stats: '+5 anos experiência'
    },
    {
      icon: BarChart3,
      title: 'Operação Simultânea',
      description: 'Todos os ativos operados simultaneamente para maximizar oportunidades',
      stats: 'Múltiplos ativos'
    }
  ];

  const differentials = [
    {
      icon: Cpu,
      title: 'Tecnologia Única',
      description: 'Desenvolvemos nossa própria stack tecnológica, desde algoritmos de IA até sistemas de execução, garantindo vantagem competitiva exclusiva.',
      highlight: 'Propriedade Intelectual'
    },
    {
      icon: Eye,
      title: 'Busca pela Perfeição',
      description: 'Obsessão por otimização contínua. Cada algoritmo é refinado constantemente para maximizar performance e minimizar riscos.',
      highlight: 'Melhoria Contínua'
    },
    {
      icon: Bot,
      title: 'Robôs Traders Avançados',
      description: 'Sistemas autônomos que operam 24/7 sem interferência emocional, tomando decisões baseadas puramente em dados e probabilidades.',
      highlight: 'Automação Total'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
            <Bot className="h-4 w-4 mr-2" />
            Tecnologia Proprietária de Última Geração
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Quem é a 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Quant Broker</span>
          </h2>
          <h3 className="text-xl text-gray-600 max-w-4xl mx-auto">
            Pioneiros em tecnologia de trading automatizado com IA, desenvolvemos soluções proprietárias 
            que combinam análise de dados avançada, previsão de mercado e execução ultra-rápida
          </h3>
        </div>

        {/* Technology Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {technologies.map((tech, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img 
                src={tech.image} 
                alt={tech.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <tech.icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{tech.title}</h4>
                <p className="text-gray-600 leading-relaxed">{tech.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Competitive Differentials */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Diferenciais Competitivos</h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              O que nos torna únicos no mercado de trading automatizado
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {differentials.map((diff, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow border border-gray-100">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <diff.icon className="h-10 w-10 text-white" />
                </div>
                <div className="mb-4">
                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                    {diff.highlight}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{diff.title}</h4>
                <p className="text-gray-600 leading-relaxed">{diff.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call-to-Action Section */}
        <ConsultationFormSection />

      </div>
    </div>
  );
};

const ConsultationFormSection: React.FC = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    preferred_time: '',
    consultation_type: 'results',
    capital_available: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const consultationTypes = [
    {
      value: 'results',
      label: 'Conhecer Resultados',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      value: 'strategy',
      label: 'Estratégias Personalizadas',
      icon: Target,
      color: 'purple'
    },
    {
      value: 'demo',
      label: 'Demonstração ao Vivo',
      icon: Eye,
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
      if (!formData.full_name || !formData.email || !formData.phone || !formData.preferred_time) {
        throw new Error('Todos os campos obrigatórios devem ser preenchidos');
      }

      // Here you would integrate with your backend
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao agendar consultoria');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mt-16">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h3 className="text-3xl font-bold mb-4">
            Reunião Agendada com Sucesso!
          </h3>
          <p className="text-xl mb-6 text-green-100">
            Nossa equipe entrará em contato em breve para confirmar o horário
          </p>
          <button
            onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
            className="px-8 py-4 bg-white text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center mx-auto"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            WhatsApp Direto
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold mb-4">
            Quer Conhecer os Resultados no Detalhe?
          </h3>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Agende uma reunião gratuita com nosso Consultor Quant
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-6">
            {error && (
              <div className="bg-red-500/20 border border-red-400/50 text-red-100 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Tipo de Consultoria */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Tipo de Consultoria *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {consultationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({...formData, consultation_type: type.value})}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      formData.consultation_type === type.value
                        ? 'border-white bg-white/20 text-white'
                        : 'border-white/30 hover:border-white/60 hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                        <type.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="font-semibold">{type.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Telefone (WhatsApp) *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>

              {/* Horário */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Horário Preferido *
                </label>
                <select
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors"
                  required
                >
                  <option value="" className="text-gray-900">Selecione um horário</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot} className="text-gray-900">{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capital Disponível */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Capital Disponível para Investimento
              </label>
              <select
                value={formData.capital_available}
                onChange={(e) => setFormData({...formData, capital_available: e.target.value})}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors"
              >
                <option value="" className="text-gray-900">Selecione uma faixa</option>
                <option value="R$ 3.000 - R$ 10.000" className="text-gray-900">R$ 3.000 - R$ 10.000</option>
                <option value="R$ 10.000 - R$ 25.000" className="text-gray-900">R$ 10.000 - R$ 25.000</option>
                <option value="R$ 25.000 - R$ 50.000" className="text-gray-900">R$ 25.000 - R$ 50.000</option>
                <option value="R$ 50.000 - R$ 100.000" className="text-gray-900">R$ 50.000 - R$ 100.000</option>
                <option value="R$ 100.000+" className="text-gray-900">R$ 100.000+</option>
              </select>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Mensagem Adicional (Opcional)
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-colors resize-none"
                placeholder="Conte-nos mais sobre seus objetivos..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className="group px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-5 w-5" />
                    Agendar Reunião Gratuita
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
                className="group px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all flex items-center justify-center"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Direto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default QuantBrokerSection;