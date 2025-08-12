import React from 'react';
import AdminFinancialPanel from './AdminFinancialPanel';
import AdminUsersPanel from './AdminUsersPanel';
import AdminWaitlistPanel from './AdminWaitlistPanel';
import AdminSuppliersPanel from './AdminSuppliersPanel';
import AdminContractsPanel from './AdminContractsPanel';

interface AdminTabContentProps {
  activeTab: 'financial' | 'contracts' | 'users' | 'waitlist' | 'suppliers';
}

const AdminTabContent: React.FC<AdminTabContentProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'financial':
        return <AdminFinancialPanel />;
      case 'contracts':
        return <AdminContractsPanel />;
      case 'users':
        return <AdminUsersPanel />;
      case 'waitlist':
        return <AdminWaitlistPanel />;
      case 'suppliers':
        return <AdminSuppliersPanel />;
      default:
        return <AdminFinancialPanel />;
    }
  };

  return (
    <div className="admin-tab-content">
      {renderTabContent()}
    </div>
  );
};

export default AdminTabContent;