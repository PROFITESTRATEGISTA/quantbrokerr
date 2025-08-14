import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Trash2, Building, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, Upload, ExternalLink, UserX, Ban, Ambulance as Cancel } from 'lucide-react';
import { Plus, Edit3, Save, X, Trash2, Building, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, Upload, ExternalLink, UserX, Ban, Edit2 } from 'lucide-react';
                            setContractToDelete(contract);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir contrato permanentemente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

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

export default function AdminContractsPanel() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Contract>>({});
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingContract, setCancellingContract] = useState<Contract | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [contractToRevoke, setContractToRevoke] = useState<Contract | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [uploadingContract, setUploadingContract] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContract, setNewContract] = useState({
    user_id: '',
    plan_type: 'bitcoin',
    billing_period: 'monthly',
    monthly_value: 0,
    leverage_multiplier: 1,
    referral_partner_id: '',
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: ''
  });
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Load users when modal opens
  useEffect(() => {
    if (showAddModal) {
      fetchAvailableUsers();
      fetchAvailableSuppliers();
    }
  }, [showAddModal]);

  // Calculate contract end date based on billing period
  useEffect(() => {
    if (newContract.contract_start) {
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      if (newContract.billing_period === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (newContract.billing_period === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        // Monthly - set to 1 month
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setNewContract(prev => ({ ...prev, contract_end: formattedEndDate }));
    }
  }, [newContract.billing_period, newContract.contract_start]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchAvailableUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      
      console.log('✅ Users loaded:', data?.length || 0);
      setAvailableUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAvailableSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('supplier_contracts')
        .select('id, supplier_name, supplier_email, contract_type')
        .eq('is_active', true)
        .order('supplier_name');

      if (error) throw error;
      
      console.log('✅ Suppliers loaded:', data?.length || 0);
      setAvailableSuppliers(data || []);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      setError(`Erro ao carregar fornecedores: ${error.message}`);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const handleFileUpload = async (contractId: string, file: File) => {
    try {
      setUploadingContract(contractId);
      setError(null);

      // Validate file type
      if (file.type !== 'application/pdf') {
        throw new Error('Apenas arquivos PDF são permitidos');
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Máximo 10MB permitido');
      }

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
        .update({ contract_file_url: urlData.publicUrl })
        .eq('id', contractId);

      if (updateError) {
        // If database update fails, try to delete the uploaded file
        await supabase.storage.from('client-contracts').remove([fileName]);
        throw updateError;
      }

      setSuccess('Contrato anexado com sucesso!');
      fetchContracts();

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploadingContract(null);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      if (!newContract.user_id) {
        throw new Error('Selecione um usuário para criar o contrato.');
      }

      // Calculate contract end date
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      if (newContract.billing_period === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (newContract.billing_period === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        // Monthly - set to 1 month
        endDate.setMonth(endDate.getMonth() + 1);
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

      const { error: insertError } = await supabase
        .from('client_contracts')
        .insert(contractData);

      if (insertError) throw insertError;

      // Update user profile with contracted plan
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          contracted_plan: newContract.plan_type,
          plan_status: 'active',
          plan_start_date: newContract.contract_start,
          plan_end_date: endDate.toISOString().split('T')[0],
          current_leverage: newContract.leverage_multiplier
        })
        .eq('id', newContract.user_id);

      if (updateError) {
        console.warn('Warning updating user profile:', updateError);
      }

      setSuccess('Contrato criado com sucesso!');
      setShowAddModal(false);
      setNewContract({
        user_id: '',
        plan_type: 'bitcoin',
        billing_period: 'monthly',
        monthly_value: 0,
        leverage_multiplier: 1,
        referral_partner_id: '',
        contract_start: new Date().toISOString().split('T')[0],
        contract_end: ''
      });
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteContractFile = async (contractId: string) => {
    if (!confirm('Tem certeza que deseja excluir o arquivo do contrato?')) return;

    try {
      setError(null);
      
      // Get contract to find file URL
      const contract = contracts.find(c => c.id === contractId);
      if (!contract?.contract_file_url) {
        setError('Nenhum arquivo encontrado para excluir');
        return;
      }

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
        .update({ contract_file_url: null })
        .eq('id', contractId);

      if (updateError) throw updateError;

      setSuccess('Arquivo do contrato excluído com sucesso!');
      fetchContracts();
    } catch (error: any) {
      console.error('Delete file error:', error);
      setError(error.message || 'Erro ao excluir arquivo do contrato');
    }
  };

  const fetchContracts = async () => {
    try {
      const { data: contractsWithUsers, error } = await supabase
        .from('client_contracts')
        .select(`
          *,
          user_profiles (
            email,
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(contractsWithUsers || []);
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingId(contract.id);
    setEditForm(contract);
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('client_contracts')
        .update(editForm)
        .eq('id', editingId);

      if (error) throw error;

      await fetchContracts();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Erro ao atualizar contrato:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleCancelContract = (contract: Contract) => {
    setCancellingContract(contract);
    setShowCancelModal(true);
  };

  const confirmCancelContract = async () => {
    if (!cancellingContract || !cancelReason.trim()) return;

    try {
      const { error } = await supabase
        .from('client_contracts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', cancellingContract.id);

      if (error) throw error;

      await fetchContracts();
      setShowCancelModal(false);
      setCancellingContract(null);
      setCancelReason('');
    } catch (error) {
      console.error('Erro ao cancelar contrato:', error);
    }
  };

  const handleRevokeContract = async () => {
    if (!contractToRevoke || !revokeReason.trim()) return;

    try {
      const { error } = await supabase
        .from('client_contracts')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', contractToRevoke.id);

      if (error) throw error;

      await fetchContracts();
      setShowRevokeModal(false);
      setContractToRevoke(null);
      setRevokeReason('');
    } catch (error) {
      console.error('Erro ao revogar contrato:', error);
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;

    try {
      const { error } = await supabase
        .from('client_contracts')
        .delete()
        .eq('id', contractToDelete.id);

      if (error) throw error;

      await fetchContracts();
      setShowDeleteModal(false);
      setContractToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir contrato:', error);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeContracts = contracts.filter(c => c.is_active);
  const cancelledContracts = contracts.filter(c => !c.is_active);
  const totalContracts = contracts.length;
  const churnRate = totalContracts > 0 ? (cancelledContracts.length / totalContracts) * 100 : 0;

  // Churn mensal (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCancellations = cancelledContracts.filter(c => 
    new Date(c.updated_at) >= thirtyDaysAgo
  );
  const monthlyChurnRate = totalContracts > 0 ? (recentCancellations.length / totalContracts) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Métricas de Churn */}
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

      {/* Alerts */}
      {/* Botão Criar Contrato */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar Contrato
        </button>
      </div>

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

      {/* Tabela de Contratos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contratos de Clientes</h2>
        </div>
        
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
                      
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(contract.id, file);
                            }
                          }}
                          className="hidden"
                        />
                        <div className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
                          {uploadingContract === contract.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              <span>Anexar PDF</span>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {editingId === contract.id ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(contract)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {contract.is_active && (
                          <button
                            onClick={() => handleCancelContract(contract)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cancelamento */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cancelar Contrato</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar o contrato de{' '}
              <strong>{cancellingContract?.user_profiles?.full_name || 'usuário'}</strong>?
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo do cancelamento *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                rows={3}
                placeholder="Descreva o motivo do cancelamento..."
                required
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCancelContract}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Revogação */}
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
                      Revogar contrato de {contractToRevoke.user_profiles?.full_name}
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

      {/* Modal de Exclusão */}
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
                      Excluir permanentemente o contrato de {contractToDelete.user_profiles?.full_name}
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
                          {user.full_name || 'Nome não informado'} ({user.email}) - ID: {user.id.substring(0, 8)}...
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableUsers.length > 0 
                      ? `${availableUsers.length} usuários disponíveis` 
                      : 'Nenhum usuário encontrado'
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
                    Data de Fim do Contrato
                    {newContract.billing_period === 'monthly' 
                      ? ' (calculado automaticamente)' 
                      : ' (calculado automaticamente) *'
                    }
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
                    Data calculada automaticamente: {newContract.billing_period === 'semiannual' ? '+6 meses' : newContract.billing_period === 'annual' ? '+1 ano' : '+1 mês'} da data de início
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Informações do Contrato</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• O contrato será criado para o usuário com o email informado</p>
                  <p>• A data de fim será calculada automaticamente baseada no período</p>
                  <p>• O perfil do usuário será atualizado com o plano contratado</p>
                  <p>• A alavancagem será aplicada automaticamente</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
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
    </div>
  );
}