import React, { useState, useEffect } from 'react';
import { Calendar, Users, Edit3, Save, X, Trash2, MessageCircle, CheckCircle, AlertCircle, Clock, Video, TrendingUp } from 'lucide-react';
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
  const [consultationForms, setConsultationForms] = useState<ConsultationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchConsultationForms();
  }, []);

  const fetchConsultationForms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('consultation_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultationForms(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateFormStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('consultation_forms')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('Status atualizado com sucesso!');
      fetchConsultationForms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return;

    try {
      const { error } = await supabase
        .from('consultation_forms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSuccess('Formulário excluído com sucesso!');
      fetchConsultationForms();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getConsultationTypeDisplayName = (type: string) => {
    const types = {
      'results': 'Conhecer Resultados',
      'strategy': 'Estratégias Personalizadas',
      'demo': 'Demonstração ao Vivo'
    };
    return types[type as keyof typeof types] || type;
  };

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'results': return TrendingUp;
      case 'strategy': return Users;
      case 'demo': return Video;
      default: return Calendar;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    const names = {
      'pending': 'Pendente',
      'scheduled': 'Agendado',
      'completed': 'Concluído',
      'cancelled': 'Cancelado'
    };
    return names[status as keyof typeof names] || status;
  };

  // Calculate metrics
  const totalForms = consultationForms.length;
  const pendingForms = consultationForms.filter(f => f.status === 'pending').length;
  const scheduledForms = consultationForms.filter(f => f.status === 'scheduled').length;
  const completedForms = consultationForms.filter(f => f.status === 'completed').length;
  const conversionRate = totalForms > 0 ? (completedForms / totalForms) * 100 : 0;

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
          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Formulários de Consultoria</h2>
            <p className="text-gray-600">Agendamentos de reunião com consultores</p>
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
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Formulários</p>
              <p className="text-2xl font-bold text-blue-600">{totalForms}</p>
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
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">{completedForms}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa Conversão</p>
              <p className="text-2xl font-bold text-purple-600">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Forms Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Solicitações de Consultoria</h3>
          <p className="text-sm text-gray-600">
            {totalForms} formulários de agendamento recebidos
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Consultoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horário Preferido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consultationForms.map((form) => {
                const TypeIcon = getConsultationTypeIcon(form.consultation_type);
                
                return (
                  <tr key={form.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{form.full_name}</div>
                        <div className="text-sm text-gray-500">{form.email}</div>
                        <div className="text-sm text-gray-500">{form.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <TypeIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getConsultationTypeDisplayName(form.consultation_type)}
                          </div>
                          {form.message && (
                            <div className="text-xs text-gray-500 max-w-[200px] truncate">
                              {form.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{form.preferred_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {form.capital_available || 'Não informado'}
                      </div>
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
                      <select
                        value={form.status}
                        onChange={(e) => updateFormStatus(form.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(form.status)}`}
                      >
                        <option value="pending">Pendente</option>
                        <option value="scheduled">Agendado</option>
                        <option value="completed">Concluído</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => window.open(`https://wa.me/55${form.phone.replace(/\D/g, '')}?text=Olá ${form.full_name}, sou da Quant Broker. Recebi sua solicitação de consultoria sobre nossos Portfólios de IA. Vamos agendar nossa reunião?`, '_blank')}
                          className="text-green-600 hover:text-green-800"
                          title="Contatar via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteForm(form.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir formulário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {consultationForms.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum formulário encontrado</h3>
            <p className="text-gray-600">Os formulários de consultoria aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFormsPanel;