import React from 'react';
import UserManagementPanel from '../UserManagementPanel';

const AdminUsersPanel: React.FC = () => {
  return (
    <div className="admin-users-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Central de Usuários</h2>
        <p className="text-gray-600">Gerencie perfis de usuários e contratos</p>
      </div>
      <UserManagementPanel />
    </div>
  );
};

export default AdminUsersPanel;