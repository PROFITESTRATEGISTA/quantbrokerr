import React from 'react';
import { Filter, Search, Calendar } from 'lucide-react';

interface FinancialFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  recurringFilter: string;
  setRecurringFilter: (filter: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;
}

const FinancialFilters: React.FC<FinancialFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  recurringFilter,
  setRecurringFilter,
  dateFilter,
  setDateFilter
}) => {
  const categories = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'operacional', label: 'Operacional' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'pessoal', label: 'Pessoal' },
    { value: 'infraestrutura', label: 'Infraestrutura' },
    { value: 'outros', label: 'Outros' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Filter className="h-5 w-5 mr-2" />
        Filtros
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="h-4 w-4 inline mr-1" />
            Buscar
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Buscar por descrição..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo
          </label>
          <select
            value={recurringFilter}
            onChange={(e) => setRecurringFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            <option value="recurring">Recorrentes</option>
            <option value="one-time">Únicos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Mês/Ano
          </label>
          <input
            type="month"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default FinancialFilters;