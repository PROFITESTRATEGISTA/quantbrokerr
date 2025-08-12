import React from 'react';
import { BarChart3 } from 'lucide-react';

const AdminHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
      <p className="mt-2 text-gray-600">Gerencie resultados, finanças e estatísticas</p>
    </div>
  );
};

export default AdminHeader;