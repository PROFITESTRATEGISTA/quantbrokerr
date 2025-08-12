import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit3, Save, X, Trash2, Calendar, DollarSign, User, CheckCircle, AlertCircle, Building2, TrendingUp, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClientContract {
  id: string;
  user_id: string;
  plan_type: string;
  billing_period: string;
  monthly_value: number;
  leverage_multiplier: number;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  contract_file_url: string | null;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

const AdminContractsPanel: React.FC = () => {
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState<string | null>(null);

  const [newContract, setNewContract] = useState({
    plan_type: 'bitcoin',
    billing_period: 'monthly',
    monthly_value: 0,
    leverage_multiplier: 1,
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: '',
    is_active: true
  });

  useEffect(() => {
    fetchContracts();
    fetchUsers();
  }, []);

  useEffect(() => {
    // Auto-calculate end date when billing period or start date changes
    if (newContract.contract_start && (newContract.billing_period === 'semiannual' || newContract.billing_period === 'annual')) {
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      if (newContract.billing_period === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (newContract.billing_period === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setNewContract(prev => ({ ...prev, contract_end: formattedEndDate }));
    } else if (newContract.billing_period === 'monthly') {
      setNewContract(prev => ({ ...prev, contract_end: '' }));
    }
  }, [newContract.billing_period, newContract.contract_start]);

  useEffect(() => {
    // Filter users based on search term
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(availableUsers.slice(0, 10)); // Show first 10 users
    } else {
      const filtered = availableUsers.filter(user => 
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()))
      ).slice(0, 10);
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, availableUsers]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_contracts')
        .select(`
          *,
          user_profiles (
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get current user session to verify admin access
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser || currentUser.email !== 'pedropardal04@gmail.com') {
        setError('Acesso negado para buscar usuários');
        return;
      }

      // Use admin edge function to get users
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.users) {
        setAvailableUsers(result.users);
        setFilteredUsers(result.users.slice(0, 10));
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Erro ao carregar usuários: ${error.message}`);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!selectedUser) {
        throw new Error('Selecione um usuário para o contrato');
      }

      // Calculate contract end date
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      switch (newContract.billing_period) {
        case 'monthly':
          // For monthly, set far future date (ongoing)
          endDate = new Date('9999-12-31');
          break;
        case 'semiannual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      const contractData = {
        user_id: selectedUser.id,
        plan_type: newContract.plan_type,
        billing_period: newContract.billing_period,
        monthly_value: newContract.monthly_value,
        leverage_multiplier: newContract.leverage_multiplier,
        contract_start: newContract.contract_start,
        contract_end: endDate.toISOString().split('T')[0],
        is_active: newContract.is_active
      };

      const { error } = await supabase
        .from('client_contracts')
        .insert(contractData);

      if (error) throw error;

      setSuccess('Contrato adicionado com sucesso!');
      setShowAddModal(false);
      setSelectedUser(null);
      setUserSearchTerm('');
      setNewContract({
        plan_type: 'bitcoin',
        billing_period: 'monthly',
        monthly_value: 0,
        leverage_multiplier: 1,
        contract_start: new Date().toISOString().split('T')[0],
        contract_end: '',
        is_active: true
      });
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEditContract = (contract: ClientContract) => {
    setEditingContract(contract.id);
    setEditForm({
      plan_type: contract.plan_type,
      billing_period: contract.billing_period,
      monthly_value: contract.monthly_value,
      leverage_multiplier: contract.leverage_multiplier,
      contract_start: contract.contract_start,
      contract_end: contract.contract_end,
      is_active: contract.is_active
    });
  };

  const handleSaveEdit = async () => {
    if (!editingContract) return;

    try {
      const { error } = await supabase
        .from('client_contracts')
        .update(editForm)
        .eq('id', editingContract);

      if (error) throw error;

      setSuccess('Contrato atualizado com sucesso!');
      setEditingContract(null);
      setEditForm({});
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    try {
      const { error } = await supabase
        .from('client_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Contrato excluído com sucesso!');
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    const plans = {
      'bitcoin': 'Bitcoin',
      'mini-indice': 'Mini Índice',
      'mini-dolar': 'Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return plans[plan as keyof typeof plans] || plan;
  };

  const getBillingDisplayName = (period: string) => {
    const periods = {
      'monthly': 'Mensal',
      'semiannual': 'Semestral',
      'annual': 'Anual'
    };
    return periods[period as keyof typeof periods] || period;
  };

  // Calculate metrics
  const activeContracts = contracts.filter(c => c.is_active);
  const totalMonthlyRevenue = activeContracts.reduce((sum, c) => sum + c.monthly_value, 0);
  const totalAnnualRevenue = totalMonthlyRevenue * 12;
  const averageLeverage = activeContracts.length > 0 
    ? activeContracts.reduce((sum, c) => sum + (c.leverage_multiplier || 1), 0) / activeContracts.length 
    : 0;

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
          <FileText className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contratos de Clientes</h2>
            <p className="text-gray-600">Gestão de contratos e receitas dos clientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Contrato
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-blue-600">{activeContracts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Anual</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {totalAnnualRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Alavancagem Média</p>
              <p className="text-2xl font-bold text-indigo-600">
                {averageLeverage.toFixed(1)}x
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {activeContracts.length > 0 ? (totalMonthlyRevenue / activeContracts.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Contratos</h3>
          <p className="text-sm text-gray-600">Gerencie todos os contratos de clientes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alavancagem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {contract.user_profiles?.full_name || 'Nome não informado'}
                      </div>
                      <div className="text-sm text-gray-500">{contract.user_profiles?.email}</div>
                      <div className="text-sm text-gray-500">{contract.user_profiles?.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingContract === contract.id ? (
                      <select
                        value={editForm.plan_type || ''}
                        onChange={(e) => setEditForm({...editForm, plan_type: e.target.value})}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="bitcoin">Bitcoin</option>
                        <option value="mini-indice">Mini Índice</option>
                        <option value="mini-dolar">Mini Dólar</option>
                        <option value="portfolio-completo">Portfólio Completo</option>
                      </select>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getPlanDisplayName(contract.plan_type)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingContract === contract.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.monthly_value || ''}
                        onChange={(e) => setEditForm({...editForm, monthly_value: parseFloat(e.target.value) || 0})}
                        className="w-24 text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {getBillingDisplayName(contract.billing_period)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingContract === contract.id ? (
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editForm.leverage_multiplier || ''}
                        onChange={(e) => setEditForm({...editForm, leverage_multiplier: parseInt(e.target.value) || 1})}
                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <span className="text-sm font-medium text-indigo-600">
                        {contract.leverage_multiplier || 1}x
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(contract.contract_start).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contract.contract_end 
                        ? `até ${new Date(contract.contract_end).toLocaleDateString('pt-BR')}`
                        : 'Sem prazo definido'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingContract === contract.id ? (
                      <select
                        value={editForm.is_active ? 'active' : 'inactive'}
                        onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'active'})}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">Não disponível</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingContract === contract.id ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveEdit}
                          className="text-green-600 hover:text-green-800"
                          title="Salvar"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingContract(null);
                            setEditForm({});
                          }}
                          className="text-gray-600 hover:text-gray-800"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditContract(contract)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContract(contract.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-gray-600 mb-4">Os contratos de clientes aparecerão aqui</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Contrato
            </button>
          </div>
        )}
      </div>

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Novo Contrato de Cliente</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddContract} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Usuário *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedUser ? `${selectedUser.full_name || selectedUser.email} (${selectedUser.email})` : userSearchTerm}
                      onChange={(e) => {
                        if (!selectedUser) {
                          setUserSearchTerm(e.target.value);
                          setShowUserDropdown(true);
                        }
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Buscar usuário por email ou nome..."
                      required
                    />
                    {selectedUser && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setUserSearchTerm('');
                          setShowUserDropdown(true);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    
                    {/* User Dropdown */}
                    {showUserDropdown && !selectedUser && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDropdown(false);
                                setUserSearchTerm('');
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                {user.full_name || 'Nome não informado'}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-gray-400">{user.phone}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            {userSearchTerm ? 'Nenhum usuário encontrado' : 'Digite para buscar usuários'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedUser && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm">
                        <div className="font-medium text-blue-900">
                          {selectedUser.full_name || 'Nome não informado'}
                        </div>
                        <div className="text-blue-700">{selectedUser.email}</div>
                        {selectedUser.phone && (
                          <div className="text-blue-600">{selectedUser.phone}</div>
                        )}
                        <div className="text-xs text-blue-500 mt-1">
                          Plano atual: {getPlanDisplayName(selectedUser.contracted_plan)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Plano *
                  </label>
                  <select
                    value={newContract.plan_type}
                    onChange={(e) => setNewContract({...newContract, plan_type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="bitcoin">Bitcoin</option>
                    <option value="mini-indice">Mini Índice</option>
                    <option value="mini-dolar">Mini Dólar</option>
                    <option value="portfolio-completo">Portfólio Completo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Período de Cobrança *
                  </label>
                  <select
                    value={newContract.billing_period}
                    onChange={(e) => setNewContract({...newContract, billing_period: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="monthly">Mensal</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alavancagem *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newContract.leverage_multiplier}
                    onChange={(e) => setNewContract({...newContract, leverage_multiplier: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newContract.monthly_value}
                    onChange={(e) => setNewContract({...newContract, monthly_value: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Início do Contrato *
                  </label>
                  <input
                    type="date"
                    value={newContract.contract_start}
                    onChange={(e) => setNewContract({...newContract, contract_start: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fim do Contrato
                    {newContract.billing_period === 'monthly' 
                      ? ' (sem prazo definido)' 
                      : ' (calculado automaticamente)'
                    }
                  </label>
                  {newContract.billing_period === 'monthly' ? (
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 text-center">
                      Renovação mensal automática
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={newContract.contract_end}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-blue-50 text-gray-700"
                      readOnly
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {newContract.billing_period === 'monthly'
                      ? "Contratos mensais são renovados automaticamente"
                      : `Data calculada: ${newContract.billing_period === 'semiannual' ? '+6 meses' : '+1 ano'} da data de início`
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={newContract.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setNewContract({...newContract, is_active: e.target.value === 'active'})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!selectedUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Contrato
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedUser(null);
                    setUserSearchTerm('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContractsPanel;