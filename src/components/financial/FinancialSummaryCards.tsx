import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Building, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

interface FinancialSummaryCardsProps {
  costs: FinancialCost[];
}

const FinancialSummaryCards: React.FC<FinancialSummaryCardsProps> = ({ costs }) => {
  const [contracts, setContracts] = React.useState<any[]>([]);
  const [supplierContracts, setSupplierContracts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchContractsData();
  }, []);

  const fetchContractsData = async () => {
    try {
      const [clientContractsResult, supplierContractsResult] = await Promise.all([
        supabase.from('client_contracts').select('*').eq('is_active', true),
        supabase.from('supplier_contracts').select('*').eq('is_active', true)
      ]);

      setContracts(clientContractsResult.data || []);
      setSupplierContracts(supplierContractsResult.data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthCosts = costs.filter(cost => {
    const costDate = new Date(cost.cost_date);
    return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear;
  });

  const recurringCosts = costs.filter(cost => cost.is_recurring);
  const oneTimeCosts = costs.filter(cost => !cost.is_recurring);

  const totalThisMonth = thisMonthCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalRecurring = recurringCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalOneTime = oneTimeCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalGeneral = costs.reduce((sum, cost) => sum + cost.amount, 0);

  // Calculate contract-related metrics
  const totalMonthlyRevenue = contracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const totalSupplierCosts = supplierContracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const netProfit = totalMonthlyRevenue - totalGeneral - totalSupplierCosts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
      {/* Revenue Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Supplier Costs Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <Building className="h-8 w-8 text-red-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Custos Fornecedores</p>
            <p className="text-2xl font-bold text-red-600">
              R$ {totalSupplierCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Custos Operacionais</p>
            <p className="text-2xl font-bold text-blue-600">
              R$ {totalGeneral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <Calendar className="h-8 w-8 text-green-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Este Mês</p>
            <p className="text-2xl font-bold text-green-600">
              R$ {totalThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-purple-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Custos Recorrentes</p>
            <p className="text-2xl font-bold text-purple-600">
              R$ {totalRecurring.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Net Profit Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-purple-200">
        <div className="flex items-center">
          <TrendingUp className={`h-8 w-8 ${netProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Lucro Líquido Mensal</p>
            <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryCards;