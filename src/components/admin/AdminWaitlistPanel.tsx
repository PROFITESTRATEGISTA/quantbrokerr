import React from 'react';
import WaitlistPanel from '../WaitlistPanel';

const AdminWaitlistPanel: React.FC = () => {
  return (
    <div className="admin-waitlist-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Fila de Espera</h2>
        <p className="text-gray-600">Controle de inscrições e configuração de ofertas</p>
      </div>
      <WaitlistPanel />
    </div>
  );
};

export default AdminWaitlistPanel;