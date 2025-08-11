import React, { useState } from 'react';
import Layout from '../components/Layout';
import WaitlistPanel from '../components/WaitlistPanel';
import { BarChart3, DollarSign, Settings, TrendingUp, Clock } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'results' | 'financial' | 'statistics' | 'waitlist'>('results');

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
            <p className="mt-2 text-gray-600">Gerencie resultados, finanças e estatísticas</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex space-x-1 p-1">
              <button
                onClick={() => setActiveTab('results')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'results'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Resultados
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'financial'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Financeiro
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'statistics'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Estatísticas
              </button>
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'waitlist'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Fila de Espera
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'results' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Gerenciar Resultados</h2>
                <p className="text-gray-600">Painel de resultados em desenvolvimento...</p>
              </div>
            )}
            {activeTab === 'financial' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Gerenciar Finanças</h2>
                <p className="text-gray-600">Painel financeiro em desenvolvimento...</p>
              </div>
            )}
            {activeTab === 'statistics' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Estatísticas de Trading</h2>
                <p className="text-gray-600">Painel de estatísticas em desenvolvimento...</p>
              </div>
            )}
            {activeTab === 'waitlist' && <WaitlistPanel />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPage;