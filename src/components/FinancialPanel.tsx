import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit3, Trash2, Save, X, TrendingUp, TrendingDown, Calculator, Calendar, Users, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClientContract {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  plan_type: string;
  billing_period: string;
  monthly_value: number;
  leverage_multiplier?: number;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  contract_pdf_url?: string;
  cancellation_date?: string;
  cancellation_reason?: string;
}

interface FinancialCost {
  id: string;
  description: string;
  category: string;
  amount: number;
  cost_date: string;
  is_recurring: boolean;
}

const FinancialPanel: React.FC = () => {
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [costs, setCosts] = useState<FinancialCost[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [editingContract, setEditingContract] = useState<ClientContract | null>(null);
  const [editingCost, setEditingCost] = useState<FinancialCost | null>(null);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Rescission states
  const [showRescissionModal, setShowRescissionModal] = useState(false);
  const [rescissionContract, setRescissionContract] = useState<ClientContract | null>(null);
  const [rescissionReason, setRescissionReason] = useState('');
  
  // Statistics states
  const [planDistribution, setPlanDistribution] = useState<{counts: Record<string, number>, revenue: Record<string, number>}>({counts: {}, revenue: {}});
  const [leverageDistribution, setLeverageDistribution] = useState<Record<string, number>>({});
  
  // Form states
  const [contractForm, setContractForm] = useState({
    user_id: '',
    plan_type: 'mini-indice',
    billing_period: 'monthly',
    monthly_value: 0,
    leverage_multiplier: 1,
    contract_start: '',
    contract_end: '',
    is_active: true,
    contract_pdf_url: ''
  });

  const [costForm, setCostForm] = useState({
    description: '',
    category: 'operacional',
    amount: 0,
    cost_date: new Date().toISOString().split('T')[0],
    is_recurring: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (contracts.length > 0) {
      calculateDistributions();
    }
  }, [contracts]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchContracts(), fetchCosts(), fetchUsers()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async () => {
    try {
      console.log('🔍 Fetching contracts...');
      
      // First get contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('client_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('❌ Error fetching contracts:', contractsError);
        setContracts([]);
        return;
      }

      console.log('✅ Raw contracts data:', contractsData);
      
      // Get auth users via admin function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found');
        setContracts([]);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const authUsers = result.success ? result.users : [];
      
      // Combine contracts with auth user data
      const formattedContracts = (contractsData || []).map(contract => {
        const authUser = authUsers.find((user: any) => user.id === contract.user_id);
        return {
          ...contract,
          user_name: authUser?.full_name || authUser?.email || 'Nome não informado',
          user_email: authUser?.email || 'Email não informado',
          leverage_multiplier: contract.leverage_multiplier || 1,
          contract_pdf_url: contract.contract_pdf_url || null
        };
      });

      console.log('✅ Formatted contracts:', formattedContracts);
      setContracts(formattedContracts);
    } catch (error) {
      console.error('❌ Catch error fetching contracts:', error);
      setContracts([]);
    }
  };

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_costs')
        .select('id, description, category, amount, cost_date, is_recurring')
        .order('cost_date', { ascending: false });

      if (error) {
        console.error('Error fetching costs:', error);
        setCosts([]);
        return;
      }
      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
      setCosts([]);
    }
  };

  const fetchUsers = async () => {
    try {
      // Get auth users via admin function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found');
        setUsers([]);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('Error fetching users:', result.error);
        setUsers([]);
        return;
      }
      
      // Filter only active users and format for dropdown
      const activeUsers = (result.users || [])
        .filter((user: any) => user.is_active !== false)
        .map((user: any) => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email
        }));
      
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const calculateDistributions = async () => {
    try {
      // Calculate plan distribution
      const planCounts = activeContracts.reduce((acc, contract) => {
        acc[contract.plan_type] = (acc[contract.plan_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const planRevenue = activeContracts.reduce((acc, contract) => {
        acc[contract.plan_type] = (acc[contract.plan_type] || 0) + contract.monthly_value;
        return acc;
      }, {} as Record<string, number>);

      setPlanDistribution({ counts: planCounts, revenue: planRevenue });

      // Calculate leverage distribution
      const leverageCounts = activeContracts.reduce((acc, contract) => {
        const leverage = contract.leverage_multiplier || 1;
        acc[leverage] = (acc[leverage] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setLeverageDistribution(leverageCounts);
    } catch (error) {
      console.error('Error calculating distributions:', error);
    }
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      console.log('💾 Saving contract...', { editingContract, contractForm });

      if (editingContract) {
        console.log('📝 Updating existing contract:', editingContract.id);
        const { error } = await supabase
          .from('client_contracts')
          .update(contractForm)
          .eq('id', editingContract.id);

        if (error) {
          console.error('❌ Error updating contract:', error);
          throw error;
        }
        console.log('✅ Contract updated successfully');
        setSuccess('Contrato atualizado com sucesso!');
      } else {
        console.log('➕ Creating new contract:', contractForm);
        const { error } = await supabase
          .from('client_contracts')
          .insert([contractForm]);

        if (error) {
          console.error('❌ Error creating contract:', error);
          throw error;
        }
        console.log('✅ Contract created successfully');
        setSuccess('Contrato criado com sucesso!');
      }

      setShowContractModal(false);
      setEditingContract(null);
      resetContractForm();
      await fetchContracts();
    } catch (error: any) {
      console.error('❌ Contract save error:', error);
      setError(error.message);
    }
  };

  const handleSaveCost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      if (editingCost) {
        const { error } = await supabase
          .from('financial_costs')
          .update(costForm)
          .eq('id', editingCost.id);

        if (error) throw error;
        setSuccess('Custo atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('financial_costs')
          .insert([costForm]);

        if (error) throw error;
        setSuccess('Custo adicionado com sucesso!');
      }

      setShowCostModal(false);
      setEditingCost(null);
      resetCostForm();
      fetchCosts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato?')) return;

    try {
      console.log('🗑️ Deleting contract:', id);
      const { error } = await supabase
        .from('client_contracts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting contract:', error);
        throw error;
      }
      console.log('✅ Contract deleted successfully');
      setSuccess('Contrato excluído com sucesso!');
      await fetchContracts();
    } catch (error: any) {
      console.error('❌ Contract delete error:', error);
      setError(error.message);
    }
  };

  const handleDeleteCost = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este custo?')) return;

    try {
      const { error } = await supabase
        .from('financial_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Custo excluído com sucesso!');
      fetchCosts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const resetContractForm = () => {
    setContractForm({
      user_id: '',
      plan_type: 'mini-indice',
      billing_period: 'monthly',
      monthly_value: 0,
      leverage_multiplier: 1,
      contract_start: '',
      contract_end: '',
      is_active: true,
      contract_pdf_url: ''
    });
  };

  const resetCostForm = () => {
    setCostForm({
      description: '',
      category: 'operacional',
      amount: 0,
      cost_date: new Date().toISOString().split('T')[0],
      is_recurring: false
    });
  };

  const openEditContract = (contract: ClientContract) => {
    setEditingContract(contract);
    // Find user name for search field
    const selectedUser = users.find(user => user.id === contract.user_id);
    setUserSearch(selectedUser ? `${selectedUser.full_name || selectedUser.email} (${selectedUser.email})` : '');
    setContractForm({
      user_id: contract.user_id,
      plan_type: contract.plan_type,
      billing_period: contract.billing_period,
      monthly_value: contract.monthly_value,
      leverage_multiplier: contract.leverage_multiplier || 1,
      contract_start: contract.contract_start,
      contract_end: contract.contract_end,
      is_active: contract.is_active,
      contract_pdf_url: contract.contract_pdf_url || ''
    });
    setShowContractModal(true);
  };

  const openEditCost = (cost: FinancialCost) => {
    setEditingCost(cost);
    setCostForm({
      description: cost.description,
      category: cost.category,
      amount: cost.amount,
      cost_date: cost.cost_date,
      is_recurring: cost.is_recurring
    });
    setShowCostModal(true);
  };

  // Cálculos financeiros
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const activeContracts = contracts.filter(c => c.is_active);
  const cancelledContracts = contracts.filter(c => !c.is_active);
  const monthlyRevenue = activeContracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const totalRevenue = contracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const monthlyCosts = costs
    .filter(cost => cost.cost_date.startsWith(currentMonth) || cost.is_recurring)
    .reduce((sum, cost) => sum + cost.amount, 0);
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  
  // Cálculos do ERP
  const totalClients = activeContracts.length;
  const averageLeverage = activeContracts.length > 0 
    ? activeContracts.reduce((sum, c) => sum + (c.leverage_multiplier || 1), 0) / activeContracts.length 
    : 0;
  const totalAssetsUnderManagement = activeContracts.reduce((sum, contract) => {
    const baseAmount = 10000; // R$ 10.000 base por 1x
    return sum + (baseAmount * (contract.leverage_multiplier || 1));
  }, 0);

  const getPlanDisplayName = (plan: string) => {
    const names = {
      'bitcoin': 'Bitcoin',
      'mini-indice': 'Mini Índice',
      'mini-dolar': 'Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return names[plan as keyof typeof names] || plan;
  };

  const getBillingDisplayName = (period: string) => {
    const names = {
      'monthly': 'Mensal',
      'semiannual': 'Semestral',
      'annual': 'Anual'
    };
    return names[period as keyof typeof names] || period;
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const searchTerm = userSearch.toLowerCase();
    const userName = (user.full_name || '').toLowerCase();
    const userEmail = user.email.toLowerCase();
    return userName.includes(searchTerm) || userEmail.includes(searchTerm);
  });

  const handleUserSelect = (user: any) => {
    setContractForm({...contractForm, user_id: user.id});
    setUserSearch(`${user.full_name || user.email} (${user.email})`);
    setShowUserDropdown(false);
  };

  const handleRescindContract = async () => {
    if (!rescissionContract || !rescissionReason.trim()) {
      setError('Motivo da rescisão é obrigatório');
      return;
    }

    try {
      setError(null);
      console.log('🗂️ Rescinding contract:', rescissionContract.id);
      
      const { error } = await supabase
        .from('client_contracts')
        .update({
          is_active: false,
          cancellation_date: new Date().toISOString().split('T')[0],
          cancellation_reason: rescissionReason
        })
        .eq('id', rescissionContract.id);

      if (error) {
        console.error('❌ Error rescinding contract:', error);
        throw error;
      }
      
      console.log('✅ Contract rescinded successfully');
      setSuccess('Contrato rescindido com sucesso!');
      setShowRescissionModal(false);
      setRescissionContract(null);
      setRescissionReason('');
      await fetchContracts();
    } catch (error: any) {
      console.error('❌ Contract rescission error:', error);
      setError(error.message);
    }
  };

  const openRescissionModal = (contract: ClientContract) => {
    setRescissionContract(contract);
    setRescissionReason('');
    setShowRescissionModal(true);
  };

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setShowUserDropdown(true);
    // Clear selection if search is cleared
    if (!value) {
      setContractForm({...contractForm, user_id: ''});
    }
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
            <Building2 className="h-12 w-12 text-green-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Financeiro</h1>
              <p className="text-gray-600">Controle de receitas, custos e contratos</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <X className="h-5 w-5 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <Save className="h-5 w-5 mr-2" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Custos Mensais</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {monthlyCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lucro Mensal</p>
                <p className={`text-2xl font-bold ${monthlyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {monthlyProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
                <p className="text-2xl font-bold text-purple-600">{activeContracts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ERP Statistics Dashboard */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard Executivo - Mini ERP</h2>
            <p className="text-sm text-gray-600">Métricas e estatísticas do negócio</p>
          </div>
          
          <div className="p-6">
            {/* Primary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total de Clientes</p>
                    <p className="text-2xl font-bold text-blue-900">{totalClients}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Patrimônio Sob Custódia</p>
                    <p className="text-2xl font-bold text-green-900">
                      R$ {totalAssetsUnderManagement.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Alavancagem Média</p>
                    <p className="text-2xl font-bold text-purple-900">{averageLeverage.toFixed(1)}x</p>
                  </div>
                  <Calculator className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Receita Acumulada</p>
                    <p className="text-2xl font-bold text-orange-900">
                      R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
            
            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Plan Distribution */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Portfólio</h3>
                <div className="space-y-3">
                  {Object.entries(planDistribution.counts).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded mr-3 ${
                          plan === 'bitcoin' ? 'bg-orange-500' :
                          plan === 'mini-indice' ? 'bg-blue-500' :
                          plan === 'mini-dolar' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-700">
                          {getPlanDisplayName(plan)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{count} clientes</div>
                        <div className="text-xs text-gray-600">
                          R$ {(planDistribution.revenue[plan] || 0).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Leverage Distribution */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Alavancagem</h3>
                <div className="space-y-3">
                  {Object.entries(leverageDistribution).map(([leverage, count]) => (
                    <div key={leverage} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-indigo-500 rounded mr-3"></div>
                        <span className="text-sm font-medium text-gray-700">{leverage}x</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">{count} clientes</div>
                        <div className="text-xs text-gray-600">
                          R$ {(count * 10000 * parseInt(leverage)).toLocaleString('pt-BR')} patrimônio
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Contract Status Summary */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Contratos Ativos</h4>
                <div className="text-2xl font-bold text-green-600">{activeContracts.length}</div>
                <div className="text-sm text-green-700">
                  R$ {monthlyRevenue.toLocaleString('pt-BR')} mensais
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-red-900 mb-2">Contratos Cancelados</h4>
                <div className="text-2xl font-bold text-red-600">{cancelledContracts.length}</div>
                <div className="text-sm text-red-700">
                  Taxa de cancelamento: {contracts.length > 0 ? ((cancelledContracts.length / contracts.length) * 100).toFixed(1) : 0}%
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Ticket Médio</h4>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {activeContracts.length > 0 ? (monthlyRevenue / activeContracts.length).toLocaleString('pt-BR') : '0'}
                </div>
                <div className="text-sm text-blue-700">Por cliente ativo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Contracts Section */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Contratos dos Clientes</h2>
              <button
                onClick={() => {
                  resetContractForm();
                  setEditingContract(null);
                  setShowContractModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Contrato
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Mensal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alavancagem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Início</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{contract.user_name}</div>
                        <div className="text-sm text-gray-500">{contract.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getPlanDisplayName(contract.plan_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getBillingDisplayName(contract.billing_period)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {contract.leverage_multiplier || 1}x
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(contract.contract_start).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(contract.contract_end).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.is_active ? 'Ativo' : 'Cancelado'}
                      </span>
                      {!contract.is_active && contract.cancellation_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Cancelado em {new Date(contract.cancellation_date).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditContract(contract)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar contrato"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {contract.is_active && (
                          <button
                            onClick={() => openRescissionModal(contract)}
                            className="text-orange-600 hover:text-orange-800"
                            title="Rescindir contrato"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContract(contract.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir contrato"
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
        </div>

        {/* Costs Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Custos da Empresa</h2>
              <button
                onClick={() => {
                  resetCostForm();
                  setEditingCost(null);
                  setShowCostModal(true);
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Custo
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorrente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costs.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cost.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {cost.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      R$ {cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(cost.cost_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        cost.is_recurring 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cost.is_recurring ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditCost(cost)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar custo"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCost(cost.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir custo"
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
        </div>

        {/* Contract Modal */}
        {showContractModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
                </h2>
                <button
                  onClick={() => {
                    setShowContractModal(false);
                    setEditingContract(null);
                    resetContractForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form 
                onSubmit={handleSaveContract} 
                className="p-6 space-y-6"
                onClick={(e) => {
                  // Close dropdown when clicking outside
                  if (!(e.target as Element).closest('.relative')) {
                    setShowUserDropdown(false);
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => handleUserSearchChange(e.target.value)}
                        onFocus={() => setShowUserDropdown(true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Digite o nome ou email do cliente..."
                        required
                      />
                      
                      {showUserDropdown && filteredUsers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredUsers.map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
                            >
                              <div className="font-medium text-gray-900">
                                {user.full_name || 'Nome não informado'}
                              </div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showUserDropdown && userSearch && filteredUsers.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                          <p className="text-gray-500 text-sm">Nenhum usuário encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plano *</label>
                    <select
                      value={contractForm.plan_type}
                      onChange={(e) => setContractForm({...contractForm, plan_type: e.target.value})}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Modalidade *</label>
                    <select
                      value={contractForm.billing_period}
                      onChange={(e) => setContractForm({...contractForm, billing_period: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="monthly">Mensal</option>
                      <option value="semiannual">Semestral</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mensal (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={contractForm.monthly_value}
                      onChange={(e) => setContractForm({...contractForm, monthly_value: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                    {contractForm.monthly_value <= 0 && (
                      <p className="text-red-600 text-sm mt-1">Valor deve ser maior que zero</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alavancagem *</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={contractForm.leverage_multiplier}
                      onChange={(e) => setContractForm({...contractForm, leverage_multiplier: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Digite um valor de 1 a 100 (ex: 1, 2, 5, 10, 25, 50, 100)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Início do Contrato *</label>
                    <input
                      type="date"
                      value={contractForm.contract_start}
                      onChange={(e) => setContractForm({...contractForm, contract_start: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fim do Contrato *</label>
                    <input
                      type="date"
                      value={contractForm.contract_end}
                      onChange={(e) => setContractForm({...contractForm, contract_end: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min={contractForm.contract_start || new Date().toISOString().split('T')[0]}
                      required
                    />
                    {contractForm.contract_end && contractForm.contract_start && 
                     new Date(contractForm.contract_end) <= new Date(contractForm.contract_start) && (
                      <p className="text-red-600 text-sm mt-1">Data de fim deve ser posterior ao início</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="contract_active"
                    checked={contractForm.is_active}
                    onChange={(e) => setContractForm({...contractForm, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="contract_active" className="ml-2 text-sm text-gray-700">
                    Contrato ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    {editingContract ? 'Atualizar Contrato' : 'Criar Contrato'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowContractModal(false);
                      setEditingContract(null);
                      resetContractForm();
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

        {/* Cost Modal */}
        {showCostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCost ? 'Editar Custo' : 'Novo Custo'}
                </h2>
                <button
                  onClick={() => {
                    setShowCostModal(false);
                    setEditingCost(null);
                    resetCostForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSaveCost} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                    <input
                      type="text"
                      value={costForm.description}
                      onChange={(e) => setCostForm({...costForm, description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Descrição do custo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                    <select
                      value={costForm.category}
                      onChange={(e) => setCostForm({...costForm, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="operacional">Operacional</option>
                      <option value="marketing">Marketing</option>
                      <option value="tecnologia">Tecnologia</option>
                      <option value="pessoal">Pessoal</option>
                      <option value="infraestrutura">Infraestrutura</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={costForm.amount}
                      onChange={(e) => setCostForm({...costForm, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
                    <input
                      type="date"
                      value={costForm.cost_date}
                      onChange={(e) => setCostForm({...costForm, cost_date: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cost_recurring"
                    checked={costForm.is_recurring}
                    onChange={(e) => setCostForm({...costForm, is_recurring: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="cost_recurring" className="ml-2 text-sm text-gray-700">
                    Custo recorrente (mensal)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    {editingCost ? 'Atualizar Custo' : 'Adicionar Custo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCostModal(false);
                      setEditingCost(null);
                      resetCostForm();
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

        {/* Rescission Modal */}
        {showRescissionModal && rescissionContract && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Rescindir Contrato</h2>
                <button
                  onClick={() => {
                    setShowRescissionModal(false);
                    setRescissionContract(null);
                    setRescissionReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">Cliente: {rescissionContract.user_name}</h3>
                  <p className="text-sm text-gray-600">
                    {getPlanDisplayName(rescissionContract.plan_type)} - 
                    R$ {rescissionContract.monthly_value.toLocaleString('pt-BR')} mensais
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da Rescisão *
                  </label>
                  <textarea
                    value={rescissionReason}
                    onChange={(e) => setRescissionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Descreva o motivo da rescisão do contrato..."
                    required
                  />
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-orange-800">
                    <strong>Atenção:</strong> Esta ação irá cancelar o contrato permanentemente. 
                    O contrato será marcado como inativo e não gerará mais receita.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRescindContract}
                    disabled={!rescissionReason.trim()}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    Confirmar Rescisão
                  </button>
                  <button
                    onClick={() => {
                      setShowRescissionModal(false);
                      setRescissionContract(null);
                      setRescissionReason('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialPanel;