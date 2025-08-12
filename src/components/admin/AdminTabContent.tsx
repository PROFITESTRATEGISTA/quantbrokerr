import React from 'react';
import ResultsCalendar from '../ResultsCalendar';
import FinancialPanel from '../FinancialPanel';
import UserManagementPanel from '../UserManagementPanel';
import WaitlistPanel from '../WaitlistPanel';
import SupplierContractsPanel from '../SupplierContractsPanel';

interface AdminTabContentProps {
  activeTab: 'results' | 'financial' | 'users' | 'waitlist' | 'suppliers';
}

const AdminTabContent: React.FC<AdminTabContentProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'results':
        return <ResultsCalendar />;
      case 'financial':
        return <FinancialPanel />;
      case 'users':
        return <UserManagementPanel />;
      case 'waitlist':
        return <WaitlistPanel />;
      case 'suppliers':
        return <SupplierContractsPanel />;
      default:
        return <ResultsCalendar />;
    }
  };

  return (
    <div className="admin-tab-content">
      {renderTabContent()}
    </div>
  );
};

export default AdminTabContent;