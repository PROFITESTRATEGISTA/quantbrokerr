import React from 'react';
import AdminFinancialPanel from './AdminFinancialPanel';
import AdminContractsPanel from './AdminContractsPanel';
import AdminUsersPanel from './AdminUsersPanel';
import AdminWaitlistPanel from './AdminWaitlistPanel';
import AdminSuppliersPanel from './AdminSuppliersPanel';
import AdminLeadsPanel from './AdminLeadsPanel';

interface AdminTabContentProps {
  activeTab: 'financial' | 'contracts' | 'users' | 'waitlist' | 'suppliers' | 'leads';
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
      case 'leads':
        return <AdminLeadsPanel />;
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