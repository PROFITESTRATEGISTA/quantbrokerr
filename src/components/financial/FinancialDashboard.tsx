import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ToggleLeft, ToggleRight, TrendingDown, Building } from 'lucide-react';
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

interface ClientContract {
  id: string;
  user_id: string;
  plan_type: string;
  billing_period: string;
  monthly_value: number;
  contract_start: string;
  contract_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  is_active: boolean;
}

interface SupplierContract {
  id: string;
  monthly_value: number;
  contract_start: string;
  is_active: boolean;
  created_at: string;
}

const FinancialDashboard: React.FC = () => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [dataType, setDataType] = useState<'users' | 'revenue' | 'costs' | 'profit' | 'comparison' | 'clients'>('comparison');
  const [costs, setCosts] = useState<FinancialCost[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [supplierContracts, setSupplierContracts] = useState<SupplierContract[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCosts(),
        fetchContracts(),
        fetchSupplierContracts(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_costs')
        .select('*')
        .order('cost_date', { ascending: true });

      if (error) throw error;
      setCosts(data || []);
    } catch (error) {
      console.error('Error fetching costs:', error);
    }
  };

  const fetchContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('client_contracts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    }
  };

  const fetchSupplierContracts = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_contracts')
        .select('id, monthly_value, contract_start, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSupplierContracts(data || []);
    } catch (error) {
      console.error('Error fetching supplier contracts:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, created_at, is_active')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Prepare chart data based on selected type
  const getChartData = () => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return {
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        monthKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      };
    });

    return last12Months.map(({ month, monthKey }) => {
      let value = 0;
      let revenue = 0;
      let totalCosts = 0;
      let supplierCosts = 0;
      let profit = 0;

      switch (dataType) {
        case 'users':
          // Count new users in this month
          value = users.filter(user => {
            const userDate = new Date(user.created_at);
            const userMonthKey = `${userDate.getFullYear()}-${String(userDate.getMonth() + 1).padStart(2, '0')}`;
            return userMonthKey === monthKey;
          }).length;
          break;

        case 'clients':
          // Count total active clients (contracts) up to this month
          value = contracts.filter(contract => {
            const contractDate = new Date(contract.created_at);
            return contractDate <= new Date(monthKey + '-31');
          }).length;
          break;

        case 'revenue':
          // Sum revenue from active contracts in this month
          value = contracts.filter(contract => {
            const contractDate = new Date(contract.created_at);
            const contractMonthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
            return contractMonthKey === monthKey;
          }).reduce((sum, contract) => sum + contract.monthly_value, 0);
          break;

        case 'costs':
          // Sum costs in this month
          value = costs.filter(cost => {
            const costDate = new Date(cost.cost_date);
            const costMonthKey = `${costDate.getFullYear()}-${String(costDate.getMonth() + 1).padStart(2, '0')}`;
            return costMonthKey === monthKey;
          }).reduce((sum, cost) => sum + cost.amount, 0);
          break;

        case 'profit':
          // Calculate profit (revenue - all costs)
          revenue = contracts.filter(contract => {
            const contractDate = new Date(contract.created_at);
            const contractMonthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
            return contractMonthKey === monthKey;
          }).reduce((sum, contract) => sum + contract.monthly_value, 0);

          totalCosts = costs.filter(cost => {
            const costDate = new Date(cost.cost_date);
            const costMonthKey = `${costDate.getFullYear()}-${String(costDate.getMonth() + 1).padStart(2, '0')}`;
            return costMonthKey === monthKey;
          }).reduce((sum, cost) => sum + cost.amount, 0);

          supplierCosts = supplierContracts.filter(contract => {
            const contractDate = new Date(contract.created_at);
            const contractMonthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
            return contractMonthKey === monthKey;
          }).reduce((sum, contract) => sum + contract.monthly_value, 0);

          value = revenue - totalCosts - supplierCosts;
          break;

        case 'comparison':
          // Show revenue, costs, and profit in the same chart
          revenue = contracts.filter(contract => {
            const contractDate = new Date(contract.created_at);
            const contractMonthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
            return contractMonthKey === monthKey;
          }).reduce((sum, contract) => sum + contract.monthly_value, 0);

          totalCosts = costs.filter(cost => {
            const costDate = new Date(cost.cost_date);
            const costMonthKey = `${costDate.getFullYear()}-${String(costDate.getMonth() + 1).padStart(2, '0')}`;
            return costMonthKey === monthKey;
          }).reduce((sum, cost) => sum + cost.amount, 0);

          supplierCosts = supplierContracts.filter(contract => {
            const contractDate = new Date(contract.created_at);
            const contractMonthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
            return contractMonthKey === monthKey;
          }).reduce((sum, contract) => sum + contract.monthly_value, 0);

          profit = revenue - totalCosts - supplierCosts;
          value = revenue; // Default value for single-line charts
          break;
      }

      return {
        month,
        value,
        revenue,
        totalCosts: totalCosts + supplierCosts,
        operationalCosts: totalCosts,
        supplierCosts,
        profit,
        formattedValue: dataType === 'users' || dataType === 'clients' ? value.toString() : `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      };
    });
  };

  const chartData = getChartData();

  const getDataTypeConfig = () => {
    switch (dataType) {
      case 'users':
        return {
          title: 'Novos Usuários por Mês',
          color: '#3b82f6',
          icon: Users,
          unit: 'usuários'
        };
      case 'clients':
        return {
          title: 'Evolução de Clientes ao Longo do Tempo',
          color: '#3b82f6',
          icon: Building,
          unit: 'clientes'
        };
      case 'revenue':
        return {
          title: 'Receita por Mês',
          color: '#22c55e',
          icon: DollarSign,
          unit: 'R$'
        };
      case 'costs':
        return {
          title: 'Custos por Mês',
          color: '#ef4444',
          icon: TrendingUp,
          unit: 'R$'
        };
      case 'profit':
        return {
          title: 'Lucro Líquido por Mês',
          color: '#8b5cf6',
          icon: TrendingUp,
          unit: 'R$'
        };
      case 'comparison':
        return {
          title: 'Comparativo Financeiro Completo',
          color: '#6366f1',
          icon: BarChart3,
          unit: 'R$'
        };
      default:
        return {
          title: 'Dados por Mês',
          color: '#6b7280',
          icon: BarChart3,
          unit: ''
        };
    }
  };

  const config = getDataTypeConfig();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (dataType === 'comparison') {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900 mb-2">{label}</p>
            <div className="space-y-1">
              <p className="text-sm text-green-600">
                <span className="font-bold">Receita:</span> R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-orange-600">
                <span className="font-bold">Custos Operacionais:</span> R$ {data.operationalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-red-600">
                <span className="font-bold">Custos Fornecedores:</span> R$ {data.supplierCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-bold">Total Custos:</span> R$ {data.totalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <hr className="my-2" />
              <p className={`text-sm font-bold ${data.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                <span>Lucro Líquido:</span> R$ {data.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        );
      } else {
        const data = payload[0];
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900">{label}</p>
            <p className="text-sm text-gray-600">
              {config.title}: <span className="font-bold" style={{ color: config.color }}>
                {data.payload.formattedValue}
              </span>
            </p>
          </div>
        );
      }
    }
    return null;
  };

  const renderChart = () => {
    if (dataType === 'comparison') {
      return (
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
          <Bar dataKey="revenue" fill="#22c55e" name="Receita" radius={[2, 2, 0, 0]} />
          <Bar dataKey="operationalCosts" fill="#f97316" name="Custos Operacionais" radius={[2, 2, 0, 0]} />
          <Bar dataKey="supplierCosts" fill="#ef4444" name="Custos Fornecedores" radius={[2, 2, 0, 0]} />
          <Bar dataKey="profit" fill="#8b5cf6" name="Lucro Líquido" radius={[2, 2, 0, 0]} />
        </BarChart>
      );
    }

    return chartType === 'bar' ? (
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="month" 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickFormatter={(value) => 
            dataType === 'clients' 
              ? value.toString() 
              : `R$ ${(value / 1000).toFixed(0)}k`
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="value" 
          fill={config.color}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    ) : (
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="month" 
          stroke="#64748b"
          fontSize={12}
        />
        <YAxis 
          stroke="#64748b"
          fontSize={12}
          tickFormatter={(value) => 
            dataType === 'clients' 
              ? value.toString() 
              : `R$ ${(value / 1000).toFixed(0)}k`
          }
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={config.color}
          strokeWidth={3}
          dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: config.color, strokeWidth: 2 }}
        />
      </LineChart>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex items-center">
          <config.icon className="h-6 w-6 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Data Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Dados:</span>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value as any)}
              className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="comparison">Comparativo Completo</option>
              <option value="profit">Lucro Líquido</option>
              <option value="revenue">Receita</option>
              <option value="costs">Custos Operacionais</option>
              <option value="clients">Evolução de Clientes</option>
            </select>
          </div>

          {/* Chart Type Toggle - Hide for comparison view */}
          {dataType !== 'comparison' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tipo:</span>
              <button
                onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  chartType === 'bar' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {chartType === 'bar' ? (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Barras</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Linha</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Chart Summary */}
      {dataType === 'comparison' ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              R$ {chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">Total Receita</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              R$ {chartData.reduce((sum, item) => sum + item.operationalCosts, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">Custos Operacionais</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-red-600">
              R$ {chartData.reduce((sum, item) => sum + item.supplierCosts, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">Custos Fornecedores</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-600">
              R$ {chartData.reduce((sum, item) => sum + item.totalCosts, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">Total Custos</div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold ${chartData.reduce((sum, item) => sum + item.profit, 0) >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              R$ {chartData.reduce((sum, item) => sum + item.profit, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-600">Lucro Líquido</div>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: config.color }}>
              {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString('pt-BR', { 
                minimumFractionDigits: dataType === 'users' || dataType === 'clients' ? 0 : 2 
              })}
            </div>
            <div className="text-sm text-gray-600">
              Total {dataType === 'users' ? 'Usuários' : dataType === 'clients' ? 'Clientes' : dataType === 'revenue' ? 'Receita' : dataType === 'profit' ? 'Lucro' : 'Custos'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {(chartData.reduce((sum, item) => sum + item.value, 0) / Math.max(chartData.filter(d => d.value > 0).length, 1)).toLocaleString('pt-BR', { 
                minimumFractionDigits: dataType === 'users' || dataType === 'clients' ? 0 : 2 
              })}
            </div>
            <div className="text-sm text-gray-600">Média Mensal</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {Math.max(...chartData.map(d => d.value)).toLocaleString('pt-BR', { 
                minimumFractionDigits: dataType === 'users' || dataType === 'clients' ? 0 : 2 
              })}
            </div>
            <div className="text-sm text-gray-600">Maior Valor</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {chartData.filter(d => d.value > 0).length}
            </div>
            <div className="text-sm text-gray-600">Meses Ativos</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;