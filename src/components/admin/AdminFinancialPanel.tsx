import React from 'react';
import { DollarSign, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import FinancialDashboard from '../financial/FinancialDashboard';
import FinancialSummaryCards from '../financial/FinancialSummaryCards';
import FinancialFilters from '../financial/FinancialFilters';
import FinancialCostForm from '../financial/FinancialCostForm';
import FinancialCostTable from '../financial/FinancialCostTable';

interface FinancialCost {
  id: string;
  description: string;
  category: string;
  amount: number;
  cost_date: string;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
}

const AdminFinancialPanel: React.FC = () => {
  const [costs, setCosts] = useState<FinancialCost[]>([]);
  const [filteredCosts, setFilteredCosts] = useState<FinancialCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCost, setEditingCost] = useState<FinancialCost | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recurringFilter, setRecurringFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchCosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [costs, searchTerm, categoryFilter, recurringFilter, dateFilter]);

  const fetchCosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_costs')
        .select('*')
        .order('cost_date', { ascending: false });

      if (error) throw error;
      setCosts(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...costs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(cost =>
        cost.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(cost => cost.category === categoryFilter);
    }

    // Recurring filter
    if (recurringFilter !== 'all') {
      filtered = filtered.filter(cost => 
        recurringFilter === 'recurring' ? cost.is_recurring : !cost.is_recurring
      );
    }

    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(cost => {
        const costDate = new Date(cost.cost_date);
        const filterDate = new Date(dateFilter + '-01');
        return costDate.getMonth() === filterDate.getMonth() && 
               costDate.getFullYear() === filterDate.getFullYear();
      });
    }

    setFilteredCosts(filtered);
  };

  const handleAddCost = async (costData: Omit<FinancialCost, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setSubmitting(true);
      setError(null);

      const { error } = await supabase
        .from('financial_costs')
        .insert(costData);

      if (error) throw error;

      setSuccess('Custo financeiro adicionado com sucesso!');
      setShowAddModal(false);
      fetchCosts();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCost = (cost: FinancialCost) => {
    setEditingCost(cost);
    setShowAddModal(true);
  };

  const handleUpdateCost = async (costData: Omit<FinancialCost, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingCost) return;

    try {
      setSubmitting(true);
      setError(null);

      const { error } = await supabase
        .from('financial_costs')
        .update(costData)
        .eq('id', editingCost.id);

      if (error) throw error;

      setSuccess('Custo financeiro atualizado com sucesso!');
      setShowAddModal(false);
      setEditingCost(null);
      fetchCosts();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCost = async (id: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('financial_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Custo financeiro excluído com sucesso!');
      fetchCosts();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleFormSubmit = (costData: any) => {
    if (editingCost) {
      handleUpdateCost(costData);
    } else {
      handleAddCost(costData);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingCost(null);
    setError(null);
    setSuccess(null);
  };

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
          <DollarSign className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão Financeira</h2>
            <p className="text-gray-600">Controle completo de custos e despesas da empresa</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Custo
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
      <FinancialSummaryCards costs={costs} />

      {/* Financial Dashboard with Charts */}
      <FinancialDashboard />

      {/* Filters */}
      <FinancialFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        recurringFilter={recurringFilter}
        setRecurringFilter={setRecurringFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
      />

      {/* Costs Table */}
      <FinancialCostTable
        costs={filteredCosts}
        onEdit={handleEditCost}
        onDelete={handleDeleteCost}
      />

      {/* Add/Edit Cost Modal */}
      <FinancialCostForm
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        loading={submitting}
      />
    </div>
  );
};

export default AdminFinancialPanel;