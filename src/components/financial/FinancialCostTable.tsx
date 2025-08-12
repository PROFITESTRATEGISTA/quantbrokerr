import React, { useState } from 'react';
import { Edit3, Trash2, Calendar, Tag, DollarSign, Repeat, RotateCcw } from 'lucide-react';

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

interface FinancialCostTableProps {
  costs: FinancialCost[];
  onEdit: (cost: FinancialCost) => void;
  onDelete: (id: string) => void;
}

const FinancialCostTable: React.FC<FinancialCostTableProps> = ({
  costs,
  onEdit,
  onDelete
}) => {
  const [sortField, setSortField] = useState<keyof FinancialCost>('cost_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const getCategoryDisplayName = (category: string) => {
    const categories = {
      'operacional': 'Operacional',
      'marketing': 'Marketing',
      'tecnologia': 'Tecnologia',
      'pessoal': 'Pessoal',
      'infraestrutura': 'Infraestrutura',
      'outros': 'Outros'
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'operacional': '⚙️',
      'marketing': '📢',
      'tecnologia': '💻',
      'pessoal': '👥',
      'infraestrutura': '🏗️',
      'outros': '📋'
    };
    return icons[category as keyof typeof icons] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'operacional': 'bg-blue-100 text-blue-800',
      'marketing': 'bg-green-100 text-green-800',
      'tecnologia': 'bg-purple-100 text-purple-800',
      'pessoal': 'bg-yellow-100 text-yellow-800',
      'infraestrutura': 'bg-orange-100 text-orange-800',
      'outros': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSort = (field: keyof FinancialCost) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCosts = [...costs].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortableHeader: React.FC<{ field: keyof FinancialCost; children: React.ReactNode }> = ({ field, children }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortField === field && (
          <span className="text-blue-500">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  if (costs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum custo encontrado</h3>
          <p className="text-gray-600">Os custos financeiros aparecerão aqui conforme forem adicionados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Lista de Custos ({costs.length} {costs.length === 1 ? 'item' : 'itens'})
        </h3>
        <p className="text-sm text-gray-600">Gerencie todos os custos financeiros da empresa</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="description">Descrição</SortableHeader>
              <SortableHeader field="category">Categoria</SortableHeader>
              <SortableHeader field="amount">Valor</SortableHeader>
              <SortableHeader field="cost_date">Data</SortableHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCosts.map((cost) => (
              <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{cost.description}</div>
                  <div className="text-xs text-gray-500">
                    Criado em {new Date(cost.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(cost.category)}`}>
                    <span className="mr-1">{getCategoryIcon(cost.category)}</span>
                    {getCategoryDisplayName(cost.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-gray-900">
                    R$ {cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(cost.cost_date).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(cost.cost_date).toLocaleDateString('pt-BR', { 
                      weekday: 'long' 
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {cost.is_recurring ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Repeat className="h-3 w-3 mr-1" />
                        Recorrente
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Único
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onEdit(cost)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Editar custo"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Tem certeza que deseja excluir o custo "${cost.description}"?`)) {
                          onDelete(cost.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors"
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
  );
};

export default FinancialCostTable;