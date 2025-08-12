import React, { useState } from 'react';
import AdminHeader from './AdminHeader';
import AdminTabNavigation from './AdminTabNavigation';
import AdminTabContent from './AdminTabContent';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'financial' | 'contracts' | 'users' | 'waitlist' | 'suppliers' | 'forms' | 'leads'>('financial');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader />
        
        <AdminTabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <AdminTabContent activeTab={activeTab} />
      </div>
    </div>
  );
};

export default AdminDashboard;