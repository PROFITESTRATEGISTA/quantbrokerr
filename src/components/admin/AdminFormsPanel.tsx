import React, { useState, useEffect } from 'react';
import { Calendar, MessageCircle, AlertCircle, CheckCircle, User, Mail, Phone, Clock, Edit3, Save, X, Trash2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ConsultationForm {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_time: string;
  consultation_type: string;
  capital_available: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const AdminFormsPanel: React.FC = () => {
  const [forms, setForms] = useState<ConsultationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ConsultationForm>>({});
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = (form: ConsultationForm) => {
    setEditingForm(form.id);
    setEditForm({
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      preferred_time: form.preferred_time,
      consultation_type: form.consultation_type,
      capital_available: form.capital_available,
      message: form.message,
      status: form.status
    });
  };

  const handleSaveEdit = async () => {
    if (!editingForm) return;

    try {
      setError(null);

      const { error } = await supabase
        .from('consultation_forms')
        .update(editForm)
        .eq('id', editingForm);

      if (error) throw error;

      setSuccess('Formulário atualizado com sucesso!');
      setEditingForm(null);
      setEditForm({});
      fetchForms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return;

    try {
      const { error } = await supabase
        .from('consultation_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Formulário excluído com sucesso!');
      fetchForms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultation_forms')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSuccess('Status atualizado com sucesso!');
      fetchForms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    const names = {
      'pending': 'Pendente',
      'contacted': 'Contatado',
      'scheduled': 'Agendado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return names[status as keyof typeof names] || status;
  };

  const getConsultationTypeDisplayName = (type: string) => {
    const types = {
      'results': 'Conhecer Resultados',
      'strategy': 'Estratégias Personalizadas',
      'demo': 'Demonstração ao Vivo'
    };
    return types[type as keyof typeof types] || type;
  };

  // Apply filters
  const filteredForms = forms.filter(form => {
    const matchesStatus = filterStatus === 'all' || form.status === filterStatus;
    const matchesSearch = !searchTerm || 
      form.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      form.phone.includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  // Calculate metrics
  const totalForms = forms.length;
  const pendingForms = forms.filter(f => f.status === 'pending').length;
  const scheduledForms = forms.filter(f => f.status === 'scheduled').length;
  const completedForms = forms.filter(f => f.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Formulários de Consultoria</h2>
            <p className="text-gray-600">Gerencie solicitações de consultoria e reuniões</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Formulários</p>
              <p className="text-2xl font-bold text-purple-600">{totalForms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingForms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendados</p>
              <p className="text-2xl font-bold text-blue-600">{scheduledForms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">{completedForms}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Buscar por nome, email ou telefone..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="contacted">Contatado</option>
              <option value="scheduled">Agendado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Formulários ({filteredForms.length} de {totalForms})
          </h3>
          <p className="text-sm text-gray-600">
            Solicitações de consultoria e reuniões
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo/Horário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredForms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {editingForm === form.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.full_name || ''}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="w-full text-sm font-medium border border-gray-300 rounded px-2 py-1"
                          placeholder="Nome completo"
                        />
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          placeholder="Email"
                        />
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          placeholder="Telefone"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {form.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{form.full_name}</div>
                          <div className="text-sm text-gray-500">{form.email}</div>
                          <div className="text-sm text-gray-500">{form.phone}</div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingForm === form.id ? (
                      <div className="space-y-2">
                        <select
                          value={editForm.consultation_type || ''}
                          onChange={(e) => setEditForm({...editForm, consultation_type: e.target.value})}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="results">Conhecer Resultados</option>
                          <option value="strategy">Estratégias Personalizadas</option>
                          <option value="demo">Demonstração ao Vivo</option>
                        </select>
                        <input
                          type="text"
                          value={editForm.preferred_time || ''}
                          onChange={(e) => setEditForm({...editForm, preferred_time: e.target.value})}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          placeholder="Horário preferido"
                        />
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getConsultationTypeDisplayName(form.consultation_type)}
                        </div>
                        <div className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {form.preferred_time}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingForm === form.id ? (
                      <input
                        type="text"
                        value={editForm.capital_available || ''}
                        onChange={(e) => setEditForm({...editForm, capital_available: e.target.value})}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        placeholder="Capital disponível"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">
                        {form.capital_available || 'Não informado'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingForm === form.id ? (
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="pending">Pendente</option>
                        <option value="contacted">Contatado</option>
                        <option value="scheduled">Agendado</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(form.status)}`}>
                          {getStatusDisplayName(form.status)}
                        </span>
                        <select
                          value={form.status}
                          onChange={(e) => updateStatus(form.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-1 py-1"
                        >
                          <option value="pending">Pendente</option>
                          <option value="contacted">Contatado</option>
                          <option value="scheduled">Agendado</option>
                          <option value="completed">Concluído</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(form.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(form.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {editingForm === form.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-800"
                            title="Salvar alterações"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingForm(null);
                              setEditForm({});
                            }}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancelar edição"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditForm(form)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar formulário"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(`https://wa.me/55${form.phone.replace(/\D/g, '')}?text=Olá ${form.full_name}, sou da Quant Broker. Vi sua solicitação de consultoria. Vamos agendar nossa reunião?`, '_blank')}
                            className="text-green-600 hover:text-green-800"
                            title="Contatar via WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteForm(form.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir formulário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredForms.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? 'Nenhum formulário encontrado' : 'Nenhum formulário de consultoria'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Os formulários de consultoria aparecerão aqui conforme forem sendo enviados'
              }
            </p>
            <button
              onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contato WhatsApp
            </button>
          </div>
        )}
      </div>

      {/* Message Details */}
      {filteredForms.some(f => f.message) && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensagens dos Clientes</h3>
          <div className="space-y-4">
            {filteredForms.filter(f => f.message).map((form) => (
              <div key={form.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900">{form.full_name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(form.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {form.message}
                </p>
              </div>
            ))}
          </div>
            </div>
          </div>
          <button
            onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
            className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contato WhatsApp
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminFormsPanel;