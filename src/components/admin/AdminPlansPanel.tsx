import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit3, Save, X, Trash2, Eye, EyeOff, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PlanConfiguration {
  id: string;
  plan_id: string;
  plan_name: string;
  description: string;
  monthly_price: number;
  semiannual_price: number;
  annual_price: number;
  original_monthly_price?: number;
  original_semiannual_price?: number;
  original_annual_price?: number;
  min_capital: string;
  daily_risk: string;
  leverage: string;
  risk_control: string;
  features: string[];
  is_recommended: boolean;
  is_visible: boolean;
  is_available: boolean;
  stripe_link_monthly?: string;
  stripe_link_semiannual?: string;
  stripe_link_annual?: string;
  asaas_link_monthly?: string;
  asaas_link_semiannual?: string;
  asaas_link_annual?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const AdminPlansPanel: React.FC = () => {
  const [plans, setPlans] = useState<PlanConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PlanConfiguration>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plan_configurations')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('plan_configurations')
        .update(editForm)
        .eq('id', editingPlan);

      if (error) throw error;

      setSuccess('Plano atualizado com sucesso!');
      setEditingPlan(null);
      setEditForm({});
      fetchPlans();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setEditForm({});
    setError(null);
    setSuccess(null);
  };

  const handleToggleVisibility = async (planId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('plan_configurations')
        .update({ is_visible: !currentVisibility })
        .eq('id', planId);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleToggleAvailability = async (planId: string, currentAvailability: boolean) => {
    try {
      const { error } = await supabase
        .from('plan_configurations')
        .update({ is_available: !currentAvailability })
        .eq('id', planId);

      if (error) throw error;
      fetchPlans();
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Settings className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuração de Planos</h2>
            <p className="text-gray-600">Gerencie preços, características e disponibilidade dos planos</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Plano
        </button>
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

      {/* Plans Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configurações dos Planos</h3>
          <p className="text-sm text-gray-600">Configure preços, características e disponibilidade</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preços</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Características</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{plan.plan_name}</div>
                        {plan.is_recommended && (
                          <Star className="h-4 w-4 text-yellow-500 ml-2" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500 max-w-[200px] truncate">{plan.description}</div>
                      <div className="text-xs text-gray-400">ID: {plan.plan_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingPlan === plan.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.monthly_price || ''}
                            onChange={(e) => setEditForm({...editForm, monthly_price: parseFloat(e.target.value)})}
                            className="text-xs border rounded px-2 py-1"
                            placeholder="Mensal"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.semiannual_price || ''}
                            onChange={(e) => setEditForm({...editForm, semiannual_price: parseFloat(e.target.value)})}
                            className="text-xs border rounded px-2 py-1"
                            placeholder="Semestral"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.annual_price || ''}
                            onChange={(e) => setEditForm({...editForm, annual_price: parseFloat(e.target.value)})}
                            className="text-xs border rounded px-2 py-1"
                            placeholder="Anual"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div>Mensal: R$ {plan.monthly_price.toFixed(2)}</div>
                        <div>Semestral: R$ {plan.semiannual_price.toFixed(2)}</div>
                        <div>Anual: R$ {plan.annual_price.toFixed(2)}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>Capital: {plan.min_capital}</div>
                      <div>Risco: {plan.daily_risk}</div>
                      <div>Alavancagem: {plan.leverage}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.is_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.is_visible ? 'Visível' : 'Oculto'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.is_available ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {plan.is_available ? 'Disponível' : 'Fila de Espera'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {editingPlan === plan.id ? (
                        <>
                          <button
                            onClick={handleSavePlan}
                            className="text-green-600 hover:text-green-800"
                            title="Salvar alterações"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancelar edição"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingPlan(plan.id);
                              setEditForm(plan);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar plano"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleVisibility(plan.id, plan.is_visible)}
                            className={`${plan.is_visible ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
                            title={plan.is_visible ? 'Ocultar plano' : 'Mostrar plano'}
                          >
                            {plan.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleAvailability(plan.id, plan.is_available)}
                            className={`${plan.is_available ? 'text-blue-600 hover:text-blue-800' : 'text-orange-600 hover:text-orange-800'}`}
                            title={plan.is_available ? 'Colocar em fila de espera' : 'Disponibilizar para venda'}
                          >
                            {plan.is_available ? '🛒' : '⏳'}
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

        {plans.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano configurado</h3>
            <p className="text-gray-600 mb-4">Execute a migração da tabela plan_configurations primeiro</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Plano
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPlansPanel;