import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Geral</p>
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

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center">
          <TrendingDown className="h-8 w-8 text-orange-600" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Custos Únicos</p>
            <p className="text-2xl font-bold text-orange-600">
              R$ {totalOneTime.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryCards;