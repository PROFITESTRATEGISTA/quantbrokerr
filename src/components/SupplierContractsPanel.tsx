import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Save, X, Trash2, Building, Calendar, DollarSign, FileText, AlertCircle, CheckCircle, Upload, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupplierContract {
  id: string;
  supplier_name: string;
  supplier_email: string;
  supplier_phone: string;
  contract_type: string;
  service_description: string;
  monthly_value: number;
  contract_start: string;
  contract_end: string | null;
  payment_frequency: string;
  contract_file_url: string | null;
  is_active: boolean;
  auto_renewal: boolean;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

const SupplierContractsPanel: React.FC = () => {
  const [contracts, setContracts] = useState<SupplierContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContract, setEditingContract] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [contractToCancel, setContractToCancel] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [uploading, setUploading] = useState(false);

  const [newContract, setNewContract] = useState({
    supplier_name: '',
    supplier_email: '',
    supplier_phone: '',
    contract_type: 'tecnologia',
    service_description: '',
    monthly_value: 0,
    contract_start: new Date().toISOString().split('T')[0],
    contract_end: '',
    payment_frequency: 'monthly',
    auto_renewal: false,
    contract_file: null as File | null
  });

  // Limpar data de fim quando mudar para mensal ou trimestral
  useEffect(() => {
    if (newContract.payment_frequency === 'monthly' || newContract.payment_frequency === 'quarterly') {
      setNewContract(prev => ({ ...prev, contract_end: '' }));
    } else if (newContract.contract_start && (newContract.payment_frequency === 'semiannual' || newContract.payment_frequency === 'annual')) {
      // Calcular automaticamente a data de fim baseada na modalidade
      const startDate = new Date(newContract.contract_start);
      let endDate = new Date(startDate);
      
      if (newContract.payment_frequency === 'semiannual') {
        endDate.setMonth(endDate.getMonth() + 6);
      } else if (newContract.payment_frequency === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      const formattedEndDate = endDate.toISOString().split('T')[0];
      setNewContract(prev => ({ ...prev, contract_end: formattedEndDate }));
    }
  }, [newContract.payment_frequency, newContract.contract_start]);

  const [editForm, setEditForm] = useState<Partial<SupplierContract>>({});

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplier_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadContractFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `supplier-contracts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      let contractFileUrl = null;
      if (newContract.contract_file) {
        contractFileUrl = await uploadContractFile(newContract.contract_file);
        if (!contractFileUrl) {
          throw new Error('Erro ao fazer upload do arquivo');
        }
      }

      const contractData = {
        supplier_name: newContract.supplier_name,
        supplier_email: newContract.supplier_email,
        supplier_phone: newContract.supplier_phone,
        contract_type: newContract.contract_type,
        service_description: newContract.service_description,
        monthly_value: newContract.monthly_value,
        contract_start: newContract.contract_start,
        contract_end: newContract.contract_end || null,
        payment_frequency: newContract.payment_frequency,
        auto_renewal: newContract.auto_renewal,
        contract_file_url: contractFileUrl,
        is_active: true
      };

      const { error } = await supabase
        .from('supplier_contracts')
        .insert(contractData);

      if (error) throw error;

      setSuccess('Contrato de fornecedor adicionado com sucesso!');
      setShowAddModal(false);
      setNewContract({
        supplier_name: '',
        supplier_email: '',
        supplier_phone: '',
        contract_type: 'tecnologia',
        service_description: '',
        monthly_value: 0,
        contract_start: new Date().toISOString().split('T')[0],
        contract_end: '',
        payment_frequency: 'monthly',
        auto_renewal: false,
        contract_file: null
      });
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleCancelContract = async () => {
    if (!contractToCancel || !cancellationReason.trim()) {
      setError('Motivo do cancelamento é obrigatório');
      return;
    }

    try {
      const { error } = await supabase
        .from('supplier_contracts')
        .update({
          is_active: false,
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', contractToCancel);

      if (error) throw error;

      setSuccess('Contrato cancelado com sucesso!');
      setShowCancelModal(false);
      setContractToCancel(null);
      setCancellationReason('');
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleReactivateContract = async (contractId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_contracts')
        .update({
          is_active: true,
          cancellation_reason: null,
          cancelled_at: null
        })
        .eq('id', contractId);

      if (error) throw error;

      setSuccess('Contrato reativado com sucesso!');
      fetchContracts();
    } catch (error: any) {
      setError(error.message);
    }
  };
  const getContractTypeDisplayName = (type: string) => {
    const types = {
      'tecnologia': 'Tecnologia',
      'marketing': 'Marketing',
      'operacional': 'Operacional',
      'juridico': 'Jurídico',
      'contabil': 'Contábil',
      'consultoria': 'Consultoria',
      'infraestrutura': 'Infraestrutura',
      'outros': 'Outros'
    };
    return types[type as keyof typeof types] || type;
  };

  const getPaymentFrequencyDisplayName = (frequency: string) => {
    const frequencies = {
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'semiannual': 'Semestral',
      'annual': 'Anual'
    };
    return frequencies[frequency as keyof typeof frequencies] || frequency;
  };

  // Calcular estatísticas
  const activeContracts = contracts.filter(c => c.is_active);
  const cancelledContracts = contracts.filter(c => !c.is_active);
  const totalMonthlyExpenses = activeContracts.reduce((sum, c) => sum + c.monthly_value, 0);
  const totalAnnualExpenses = totalMonthlyExpenses * 12;
  const cancellationRate = contracts.length > 0 ? (cancelledContracts.length / contracts.length) * 100 : 0;

  // Distribuição por tipo
  const contractsByType = activeContracts.reduce((acc, contract) => {
    acc[contract.contract_type] = (acc[contract.contract_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Distribuição por valor
  const expensesByType = activeContracts.reduce((acc, contract) => {
    acc[contract.contract_type] = (acc[contract.contract_type] || 0) + contract.monthly_value;
    return acc;
  }, {} as Record<string, number>);

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
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building className="h-12 w-12 text-purple-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Contratos de Fornecedores</h1>
                <p className="text-gray-600">Gestão completa de contratos e fornecedores</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Contrato de Fornecedor
            </button>
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

        {/* Dashboard de Fornecedores */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Fornecedores Ativos</p>
                <p className="text-2xl font-bold text-purple-600">{activeContracts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gasto Mensal</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalMonthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gasto Anual</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {totalAnnualExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa Cancelamento</p>
                <p className="text-2xl font-bold text-red-600">{cancellationRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Distribuição por Categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contratos por Categoria</h3>
            <div className="space-y-3">
              {Object.entries(contractsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-700">{getContractTypeDisplayName(type)}</span>
                  <span className="font-semibold text-purple-600">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos por Categoria</h3>
            <div className="space-y-3">
              {Object.entries(expensesByType).map(([type, amount]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-gray-700">{getContractTypeDisplayName(type)}</span>
                  <span className="font-semibold text-green-600">
                    R$ {amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela de Contratos */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contratos de Fornecedores</h2>
            <p className="text-sm text-gray-600">Gerencie todos os contratos com fornecedores e prestadores de serviços</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
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
                        <div className="text-sm font-medium text-gray-900">{contract.supplier_name}</div>
                        <div className="text-sm text-gray-500">{contract.supplier_email}</div>
                        <div className="text-sm text-gray-500">{contract.supplier_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getContractTypeDisplayName(contract.contract_type)}
                        </div>
                        <div className="text-sm text-gray-500 max-w-[200px] truncate">
                          {contract.service_description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        R$ {contract.monthly_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getPaymentFrequencyDisplayName(contract.payment_frequency)}
                      </div>
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
                      {contract.auto_renewal && (
                        <div className="text-xs text-blue-600">Renovação automática</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contract.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.is_active ? 'Ativo' : 'Cancelado'}
                      </span>
                      {!contract.is_active && contract.cancelled_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(contract.cancelled_at).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.contract_file_url ? (
                        <a
                          href={contract.contract_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <FileText className="h-4 w-4" />
                          Ver Contrato
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">Sem arquivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {/* Switch para cancelar/ativar contrato */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {contract.is_active ? 'Ativo' : 'Cancelado'}
                          </span>
                          <button
                            onClick={() => {
                              if (contract.is_active) {
                                setContractToCancel(contract.id);
                                setShowCancelModal(true);
                              } else {
                                // Reativar contrato
                                handleReactivateContract(contract.id);
                              }
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              contract.is_active ? 'bg-green-600' : 'bg-gray-400'
                            }`}
                            title={contract.is_active ? 'Cancelar contrato' : 'Reativar contrato'}
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
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este contrato?')) {
                              // Implementar exclusão se necessário
                            }
                          }}
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

          {contracts.length === 0 && (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum contrato encontrado</h3>
              <p className="text-gray-600 mb-4">Comece adicionando seu primeiro contrato de fornecedor</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Primeiro Contrato
              </button>
            </div>
          )}
        </div>

        {/* Modal de Adicionar Contrato */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Novo Contrato de Fornecedor</h2>
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
                      Nome do Fornecedor *
                    </label>
                    <input
                      type="text"
                      value={newContract.supplier_name}
                      onChange={(e) => setNewContract({...newContract, supplier_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Nome da empresa ou pessoa"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email do Fornecedor *
                    </label>
                    <input
                      type="email"
                      value={newContract.supplier_email}
                      onChange={(e) => setNewContract({...newContract, supplier_email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="contato@fornecedor.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone do Fornecedor
                    </label>
                    <input
                      type="tel"
                      value={newContract.supplier_phone}
                      onChange={(e) => setNewContract({...newContract, supplier_phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Contrato *
                    </label>
                    <select
                      value={newContract.contract_type}
                      onChange={(e) => setNewContract({...newContract, contract_type: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="tecnologia">Tecnologia</option>
                      <option value="marketing">Marketing</option>
                      <option value="operacional">Operacional</option>
                      <option value="juridico">Jurídico</option>
                      <option value="contabil">Contábil</option>
                      <option value="consultoria">Consultoria</option>
                      <option value="infraestrutura">Infraestrutura</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Serviço *
                    </label>
                    <textarea
                      value={newContract.service_description}
                      onChange={(e) => setNewContract({...newContract, service_description: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Descreva os serviços prestados pelo fornecedor"
                      rows={3}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência de Pagamento *
                    </label>
                    <select
                      value={newContract.payment_frequency}
                      onChange={(e) => setNewContract({...newContract, payment_frequency: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="semiannual">Semestral</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Início do Contrato *
                    </label>
                    <input
                      type="date"
                      value={newContract.contract_start}
                      onChange={(e) => setNewContract({...newContract, contract_start: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fim do Contrato
                      {(newContract.payment_frequency === 'monthly' || newContract.payment_frequency === 'quarterly') 
                        ? ' (calculado automaticamente)' 
                        : ' (calculado automaticamente) *'
                      }
                    </label>
                    {(newContract.payment_frequency === 'monthly' || newContract.payment_frequency === 'quarterly') ? (
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 text-center">
                        Sem prazo definido - Renovação {newContract.payment_frequency === 'monthly' ? 'mensal' : 'trimestral'}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="date"
                          value={newContract.contract_end}
                          onChange={(e) => setNewContract({...newContract, contract_end: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-blue-50"
                          placeholder="Data calculada automaticamente"
                          required
                          readOnly
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {(newContract.payment_frequency === 'monthly' || newContract.payment_frequency === 'quarterly')
                        ? "Contratos mensais e trimestrais são renovados automaticamente"
                        : `Data calculada automaticamente: ${newContract.payment_frequency === 'semiannual' ? '+6 meses' : '+1 ano'} da data de início`
                      }
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arquivo do Contrato
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setNewContract({...newContract, contract_file: e.target.files?.[0] || null})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formatos aceitos: PDF, DOC, DOCX (máximo 10MB)
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newContract.auto_renewal}
                        onChange={(e) => setNewContract({...newContract, auto_renewal: e.target.checked})}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Renovação automática</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {uploading ? 'Fazendo upload...' : 'Criar Contrato'}
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

        {/* Modal de Cancelamento */}
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
                      Esta ação marcará o contrato como cancelado. O contrato permanecerá no histórico.
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
                    onClick={handleCancelContract}
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
    </div>
  );
};

export default SupplierContractsPanel;

