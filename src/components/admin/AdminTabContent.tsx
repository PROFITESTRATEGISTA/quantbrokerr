import React from 'react';
import AdminResultsPanel from './AdminResultsPanel';
import AdminFinancialPanel from './AdminFinancialPanel';
import AdminUsersPanel from './AdminUsersPanel';
import AdminWaitlistPanel from './AdminWaitlistPanel';
import AdminSuppliersPanel from './AdminSuppliersPanel';

interface AdminTabContentProps {
  activeTab: 'results' | 'financial' | 'users' | 'waitlist' | 'suppliers';
}

const AdminTabContent: React.FC<AdminTabContentProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'results':
        return <AdminResultsPanel />;
      case 'financial':
        return <AdminFinancialPanel />;
      case 'users':
        return <AdminUsersPanel />;
      case 'waitlist':
        return <AdminWaitlistPanel />;
      case 'suppliers':
        return <AdminSuppliersPanel />;
      default:
        return <AdminResultsPanel />;
    }
  };

  return (
    <div className="admin-tab-content">
      {renderTabContent()}
    </div>
  );
};

export default AdminTabContent;