import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

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

interface FinancialChartsProps {
  costs: FinancialCost[];
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({ costs }) => {
  const [activeChart, setActiveChart] = React.useState<'category' | 'monthly' | 'type'>('category');

  // Early return if no costs
  if (!costs || costs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem dados para gráficos</h3>
          <p className="text-gray-600">Adicione alguns custos para visualizar os gráficos</p>
        </div>
      </div>
    );
  }

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

  const getCategoryColor = (category: string) => {
    const colors = {
      'operacional': '#3b82f6',
      'marketing': '#22c55e',
      'tecnologia': '#8b5cf6',
      'pessoal': '#eab308',
      'infraestrutura': '#f97316',
      'outros': '#6b7280'
    };
    return colors[category as keyof typeof colors] || '#6b7280';
  };

  // Prepare data for category chart
  const categoryData = costs.reduce((acc, cost) => {
    const category = cost.category;
    acc[category] = (acc[category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData)
    .map(([category, amount]) => ({
      name: getCategoryDisplayName(category),
      value: amount,
      color: getCategoryColor(category)
    }))
    .filter(item => item.value > 0);

  // Prepare data for monthly chart
  const monthlyData = costs.reduce((acc, cost) => {
    const date = new Date(cost.cost_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    acc[monthKey] = (acc[monthKey] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      amount
    }))
    .filter(item => item.amount > 0);

  // Prepare data for type chart (recurring vs one-time)
  const recurringTotal = costs.filter(c => c.is_recurring).reduce((sum, c) => sum + c.amount, 0);
  const oneTimeTotal = costs.filter(c => !c.is_recurring).reduce((sum, c) => sum + c.amount, 0);

  const typeChartData = [
    { name: 'Recorrentes', value: recurringTotal, color: '#8b5cf6' },
    { name: 'Únicos', value: oneTimeTotal, color: '#f97316' }
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Valor: <span className="font-bold text-green-600">
              R$ {data.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || 
                   data.payload?.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
          Análise Visual dos Custos
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveChart('category')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'category'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PieChartIcon className="h-4 w-4 inline mr-1" />
            Por Categoria
          </button>
          <button
            onClick={() => setActiveChart('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-1" />
            Por Mês
          </button>
          <button
            onClick={() => setActiveChart('type')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'type'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-1" />
            Por Tipo
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === 'category' && categoryChartData.length > 0 && (
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                {categoryChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          )}

          {activeChart === 'monthly' && monthlyChartData.length > 0 && (
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LineChart>
          )}

          {activeChart === 'type' && typeChartData.length > 0 && (
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
              >
                {typeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}

          {/* Empty state for when no data is available for the selected chart */}
          {((activeChart === 'category' && categoryChartData.length === 0) ||
            (activeChart === 'monthly' && monthlyChartData.length === 0) ||
            (activeChart === 'type' && typeChartData.length === 0)) && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {activeChart === 'category' && <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />}
                {activeChart === 'monthly' && <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />}
                {activeChart === 'type' && <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />}
                <p className="text-gray-500">
                  {activeChart === 'category' && 'Nenhum dado por categoria'}
                  {activeChart === 'monthly' && 'Nenhum dado mensal'}
                  {activeChart === 'type' && 'Nenhum dado por tipo'}
                </p>
              </div>
            </div>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {activeChart === 'category' && categoryChartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">
              {item.name}: R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
        
        {activeChart === 'type' && typeChartData.map((item, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">
              {item.name}: R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialCharts;