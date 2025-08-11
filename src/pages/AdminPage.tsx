import WaitlistPanel from '../components/WaitlistPanel';
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
import React from 'react';
import Layout from '../components/Layout';
import { BarChart3, DollarSign, Settings, TrendingUp, Clock } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <Layout>
        {activeTab === 'waitlist' && <WaitlistPanel />}
      <AdminPanel />
    </Layout>
  );
  const [activeTab, setActiveTab] = useState<'results' | 'financial' | 'statistics' | 'waitlist'>('results');

export default AdminPage;