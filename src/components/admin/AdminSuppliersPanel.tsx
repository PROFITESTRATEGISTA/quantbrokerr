import React from 'react';
import SupplierContractsPanel from '../SupplierContractsPanel';

const AdminSuppliersPanel: React.FC = () => {
  return (
    <div className="admin-suppliers-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contratos de Fornecedores</h2>
        <p className="text-gray-600">Gestão completa de contratos e fornecedores</p>
      </div>
      <SupplierContractsPanel />
    </div>
  );
};

export default AdminSuppliersPanel;