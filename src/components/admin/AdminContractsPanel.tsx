import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Save, X, Trash2, Building, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, Upload, ExternalLink, UserX, Ban, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Contract {
  id: string;
  user_id: string;
  plan_type: string;
  billing_period: string;
  monthly_value: number;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  leverage_multiplier: number;
  contract_file_url?: string;
  referral_partner_id?: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    email: string;
    full_name: string;
    phone?: string;
  };
  supplier_contracts?: {
    supplier_name: string;
    supplier_email: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  contracted_plan: string;
  plan_status: string;
}

interface SupplierContract {
  id: string;
  supplier_name: string;
  supplier_email: string;
  contract_type: string;
  is_active: boolean;
}

const AdminContractsPanel: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<SupplierContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contract>>({});
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Action states
  const [cancellingContract, setCancellingContract] = useState<Contract | null>(null);
  const [contractToRevoke, setContractToRevoke] = useState<Contract | null>(null);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  
  // File upload
  const [uploadingContract, setUploadingContract] = useState<string | null>(null);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // New contract form
  const [newContract, setNewContract] = useState({
    user_id: '',
    plan_type: 'bitcoin',
    billing_period: 'monthly',
    monthly_value: 300,
    leverage_multiplier: 1,
    referral_partner_id: '',
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: ''
  });

  // Initialize data on component mount
  useEffect(() => {
    initializeData();
  }, []);

  // Load users and suppliers when add modal opens
  useEffect(() => {
    if (showAddModal) {
      loadUsersAndSuppliers();
    }
  }, [showAddModal]);

  // Calculate contract end date when billing period or start date changes
  useEffect(() => {
    if (newContract.contract_start && newContract.billing_period) {
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
      
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setNewContract(prev => ({ ...prev, contract_end: formattedEndDate }));
    }
  }, [newContract.billing_period, newContract.contract_start]);

  // Update monthly value based on plan type
  useEffect(() => {
    const planPrices = {
      'bitcoin': 300,
      'mini-indice': 400,
      'mini-dolar': 550,
      'portfolio-completo': 750
    };
    
    const basePrice = planPrices[newContract.plan_type as keyof typeof planPrices] || 300;
    setNewContract(prev => ({ ...prev, monthly_value: basePrice }));
  }, [newContract.plan_type]);

  const initializeData = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchContracts();
    } catch (error: any) {
      console.error('Error initializing data:', error);
      setError('Erro ao carregar dados iniciais');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersAndSuppliers = async () => {
    await Promise.all([
      fetchAvailableUsers(),
      fetchAvailableSuppliers()
    ]);
  };

  const fetchContracts = async () => {
    try {
      console.log('🔍 Fetching contracts with user profiles...');
      
      const { data: contractsWithUsers, error } = await supabase
        .from('client_contracts')
        .select(`
          *,
          user_profiles (
            email,
            full_name,
            phone
          ),
          supplier_contracts (
            supplier_name,
            supplier_email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching contracts:', error);
        throw error;
      }
      
      console.log('✅ Contracts loaded:', contractsWithUsers?.length || 0);
      setContracts(contractsWithUsers || []);
      
      if (!contractsWithUsers || contractsWithUsers.length === 0) {
        console.log('ℹ️ No contracts found in database');
      }
      
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      setError(`Erro ao carregar contratos: ${error.message}`);
      setContracts([]);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      console.log('🔍 Fetching available users...');
      
      // First try to get users from user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, phone, is_active, contracted_plan, plan_status')
        .eq('is_active', true)
        .order('full_name');

      if (profilesError) {
        console.error('❌ Error fetching user profiles:', profilesError);
        
        // Fallback: try to get users via admin function
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
          const activeUsers = result.users.filter((user: any) => user.is_active !== false);
          setAvailableUsers(activeUsers);
          console.log('✅ Users loaded via admin function:', activeUsers.length);
        } else {
          throw new Error(result.error || 'Erro ao carregar usuários');
        }
      } else {
        console.log('✅ Users loaded from profiles:', profiles?.length || 0);
        setAvailableUsers(profiles || []);
      }

    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Erro ao carregar usuários: ${error.message}`);
      setAvailableUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAvailableSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      setError(null);
      
      console.log('🔍 Fetching available suppliers...');
      
      const { data, error } = await supabase
        .from('supplier_contracts')
        .select('id, supplier_name, supplier_email, contract_type, is_active')
        .eq('is_active', true)
        .order('supplier_name');

      if (error) {
        console.error('❌ Error fetching suppliers:', error);
        throw error;
      }
      
      console.log('✅ Suppliers loaded:', data?.length || 0);
      setAvailableSuppliers(data || []);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      setError(`Erro ao carregar fornecedores: ${error.message}`);
      setAvailableSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Validation
      if (!newContract.user_id) {
        throw new Error('Selecione um usuário para criar o contrato.');
      }
      
      if (!newContract.monthly_value || newContract.monthly_value <= 0) {
        throw new Error('Valor mensal deve ser maior que zero.');
      }
      
      if (!newContract.contract_start) {
        throw new Error('Data de início é obrigatória.');
      }

      console.log('📝 Creating new contract:', {
        user_id: newContract.user_id,
        plan_type: newContract.plan_type,
        monthly_value: newContract.monthly_value
      });

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
        user_id: newContract.user_id,
        plan_type: newContract.plan_type,
        billing_period: newContract.billing_period,
        monthly_value: newContract.monthly_value,
        leverage_multiplier: newContract.leverage_multiplier,
        contract_start: newContract.contract_start,
        contract_end: endDate.toISOString().split('T')[0],
        is_active: true,
        referral_partner_id: newContract.referral_partner_id || null
      };

      console.log('💾 Inserting contract data:', contractData);

      // Insert contract
      const { data: insertedContract, error: insertError } = await supabase
        .from('client_contracts')
        .insert(contractData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error inserting contract:', insertError);
        throw insertError;
      }

      console.log('✅ Contract created successfully:', insertedContract.id);

      // Update user profile with contracted plan
      const profileUpdateData = {
        contracted_plan: newContract.plan_type,
        plan_status: 'active',
        plan_start_date: newContract.contract_start,
        plan_end_date: endDate.toISOString().split('T')[0],
        current_leverage: newContract.leverage_multiplier,
        updated_at: new Date().toISOString()
      };

      console.log('👤 Updating user profile:', profileUpdateData);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update(profileUpdateData)
        .eq('id', newContract.user_id);

      if (updateError) {
        console.warn('⚠️ Warning updating user profile:', updateError);
        // Don't throw error here as contract was created successfully
      } else {
        console.log('✅ User profile updated successfully');
      }

      setSuccess('Contrato criado com sucesso!');
      setShowAddModal(false);
      
      // Reset form
      setNewContract({
        user_id: '',
        plan_type: 'bitcoin',
        billing_period: 'monthly',
        monthly_value: 300,
        leverage_multiplier: 1,
        referral_partner_id: '',
        contract_start: new Date().toISOString().split('T')[0],
        contract_end: ''
      });
      
      // Refresh contracts list
      await fetchContracts();
      
    } catch (error: any) {
      console.error('❌ Error creating contract:', error);
      setError(error.message || 'Erro ao criar contrato');
    }
  };

  const handleEdit = (contract: Contract) => {
    console.log('✏️ Editing contract:', contract.id);
    setEditingId(contract.id);
    setEditForm({
      plan_type: contract.plan_type,
      billing_period: contract.billing_period,
      monthly_value: contract.monthly_value,
      leverage_multiplier: contract.leverage_multiplier,
      contract_start: contract.contract_start,
      contract_end: contract.contract_end,
      referral_partner_id: contract.referral_partner_id
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      setError(null);
      
      console.log('💾 Saving contract edit:', editingId);
      
      const updateData = {
        ...editForm,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('client_contracts')
        .update(updateData)
        .eq('id', editingId);

      if (error) {
        console.error('❌ Error updating contract:', error);
        throw error;
      }

      console.log('✅ Contract updated successfully');

      // If plan type or leverage changed, update user profile
      if (editForm.plan_type || editForm.leverage_multiplier) {
        const contract = contracts.find(c => c.id === editingId);
        if (contract) {
          const profileUpdateData: any = {
            updated_at: new Date().toISOString()
          };
          
          if (editForm.plan_type) {
            profileUpdateData.contracted_plan = editForm.plan_type;
          }
          
          if (editForm.leverage_multiplier) {
            profileUpdateData.current_leverage = editForm.leverage_multiplier;
          }

          const { error: profileError } = await supabase
            .from('user_profiles')
            .update(profileUpdateData)
            .eq('id', contract.user_id);

          if (profileError) {
            console.warn('⚠️ Warning updating user profile:', profileError);
          }
        }
      }

      setSuccess('Contrato atualizado com sucesso!');
      setEditingId(null);
      setEditForm({});
      await fetchContracts();
      
    } catch (error: any) {
      console.error('Error updating contract:', error);
      setError(error.message || 'Erro ao atualizar contrato');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
    setError(null);
    setSuccess(null);
  };

  const handleCancelContract = (contract: Contract) => {
    setCancellingContract(contract);
    setShowCancelModal(true);
  };

  const confirmCancelContract = async () => {
    if (!cancellingContract || !cancelReason.trim()) {
      setError('Motivo do cancelamento é obrigatório');
      return;
    }

    try {
      setError(null);
      
      console.log('🚫 Cancelling contract:', cancellingContract.id);

      const { error } = await supabase
        .from('client_contracts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', cancellingContract.id);

      if (error) throw error;

      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          plan_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', cancellingContract.user_id);

      if (profileError) {
        console.warn('Warning updating user profile:', profileError);
      }

      console.log('✅ Contract cancelled successfully');
      setSuccess('Contrato cancelado com sucesso!');
      setShowCancelModal(false);
      setCancellingContract(null);
      setCancelReason('');
      await fetchContracts();
      
    } catch (error: any) {
      console.error('Error cancelling contract:', error);
      setError(error.message || 'Erro ao cancelar contrato');
    }
  };

  const handleRevokeContract = async () => {
    if (!contractToRevoke || !revokeReason.trim()) {
      setError('Motivo da revogação é obrigatório');
      return;
    }

    try {
      setError(null);
      
      console.log('⚠️ Revoking contract:', contractToRevoke.id);

      const { error } = await supabase
        .from('client_contracts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractToRevoke.id);

      if (error) throw error;

      // Reset user profile to default state
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          contracted_plan: 'none',
          plan_status: 'inactive',
          current_leverage: 1,
          plan_start_date: null,
          plan_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractToRevoke.user_id);

      if (updateError) {
        console.warn('Warning updating user profile:', updateError);
      }

      console.log('✅ Contract revoked successfully');
      setSuccess('Contrato revogado com sucesso!');
      setShowRevokeModal(false);
      setContractToRevoke(null);
      setRevokeReason('');
      await fetchContracts();
      
    } catch (error: any) {
      console.error('Error revoking contract:', error);
      setError(error.message || 'Erro ao revogar contrato');
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;

    try {
      setError(null);
      
      console.log('🗑️ Deleting contract permanently:', contractToDelete.id);

      // Delete contract file if exists
      if (contractToDelete.contract_file_url) {
        try {
          const url = new URL(contractToDelete.contract_file_url);
          const filePath = url.pathname.split('/').pop();
          
          if (filePath) {
            await supabase.storage
              .from('client-contracts')
              .remove([`client-contracts/${filePath}`]);
          }
        } catch (fileError) {
          console.warn('Warning deleting contract file:', fileError);
        }
      }

      // Delete contract from database
      const { error } = await supabase
        .from('client_contracts')
        .delete()
        .eq('id', contractToDelete.id);

      if (error) throw error;

      // Reset user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          contracted_plan: 'none',
          plan_status: 'inactive',
          current_leverage: 1,
          plan_start_date: null,
          plan_end_date: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractToDelete.user_id);

      if (updateError) {
        console.warn('Warning updating user profile:', updateError);
      }

      console.log('✅ Contract deleted permanently');
      setSuccess('Contrato excluído permanentemente!');
      setShowDeleteModal(false);
      setContractToDelete(null);
      await fetchContracts();
      
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      setError(error.message || 'Erro ao excluir contrato');
    }
  };

  const handleFileUpload = (contractId: string) => {
    const fileInput = fileInputRefs.current[contractId];
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, contractId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Apenas arquivos PDF são permitidos');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB permitido');
      return;
    }

    try {
      setUploadingContract(contractId);
      setError(null);

      console.log('📤 Uploading contract file for:', contractId);

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileName = `client-contracts/${timestamp}-${randomString}.pdf`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('client-contracts')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-contracts')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao obter URL do arquivo');
      }

      // Update contract with file URL
      const { error: updateError } = await supabase
        .from('client_contracts')
        .update({ 
          contract_file_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) {
        // If database update fails, try to delete the uploaded file
        await supabase.storage.from('client-contracts').remove([fileName]);
        throw updateError;
      }

      console.log('✅ Contract file uploaded successfully');
      setSuccess('Contrato anexado com sucesso!');
      await fetchContracts();

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploadingContract(null);
      // Reset file input
      if (fileInputRefs.current[contractId]) {
        fileInputRefs.current[contractId]!.value = '';
      }
    }
  };

  const handleDeleteContractFile = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir o arquivo do contrato?')) return;

    try {
      setError(null);
      
      const contract = contracts.find(c => c.id === contractId);
      if (!contract?.contract_file_url) {
        setError('Nenhum arquivo encontrado para excluir');
        return;
      }

      console.log('🗑️ Deleting contract file for:', contractId);

      // Extract file path from URL
      const url = new URL(contract.contract_file_url);
      const filePath = url.pathname.split('/').pop();
      
      if (filePath) {
        // Delete file from storage
        const { error: deleteError } = await supabase.storage
          .from('client-contracts')
          .remove([`client-contracts/${filePath}`]);

        if (deleteError) {
          console.warn('Warning deleting file:', deleteError);
        }
      }

      // Update contract to remove file URL
      const { error: updateError } = await supabase
        .from('client_contracts')
        .update({ 
          contract_file_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (updateError) throw updateError;

      console.log('✅ Contract file deleted successfully');
      setSuccess('Arquivo do contrato excluído com sucesso!');
      await fetchContracts();
      
    } catch (error: any) {
      console.error('Delete file error:', error);
      setError(error.message || 'Erro ao excluir arquivo do contrato');
    }
  };

  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPlanTypeLabel = (planType: string) => {
    const labels: { [key: string]: string } = {
      'bitcoin': 'Bitcoin',
      'mini-indice': 'Mini Índice',
      'mini-dolar': 'Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return labels[planType] || planType;
  };

  const getBillingPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      'monthly': 'Mensal',
      'semiannual': 'Semestral',
      'annual': 'Anual'
    };
    return labels[period] || period;
  };

  // Calculate metrics
  const activeContracts = contracts.filter(c => c.is_active);
  const cancelledContracts = contracts.filter(c => !c.is_active);
  const totalContracts = contracts.length;
  const churnRate = totalContracts > 0 ? (cancelledContracts.length / totalContracts) * 100 : 0;

  // Monthly churn (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCancellations = cancelledContracts.filter(c => 
    new Date(c.updated_at) >= thirtyDaysAgo
  );
  const monthlyChurnRate = totalContracts > 0 ? (recentCancellations.length / totalContracts) * 100 : 0;

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
          <Building className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contratos de Clientes</h2>
            <p className="text-gray-600">Gestão completa de contratos e planos dos clientes</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar Contrato
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Contratos Ativos</h3>
          <p className="text-2xl font-bold text-green-600">{activeContracts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Contratos Cancelados</h3>
          <p className="text-2xl font-bold text-red-600">{cancelledContracts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Taxa de Churn Total</h3>
          <p className="text-2xl font-bold text-red-600">{churnRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Churn Mensal (30d)</h3>
          <p className="text-2xl font-bold text-orange-600">{monthlyChurnRate.toFixed(1)}%</p>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Contratos</h3>
          <p className="text-sm text-gray-600">
            {contracts.length > 0 
              ? `${contracts.length} contratos encontrados (${activeContracts.length} ativos, ${cancelledContracts.length} cancelados)`
              : 'Nenhum contrato encontrado'
            }
          </p>
        </div>
        
        {contracts.length === 0 ? (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum contrato encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro contrato de cliente</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Contrato
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome do Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alavancagem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contrato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {contract.user_profiles?.email || 'Email não encontrado'}
                        </div>
                        <div className="text-gray-500 text-xs">
                          ID: {contract.user_id.substring(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {contract.user_profiles?.full_name || 'Nome não cadastrado'}
                        </div>
                        {contract.user_profiles?.phone && (
                          <div className="text-gray-500 text-xs">
                            {contract.user_profiles.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === contract.id ? (
                        <select
                          value={editForm.plan_type || ''}
                          onChange={(e) => setEditForm({ ...editForm, plan_type: e.target.value })}
                          className="text-sm border rounded px-2 py-1"
                        >
                          <option value="bitcoin">Bitcoin</option>
                          <option value="mini-indice">Mini Índice</option>
                          <option value="mini-dolar">Mini Dólar</option>
                          <option value="portfolio-completo">Portfólio Completo</option>
                        </select>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getPlanTypeLabel(contract.plan_type)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === contract.id ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editForm.monthly_value || ''}
                          onChange={(e) => setEditForm({ ...editForm, monthly_value: parseFloat(e.target.value) })}
                          className="text-sm border rounded px-2 py-1 w-24"
                        />
                      ) : (
                        <div>
                          <div className="font-medium">{formatCurrency(contract.monthly_value)}</div>
                          <div className="text-gray-500 text-xs">{getBillingPeriodLabel(contract.billing_period)}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === contract.id ? (
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editForm.leverage_multiplier || ''}
                          onChange={(e) => setEditForm({ ...editForm, leverage_multiplier: parseInt(e.target.value) })}
                          className="text-sm border rounded px-2 py-1 w-16"
                        />
                      ) : (
                        <span className="font-medium">{contract.leverage_multiplier}x</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{formatDate(contract.contract_start)}</div>
                        <div className="text-gray-500">até {formatDate(contract.contract_end)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        contract.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.is_active ? 'Ativo' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {contract.contract_file_url ? (
                          <>
                            <a
                              href={contract.contract_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                            >
                              <FileText className="h-4 w-4" />
                              Ver PDF
                            </a>
                            <button
                              onClick={() => handleDeleteContractFile(contract.id)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title="Excluir arquivo do contrato"
                            >
                              Excluir
                            </button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">Não anexado</span>
                        )}
                        
                        <button
                          onClick={() => handleFileUpload(contract.id)}
                          disabled={uploadingContract === contract.id}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                          title="Anexar contrato"
                        >
                          {uploadingContract === contract.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              <span>Anexar PDF</span>
                            </>
                          )}
                        </button>
                        
                        <input
                          ref={(el) => fileInputRefs.current[contract.id] = el}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleFileChange(e, contract.id)}
                          className="hidden"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {editingId === contract.id ? (
                          <>
                            <button
                              onClick={handleSave}
                              className="text-green-600 hover:text-green-900"
                              title="Salvar alterações"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-gray-600 hover:text-gray-900"
                              title="Cancelar edição"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(contract)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar contrato"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {contract.is_active && (
                              <button
                                onClick={() => handleCancelContract(contract)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Cancelar contrato"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setContractToRevoke(contract);
                                setShowRevokeModal(true);
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="Revogar contrato (desativar mas manter histórico)"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setContractToDelete(contract);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Excluir contrato permanentemente"
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
        )}
      </div>

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Criar Novo Contrato</h2>
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
                    Selecionar Cliente *
                  </label>
                  {loadingUsers && (
                    <div className="text-sm text-blue-600 mb-2">
                      Carregando usuários...
                    </div>
                  )}
                  <select
                    value={newContract.user_id}
                    onChange={(e) => setNewContract({...newContract, user_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingUsers}
                    required
                  >
                    <option value="">
                      {loadingUsers ? 'Carregando usuários...' : 'Selecione um usuário'}
                    </option>
                    {loadingUsers ? (
                      <option disabled>Aguarde...</option>
                    ) : (
                      availableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.full_name || user.email} ({user.email})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableUsers.length > 0 
                      ? `${availableUsers.length} usuários disponíveis` 
                      : 'Nenhum usuário encontrado. Verifique se há usuários cadastrados.'
                    }
                  </p>
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
                    <option value="bitcoin">Bitcoin (R$ 300)</option>
                    <option value="mini-indice">Mini Índice (R$ 400)</option>
                    <option value="mini-dolar">Mini Dólar (R$ 550)</option>
                    <option value="portfolio-completo">Portfólio Completo (R$ 750)</option>
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
                    Parceiro de Indicação (Opcional)
                  </label>
                  {loadingSuppliers && (
                    <div className="text-sm text-blue-600 mb-2">
                      Carregando fornecedores...
                    </div>
                  )}
                  <select
                    value={newContract.referral_partner_id}
                    onChange={(e) => setNewContract({...newContract, referral_partner_id: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loadingSuppliers}
                  >
                    <option value="">
                      {loadingSuppliers ? 'Carregando fornecedores...' : 'Nenhum parceiro (indicação direta)'}
                    </option>
                    {availableSuppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name} ({supplier.supplier_email}) - {supplier.contract_type}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableSuppliers.length > 0 
                      ? `${availableSuppliers.length} parceiros disponíveis` 
                      : 'Nenhum fornecedor ativo encontrado'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Fim do Contrato (calculado automaticamente)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={newContract.contract_end}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-blue-50 text-gray-700"
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Data calculada automaticamente: {
                      newContract.billing_period === 'semiannual' ? '+6 meses' : 
                      newContract.billing_period === 'annual' ? '+1 ano' : '+1 mês'
                    } da data de início
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Resumo do Contrato</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Plano:</strong> {getPlanTypeLabel(newContract.plan_type)}</p>
                  <p>• <strong>Valor:</strong> {formatCurrency(newContract.monthly_value)} ({getBillingPeriodLabel(newContract.billing_period)})</p>
                  <p>• <strong>Alavancagem:</strong> {newContract.leverage_multiplier}x</p>
                  <p>• <strong>Período:</strong> {formatDate(newContract.contract_start)} até {formatDate(newContract.contract_end)}</p>
                  {newContract.referral_partner_id && (
                    <p>• <strong>Parceiro:</strong> {availableSuppliers.find(s => s.id === newContract.referral_partner_id)?.supplier_name}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={!newContract.user_id || loadingUsers}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Criar Contrato
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
      {showCancelModal && cancellingContract && (
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
                  <UserX className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-orange-800 text-sm font-medium">
                      Cancelar contrato de {cancellingContract.user_profiles?.full_name || cancellingContract.user_profiles?.email}
                    </p>
                    <p className="text-orange-700 text-xs">
                      O contrato será marcado como cancelado
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo do Cancelamento *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmCancelContract}
                  disabled={!cancelReason.trim()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Revoke Contract Modal */}
      {showRevokeModal && contractToRevoke && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Revogar Contrato</h2>
              <button
                onClick={() => setShowRevokeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Ban className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-orange-800 text-sm font-medium">
                      Revogar contrato de {contractToRevoke.user_profiles?.full_name || contractToRevoke.user_profiles?.email}
                    </p>
                    <p className="text-orange-700 text-xs">
                      O contrato será desativado mas mantido no histórico
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo da Revogação *
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descreva o motivo da revogação..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRevokeContract}
                  disabled={!revokeReason.trim()}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Revogação
                </button>
                <button
                  onClick={() => setShowRevokeModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contract Modal */}
      {showDeleteModal && contractToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Excluir Contrato</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Trash2 className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-red-800 text-sm font-medium">
                      Excluir permanentemente o contrato de {contractToDelete.user_profiles?.full_name || contractToDelete.user_profiles?.email}
                    </p>
                    <p className="text-red-700 text-xs">
                      ⚠️ Esta ação não pode ser desfeita! O contrato será removido completamente.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Consequências da Exclusão:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Contrato será removido permanentemente do banco de dados</li>
                  <li>• Plano do usuário será resetado para "none"</li>
                  <li>• Alavancagem será resetada para 1x</li>
                  <li>• Histórico de pagamentos será perdido</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteContract}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Confirmar Exclusão
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
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