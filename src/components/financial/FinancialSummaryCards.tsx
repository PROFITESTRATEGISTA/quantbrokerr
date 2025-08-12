import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Building, Users, Target, UserCheck } from 'lucide-react';
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
  const [waitlistEntries, setWaitlistEntries] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchContractsData();
  }, []);

  const fetchContractsData = async () => {
    try {
      const [clientContractsResult, supplierContractsResult, waitlistResult] = await Promise.all([
        supabase.from('client_contracts').select('*').eq('is_active', true),
        supabase.from('supplier_contracts').select('*').eq('is_active', true),
        supabase.from('waitlist_entries').select('*')
      ]);

      setContracts(clientContractsResult.data || []);
      setSupplierContracts(supplierContractsResult.data || []);
      setWaitlistEntries(waitlistResult.data || []);
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
  const totalSupplierCosts = supplierContracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const totalRecurring = recurringCosts.reduce((sum, cost) => sum + cost.amount, 0) + totalSupplierCosts;
  const totalOneTime = oneTimeCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const totalGeneral = costs.reduce((sum, cost) => sum + cost.amount, 0);

  // Calculate contract-related metrics
  const totalMonthlyRevenue = contracts.reduce((sum, contract) => sum + contract.monthly_value, 0);
  const netProfit = totalMonthlyRevenue - totalGeneral - totalSupplierCosts;
  
  // Calculate marketing costs
  const marketingCosts = costs.filter(cost => cost.category === 'marketing').reduce((sum, cost) => sum + cost.amount, 0);
  
  // Calculate CAL (Cost per Lead) - Total leads from waitlist
  const totalLeads = waitlistEntries.length;
  const cal = totalLeads > 0 ? marketingCosts / totalLeads : 0;
  
  // Calculate CAC (Customer Acquisition Cost) - New customers this month
  const newCustomersThisMonth = contracts.filter(contract => {
    const contractDate = new Date(contract.created_at);
    return contractDate.getMonth() === currentMonth && contractDate.getFullYear() === currentYear;
  }).length;
  const cac = newCustomersThisMonth > 0 ? marketingCosts / newCustomersThisMonth : 0;
  
  // Calculate Churn Rate - Cancelled contracts vs total contracts
  const [allContracts, setAllContracts] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    const fetchAllContracts = async () => {
      try {
        const { data } = await supabase.from('client_contracts').select('*');
        setAllContracts(data || []);
      } catch (error) {
        console.error('Error fetching all contracts:', error);
      }
    };
    fetchAllContracts();
  }, []);
  
  const cancelledContracts = allContracts.filter(contract => !contract.is_active).length;
  const totalContracts = allContracts.length;
  const churnRate = totalContracts > 0 ? (cancelledContracts / totalContracts) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
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

      {/* Average Leverage Card */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-indigo-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Alavancagem Média por Cliente</p>
            <p className="text-2xl font-bold text-indigo-600">
              {contracts.length > 0 
                ? (contracts.reduce((sum, contract) => sum + (contract.leverage_multiplier || 1), 0) / contracts.length).toFixed(1)
                : '0.0'
              }x
            </p>
          </div>
        </div>
      </div>

      {/* CAL (Cost per Lead) Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-yellow-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">CAL (Custo por Lead)</p>
            <p className="text-2xl font-bold text-yellow-600">
              R$ {cal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">
              {totalLeads} leads • R$ {marketingCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} marketing
            </p>
          </div>
        </div>
      </div>

      {/* CAC (Customer Acquisition Cost) Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-orange-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">CAC (Custo por Cliente)</p>
            <p className="text-2xl font-bold text-orange-600">
              R$ {cac.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500">
              {newCustomersThisMonth} novos clientes este mês
            </p>
          </div>
        </div>
      </div>

      {/* Churn Rate Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
        <div className="flex items-center">
          <TrendingDown className="h-8 w-8 text-red-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Taxa de Churn</p>
            <p className="text-2xl font-bold text-red-600">
              {churnRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {cancelledContracts} de {totalContracts} contratos cancelados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialSummaryCards;