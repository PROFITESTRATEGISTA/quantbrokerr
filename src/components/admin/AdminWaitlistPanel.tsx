import React from 'react';
import WaitlistPanel from '../WaitlistPanel';
import AdminFormsPanel from './AdminFormsPanel';

const AdminWaitlistPanel: React.FC = () => {
  return (
    <div className="admin-waitlist-panel space-y-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fila de Espera & Formulários</h2>
        <p className="text-gray-600">Controle de inscrições, ofertas e formulários de consultoria</p>
      </div>
      <WaitlistPanel />
      
      <div className="border-t border-gray-200 pt-8">
        <AdminFormsPanel />
      </div>
    </div>
  );
};

export default AdminWaitlistPanel;