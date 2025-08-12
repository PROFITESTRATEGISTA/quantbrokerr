import React, { useState, useEffect } from 'react';
import { Clock, Users, Edit3, Save, X, Plus, Trash2, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WaitlistEntry {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  portfolio_type: string;
  capital_available: string;
  message: string;
  status: string;
  created_at: string;
}

interface PortfolioOffer {
  id: string;
  portfolio_type: string;
  is_available: boolean;
  stripe_link: string;
  button_text: string;
  updated_at: string;
}

const WaitlistPanel: React.FC = () => {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [portfolioOffers, setPortfolioOffers] = useState<PortfolioOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingOffer, setEditingOffer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PortfolioOffer>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchWaitlistEntries(), fetchPortfolioOffers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlistEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWaitlistEntries(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
    }
  };

  const fetchPortfolioOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio_offers')
        .select('*')
        .order('portfolio_type');

      if (error) throw error;
      setPortfolioOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
    }
  };

  const updateWaitlistStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('Status atualizado com sucesso!');
      fetchWaitlistEntries();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteWaitlistEntry = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta entrada?')) return;

    try {
      const { error } = await supabase
        .from('waitlist_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('Entrada excluída com sucesso!');
      fetchWaitlistEntries();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const startEditOffer = (offer: PortfolioOffer) => {
    setEditingOffer(offer.id);
    setEditForm({
      is_available: offer.is_available,
      stripe_link: offer.stripe_link,
      button_text: offer.button_text
    });
  };

  const saveOfferEdit = async () => {
    if (!editingOffer) return;

    try {
      const { error } = await supabase
        .from('portfolio_offers')
        .update(editForm)
        .eq('id', editingOffer);

      if (error) throw error;
      
      setSuccess('Oferta atualizada com sucesso!');
      setEditingOffer(null);
      setEditForm({});
      fetchPortfolioOffers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const cancelEdit = () => {
    setEditingOffer(null);
    setEditForm({});
    setError(null);
    setSuccess(null);
  };

  const getPortfolioDisplayName = (type: string) => {
    const names = {
      'bitcoin': 'Bitcoin',
      'mini-indice': 'Mini Índice',
      'mini-dolar': 'Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return names[type as keyof typeof names] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    const names = {
      'pending': 'Pendente',
      'contacted': 'Contatado',
      'converted': 'Convertido',
      'cancelled': 'Cancelado'
    };
    return names[status as keyof typeof names] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Clock className="h-12 w-12 text-orange-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Fila de Espera</h1>
              <p className="text-gray-600">Controle de inscrições e configuração de ofertas</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Portfolio Offers Configuration */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Configuração de Ofertas</h2>
            <p className="text-sm text-gray-600">Configure se cada portfólio está disponível para venda ou em fila de espera</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfólio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link Stripe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Texto do Botão</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolioOffers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getPortfolioDisplayName(offer.portfolio_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOffer === offer.id ? (
                        <select
                          value={editForm.is_available ? 'available' : 'waitlist'}
                          onChange={(e) => setEditForm({...editForm, is_available: e.target.value === 'available'})}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="available">Disponível</option>
                          <option value="waitlist">Fila de Espera</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          offer.is_available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {offer.is_available ? 'Disponível' : 'Fila de Espera'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingOffer === offer.id ? (
                        <input
                          type="url"
                          value={editForm.stripe_link || ''}
                          onChange={(e) => setEditForm({...editForm, stripe_link: e.target.value})}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          placeholder="https://buy.stripe.com/..."
                        />
                      ) : (
                        <div className="text-sm text-gray-900 max-w-[200px] truncate">
                          {offer.stripe_link ? (
                            <a 
                              href={offer.stripe_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Link Stripe
                            </a>
                          ) : (
                            <span className="text-gray-400">Sem link</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingOffer === offer.id ? (
                        <input
                          type="text"
                          value={editForm.button_text || ''}
                          onChange={(e) => setEditForm({...editForm, button_text: e.target.value})}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          placeholder="Texto do botão"
                        />
                      ) : (
                        <span className="text-sm text-gray-900">{offer.button_text}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingOffer === offer.id ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={saveOfferEdit}
                            className="text-green-600 hover:text-green-800"
                            title="Salvar"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditOffer(offer)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar oferta"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Waitlist Entries */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Fila de Espera</h2>
                <p className="text-sm text-gray-600">
                  {waitlistEntries.length} inscrições na fila de espera
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {waitlistEntries.filter(e => e.status === 'pending').length} pendentes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfólio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {waitlistEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{entry.full_name}</div>
                        <div className="text-sm text-gray-500">{entry.email}</div>
                        <div className="text-sm text-gray-500">{entry.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getPortfolioDisplayName(entry.portfolio_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.capital_available || 'Não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={entry.status}
                        onChange={(e) => updateWaitlistStatus(entry.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(entry.status)}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="contacted">Contatado</option>
                        <option value="converted">Convertido</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`https://wa.me/55${entry.phone.replace(/\D/g, '')}`, '_blank')}
                          className="text-green-600 hover:text-green-800"
                          title="Contatar via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteWaitlistEntry(entry.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir entrada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {waitlistEntries.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma inscrição na fila</h3>
              <p className="text-gray-600">As inscrições na fila de espera aparecerão aqui</p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total na Fila</p>
                <p className="text-2xl font-bold text-blue-600">{waitlistEntries.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {waitlistEntries.filter(e => e.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Convertidos</p>
                <p className="text-2xl font-bold text-green-600">
                  {waitlistEntries.filter(e => e.status === 'converted').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ExternalLink className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa Conversão</p>
                <p className="text-2xl font-bold text-purple-600">
                  {waitlistEntries.length > 0 
                    ? Math.round((waitlistEntries.filter(e => e.status === 'converted').length / waitlistEntries.length) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPanel;