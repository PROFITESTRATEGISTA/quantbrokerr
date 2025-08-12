import React from 'react';
import { TrendingUp, DollarSign, Users, Clock, Building, Calendar, Target } from 'lucide-react';

interface AdminTabNavigationProps {
  activeTab: 'financial' | 'contracts' | 'users' | 'waitlist' | 'suppliers' | 'forms' | 'leads';
  onTabChange: (tab: 'financial' | 'contracts' | 'users' | 'waitlist' | 'suppliers' | 'forms' | 'leads') => void;
}

const AdminTabNavigation: React.FC<AdminTabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'financial' as const,
      label: 'Financeiro',
      icon: DollarSign,
      description: 'Gestão de custos e despesas'
    },
    {
      id: 'contracts' as const,
      label: 'Contratos',
      icon: Building,
      description: 'Contratos de clientes'
    },
    {
      id: 'users' as const,
      label: 'Central de Usuários',
      icon: Users,
      description: 'Gerenciamento de usuários'
    },
    {
      id: 'waitlist' as const,
      label: 'Fila de Espera & Formulários',
      icon: Clock,
      description: 'Controle de inscrições e formulários'
    },
    {
      id: 'leads' as const,
      label: 'Leads Totais',
      icon: Target,
      description: 'Leads únicos de todas as fontes'
    },
    {
      id: 'suppliers' as const,
      label: 'Fornecedores',
      icon: TrendingUp,
      description: 'Contratos de fornecedores'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex space-x-1 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={tab.description}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminTabNavigation;