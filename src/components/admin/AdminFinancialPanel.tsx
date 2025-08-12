import React from 'react';
import FinancialPanel from '../FinancialPanel';

const AdminFinancialPanel: React.FC = () => {
  return (
    <div className="admin-financial-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão Financeira</h2>
        <p className="text-gray-600">Controle de custos e despesas da empresa</p>
      </div>
      <FinancialPanel />
    </div>
  );
};

export default AdminFinancialPanel;