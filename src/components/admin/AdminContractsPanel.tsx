import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit3, Save, X, Trash2, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, Upload, ExternalLink, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ClientContract {
  id: string;
  user_id: string;
  plan_type: string;
  billing_period: string;
  monthly_value: number;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  leverage_multiplier: number;
  contract_file_url: string | null;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    id: string;
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;
}

const AdminContractsPanel: React.FC = () => {
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ClientContract>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [contractToCancel, setContractToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // User search states
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [newContract, setNewContract] = useState({
    user_id: '',
    plan_type: 'bitcoin',
    billing_period: 'monthly',
    monthly_value: 0,
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: '',
    leverage_multiplier: 1,
    is_active: true
  });

  // User form fields
  const [userForm, setUserForm] = useState({
    email: '',
    phone: '',
    full_name: ''
  });

  // Fetch available users for contract creation
  const fetchAvailableUsers = async () => {
    try {
      console.log('🔍 Buscando usuários do site...');
      setError(null);
      
      // Use the admin edge function to get all users (auth + profiles)
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
        console.log('✅ Usuários carregados:', result.users.length);
        console.log('📋 Lista completa:', result.users);
        
        // Sort users by name or email
        const sortedUsers = result.users.sort((a: any, b: any) => {
          const nameA = a.full_name || a.email || '';
          const nameB = b.full_name || b.email || '';
          return nameA.localeCompare(nameB);
        });
        
        setAvailableUsers(sortedUsers);
        
        if (sortedUsers.length === 0) {
          setError('Nenhum usuário encontrado no sistema. Verifique se há usuários cadastrados.');
        }
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários');
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      setError('Erro ao carregar lista de usuários. Tente novamente.');
      setAvailableUsers([]);
    }
  };

  // Fetch users from auth system if user_profiles is empty
  const fetchUsersFromAuth = async () => {
    try {
      console.log('🔄 Buscando usuários do sistema de autenticação...');
      
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
        console.log('✅ Usuários do auth carregados:', result.users.length);
        setAvailableUsers(result.users);
      } else {
        console.warn('⚠️ Nenhum usuário encontrado no auth');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar usuários do auth:', error);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.length > 0 && !selectedUser) {
      const filtered = availableUsers.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.phone && user.phone.includes(searchTerm))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, availableUsers, selectedUser]);

  // Calculate contract end date automatically
  useEffect(() => {
    if (newContract.contract_start && newContract.billing_period !== 'monthly') {
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      switch (newContract.billing_period) {
        case 'semiannual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }
      
      setNewContract(prev => ({
        ...prev,
        contract_end: endDate.toISOString().split('T')[0]
      }));
    } else if (newContract.billing_period === 'monthly') {
      // For monthly contracts, calculate 1 month ahead
      const startDate = new Date(newContract.contract_start);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      setNewContract(prev => ({
        ...prev,
        contract_end: endDate.toISOString().split('T')[0]
      }));
    }
  }, [newContract.contract_start, newContract.billing_period]);
  
  useEffect(() => {
    fetchContracts();
    fetchAvailableUsers();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando contratos...');
      
      // First get contracts
      const { data: contractsData, error: contractsError } = await supabase
        .from('client_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractsError) {
        console.error('Error fetching contracts:', contractsError);
        throw contractsError;
      }
      
      // Then get user profiles for each contract
      const contractsWithProfiles = await Promise.all(
        (contractsData || []).map(async (contract) => {
          try {
            // Try to get user profile
            const { data: profile, error: profileError } = await supabase
              .from('user_profiles')
              .select('id, full_name, email, phone')
              .eq('id', contract.user_id)
              .single();

            if (profileError && profileError.code === 'PGRST116') {
              // Profile not found - try to get from auth and create profile
              console.log('⚠️ Perfil não encontrado para usuário:', contract.user_id);
              
              try {
                // Get user from auth
                const { data: { user: authUser }, error: authError } = await supabase.auth.admin.getUserById(contract.user_id);
                
                if (authUser && !authError) {
                  console.log('👤 Usuário encontrado no auth:', authUser.email);
                  
                  // Create missing profile
                  const { error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                      id: authUser.id,
                      email: authUser.email!,
                      phone: authUser.phone || authUser.user_metadata?.phone || null,
                      full_name: authUser.user_metadata?.full_name || null,
                      leverage_multiplier: contract.leverage_multiplier || 1,
                      is_active: true,
                      contracted_plan: contract.plan_type
                    });

                  if (!createError) {
                    console.log('✅ Perfil criado automaticamente para:', authUser.email);
                    
                    // Return contract with newly created profile data
                    return {
                      ...contract,
                      user_profiles: {
                        id: authUser.id,
                        full_name: authUser.user_metadata?.full_name || null,
                        email: authUser.email!,
                        phone: authUser.phone || authUser.user_metadata?.phone || null
                      }
                    };
                  }
                }
              } catch (authError) {
                console.error('❌ Erro ao buscar usuário no auth:', authError);
              }
              
              // Return contract without profile if all fails
              return {
                ...contract,
                user_profiles: null
              };
            }
            
            if (profileError) {
              console.error('❌ Erro ao buscar perfil:', profileError);
              return {
                ...contract,
                user_profiles: null
              };
            }
            
            // Return contract with profile
            return {
              ...contract,
              user_profiles: profile
            };
          } catch (error) {
            console.error('❌ Erro ao processar contrato:', contract.id, error);
            return {
              ...contract,
              user_profiles: null
            };
          }
        })
      );
      
      console.log('✅ Contratos encontrados:', contractsData?.length || 0);
      console.log('📋 Contratos com perfis:', contractsWithProfiles?.map(c => ({
        id: c.id,
        user_id: c.user_id,
        plan_type: c.plan_type,
        user_profile: c.user_profiles ? {
          email: c.user_profiles.email,
          full_name: c.user_profiles.full_name,
          phone: c.user_profiles.phone
        } : null
      })));
      
      setContracts(contractsWithProfiles || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      setError(error.message);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    console.log('👤 Usuário selecionado:', user);
    setSelectedUser(user);
    setNewContract(prev => ({ ...prev, user_id: user.id }));
    setUserForm({
      email: user.email || '',
      phone: user.phone || '',
      full_name: user.full_name || ''
    });
    setSearchTerm(user.full_name || user.email);
    setShowUserDropdown(false);
  };

  const clearUserSelection = () => {
    console.log('🗑️ Limpando seleção de usuário');
    setSelectedUser(null);
    setNewContract(prev => ({ ...prev, user_id: '' }));
    setUserForm({
      email: '',
      phone: '',
      full_name: ''
    });
    setSearchTerm('');
    setShowUserDropdown(false);
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Se não há usuário selecionado, precisamos criar um novo usuário primeiro
      let userId = newContract.user_id;
      let createdNewUser = false;
      
      if (!selectedUser && userForm.email) {
        // Verificar se já existe um usuário com este email
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', userForm.email)
          .single();

        if (existingUser) {
          userId = existingUser.id;
        } else {
          // Criar novo usuário no sistema de auth
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: userForm.email,
            password: 'TempPassword123!', // Senha temporária
            email_confirm: true,
            user_metadata: {
              full_name: userForm.full_name,
            }
          });

          if (authError) throw authError;
          
          if (!authUser.user) {
            throw new Error('Erro ao criar usuário no sistema de autenticação');
          }

          userId = authUser.user.id;
          createdNewUser = true;

          // Aguardar um pouco para garantir que o usuário foi criado no auth
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Criar perfil do usuário
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: userForm.email,
              phone: userForm.phone || null,
              full_name: userForm.full_name,
              leverage_multiplier: 1,
              is_active: true,
              contracted_plan: newContract.plan_type
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw new Error('Erro ao criar perfil do usuário: ' + profileError.message);
          }

          console.log('✅ Perfil criado para usuário:', userId, userForm.email);
        }
      }

      if (!userId) {
        throw new Error('Usuário deve ser selecionado ou dados preenchidos');
      }

      // Calculate contract end date
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      switch (newContract.billing_period) {
        case 'monthly':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'semiannual':
          endDate.setMonth(endDate.getMonth() + 6);
          break;
        case 'annual':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      const contractData = {
        user_id: userId,
        plan_type: newContract.plan_type,
        billing_period: newContract.billing_period,
        monthly_value: newContract.monthly_value,
        contract_start: newContract.contract_start,
        contract_end: endDate.toISOString().split('T')[0],
        leverage_multiplier: newContract.leverage_multiplier,
        is_active: newContract.is_active
      };

      const { error } = await supabase
        .from('client_contracts')
        .insert(contractData);

      if (error) throw error;

      // Se criou um novo usuário, atualizar também o contracted_plan no perfil
      if (createdNewUser || selectedUser) {
        console.log('🔄 Atualizando perfil do usuário:', userId);
        
        const { error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({ 
            contracted_plan: newContract.plan_type,
            leverage_multiplier: newContract.leverage_multiplier,
            plan_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateProfileError) {
          console.warn('Warning updating user profile:', updateProfileError);
        }
      }
      
      setSuccess('Contrato adicionado com sucesso!');
      setShowAddModal(false);
      clearUserSelection();
      setNewContract({
        user_id: '',
        plan_type: 'bitcoin',
        billing_period: 'monthly',
        monthly_value: 0,
        contract_start: new Date().toISOString().split('T')[0],
        contract_end: '',
        leverage_multiplier: 1,
        is_active: true
      });
      
      // Aguardar mais tempo para garantir que os dados foram salvos e sincronizados
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Recarregar contratos e usuários
      await fetchContracts();
      await fetchAvailableUsers();
    } catch (error: any) {
      console.error('Error creating contract:', error);
      setError(error.message);
    }
  };

  const handleDeleteContract = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.')) return;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('client_contracts')
        .delete()
        .eq('id', contractId);

      if (error) throw error;

      setSuccess('Contrato excluído com sucesso!');
      fetchContracts();
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      setError(error.message);
    }
  };

  const handleToggleContractStatus = async (contractId: string, currentStatus: boolean) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('client_contracts')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;

      setSuccess(`Contrato ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchContracts();
    } catch (error: any) {
      console.error('Error toggling contract status:', error);
      setError(error.message);
    }
  };

  const handleCancelContract = (contractId: string) => {
    setContractToCancel(contractId);
    setShowCancelModal(true);
  };

  const confirmCancelContract = async () => {
    if (!contractToCancel || !cancellationReason.trim()) {
      setError('Motivo do cancelamento é obrigatório');
      return;
    }

    try {
      setError(null);
      
      const { error } = await supabase
        .from('client_contracts')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractToCancel);

      if (error) throw error;

      setSuccess(`Contrato cancelado com sucesso! Motivo: ${cancellationReason}`);
      setShowCancelModal(false);
      setContractToCancel(null);
      setCancellationReason('');
      fetchContracts();
    } catch (error: any) {
      console.error('Error cancelling contract:', error);
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

  const getBillingPeriodDisplayName = (period: string) => {
    const periods = {
      'monthly': 'Mensal',
      'semiannual': 'Semestral',
      'annual': 'Anual'
    };
    return periods[period as keyof typeof periods] || period;
  };

  // Calculate churn metrics
  const calculateChurnMetrics = () => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.is_active).length;
    const cancelledContracts = contracts.filter(c => !c.is_active).length;
    const churnRate = totalContracts > 0 ? (cancelledContracts / totalContracts) * 100 : 0;
    
    // Calculate monthly churn (contracts cancelled in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentlyCancelled = contracts.filter(c => 
      !c.is_active && new Date(c.updated_at) > thirtyDaysAgo
    ).length;
    
    const monthlyChurnRate = activeContracts > 0 ? (recentlyCancelled / (activeContracts + recentlyCancelled)) * 100 : 0;
    
    return {
      totalContracts,
      activeContracts,
      cancelledContracts,
      churnRate,
      monthlyChurnRate,
      recentlyCancelled
    };
  };

  const churnMetrics = calculateChurnMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Building className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contratos de Clientes</h2>
            <p className="text-gray-600">Gerencie contratos e planos dos clientes</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Contratos</p>
              <p className="text-2xl font-bold text-blue-600">{contracts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Contratos Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {contracts.filter(c => c.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
              <p className="text-2xl font-bold text-purple-600">
                R$ {contracts
                  .filter(c => c.is_active)
                  .reduce((sum, c) => sum + c.monthly_value, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <X className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Churn</p>
              <p className="text-2xl font-bold text-red-600">
                {churnMetrics.churnRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {churnMetrics.cancelledContracts} de {churnMetrics.totalContracts} cancelados
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Churn Mensal</p>
              <p className="text-2xl font-bold text-orange-600">
                {churnMetrics.monthlyChurnRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {churnMetrics.recentlyCancelled} cancelados (30 dias)
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alavancagem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {(contract.user_profiles?.full_name || contract.user_profiles?.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {contract.user_profiles?.email || `Usuário ID: ${contract.user_id.substring(0, 8)}...`}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {contract.user_id.substring(0, 8)}...
                        </div>
                        {!contract.user_profiles && (
                          <div className="text-xs text-red-500 font-medium">
                            ⚠️ Perfil não encontrado - Verificar user_profiles
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {contract.user_profiles?.full_name || 'Nome não cadastrado'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contract.user_profiles?.phone || 'Telefone não cadastrado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {getPlanDisplayName(contract.plan_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getBillingPeriodDisplayName(contract.billing_period)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {contract.leverage_multiplier}x
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(contract.contract_start).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      até {new Date(contract.contract_end).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      contract.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {contract.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {/* Toggle Status */}
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {contract.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                        <button
                          onClick={() => handleToggleContractStatus(contract.id, contract.is_active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            contract.is_active ? 'bg-green-600' : 'bg-gray-400'
                          }`}
                          title={contract.is_active ? 'Desativar contrato' : 'Ativar contrato'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              contract.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => {
                          setEditingContract(contract.id);
                          setEditForm(contract);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar contrato"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContract(contract.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir contrato"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      
                      {/* Cancel Contract Button */}
                      {contract.is_active && (
                        <button
                          onClick={() => handleCancelContract(contract.id)}
                          className="text-orange-600 hover:text-orange-800"
                          title="Cancelar contrato (para cálculo de churn)"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {contracts.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
              <h2 className="text-2xl font-bold text-gray-900">Novo Contrato</h2>
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
                    Buscar Usuário *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => {
                        if (!selectedUser) {
                          setShowUserDropdown(true);
                        }
                      }}
                      onBlur={(e) => {
                        // Delay hiding dropdown to allow clicks
                        setTimeout(() => {
                          if (!e.currentTarget.contains(document.activeElement)) {
                            setShowUserDropdown(false);
                          }
                        }, 200);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={selectedUser ? selectedUser.full_name || selectedUser.email : "Digite para buscar usuários..."}
                      required={!selectedUser}
                    />
                    
                    {selectedUser && (
                      <button
                        type="button"
                        onClick={clearUserSelection}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                    
                    {/* User Dropdown */}
                    {showUserDropdown && !selectedUser && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {/* Header com total de usuários */}
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">
                              {availableUsers.length} usuários disponíveis
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                console.log('🔄 Recarregando lista de usuários...');
                                fetchAvailableUsers();
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Atualizar Lista
                            </button>
                          </div>
                        </div>
                        
                        {(searchTerm.length > 0 ? filteredUsers : availableUsers).map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelectUser(user)}
                            onMouseDown={(e) => e.preventDefault()} // Prevent blur
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-medium text-sm">
                                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {user.full_name || 'Nome não cadastrado'}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                                {user.phone && (
                                  <div className="text-xs text-gray-500">{user.phone}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                        
                        {(searchTerm.length > 0 ? filteredUsers : availableUsers).length === 0 && (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-500">
                              {availableUsers.length === 0 
                                ? 'Nenhum usuário disponível no sistema'
                                : searchTerm.length > 0 
                                  ? `Nenhum usuário encontrado para "${searchTerm}"`
                                  : 'Digite para filtrar usuários...'
                              }
                            </p>
                            {availableUsers.length === 0 && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('🔄 Tentando sincronizar usuários...');
                                    fetchUsersFromAuth();
                                  }}
                                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                                >
                                  Carregar Usuários do Sistema
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedUser && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">
                            <strong>Usuário Selecionado:</strong> {selectedUser.full_name || 'Nome não cadastrado'}
                          </div>
                          <div className="text-xs text-blue-700">{selectedUser.email}</div>
                          {selectedUser.phone && (
                            <div className="text-xs text-blue-700">{selectedUser.phone}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Campos de Cliente Separados */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    Dados do Cliente
                  </h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email do Cliente *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedUser ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                    placeholder="cliente@email.com"
                    required
                    readOnly={!!selectedUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone do Cliente
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedUser ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                    placeholder="(11) 99999-9999"
                    readOnly={!!selectedUser}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo do Cliente *
                  </label>
                  <input
                    type="text"
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      selectedUser ? 'bg-gray-50 text-gray-600' : ''
                    }`}
                    placeholder="Nome completo do cliente"
                    required
                    readOnly={!!selectedUser}
                  />
                </div>

                {/* Separador */}
                <div className="md:col-span-2">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                    Detalhes do Contrato
                  </h4>
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
                    Multiplicador de Alavancagem *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newContract.leverage_multiplier}
                    onChange={(e) => setNewContract({...newContract, leverage_multiplier: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Início *
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
                    Data de Fim *
                  </label>
                  <input
                    type="date"
                    value={newContract.contract_end}
                    onChange={(e) => setNewContract({...newContract, contract_end: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                    required
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {newContract.billing_period === 'monthly' && 'Calculado automaticamente: +1 mês'}
                    {newContract.billing_period === 'semiannual' && 'Calculado automaticamente: +6 meses'}
                    {newContract.billing_period === 'annual' && 'Calculado automaticamente: +1 ano'}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Resumo do Contrato</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Cliente:</span>
                    <div className="text-blue-800">
                      <div>{userForm.full_name || 'Nome não informado'}</div>
                      <div className="text-xs text-blue-700">{userForm.email || 'Email não informado'}</div>
                      {userForm.phone && <div className="text-xs">{userForm.phone}</div>}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Plano:</span>
                    <div className="text-blue-800">{getPlanDisplayName(newContract.plan_type)}</div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Período:</span>
                    <div className="text-blue-800">
                      {newContract.contract_start} até {newContract.contract_end}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Valor:</span>
                    <div className="text-blue-800">
                      R$ {newContract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                      ({getBillingPeriodDisplayName(newContract.billing_period)})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!userForm.email || !userForm.full_name || !newContract.contract_start || !newContract.monthly_value}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Contrato
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    clearUserSelection();
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

      {/* Cancel Contract Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Cancelar Contrato</h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                  <p className="text-orange-800 text-sm">
                    Esta ação marcará o contrato como cancelado para cálculo de churn. 
                    O contrato permanecerá no histórico.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo do Cancelamento *
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmCancelContract}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Confirmar Cancelamento
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContractsPanel;