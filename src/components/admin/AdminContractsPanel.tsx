import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Edit2, Save, Ambulance as Cancel, UserX, Upload, FileText, ExternalLink } from 'lucide-react';

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
  created_at: string;
  updated_at: string;
  user_profiles?: {
    email: string;
    full_name: string;
    phone?: string;
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
  const [uploadingContract, setUploadingContract] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

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
                          <Cancel className="h-4 w-4" />
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
    </div>
  );
}