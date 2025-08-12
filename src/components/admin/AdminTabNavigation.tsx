import React from 'react';
import { TrendingUp, DollarSign, Users, Clock, Building } from 'lucide-react';

interface AdminTabNavigationProps {
  activeTab: 'financial' | 'users' | 'waitlist' | 'suppliers';
  onTabChange: (tab: 'financial' | 'users' | 'waitlist' | 'suppliers') => void;
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
      id: 'users' as const,
      label: 'Central de Usuários',
      icon: Users,
      description: 'Gerenciamento de usuários'
    },
    {
      id: 'waitlist' as const,
      label: 'Fila de Espera',
      icon: Clock,
      description: 'Controle de inscrições'
    },
    {
      id: 'suppliers' as const,
      label: 'Fornecedores',
      icon: Building,
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