import React from 'react';
import ResultsCalendar from '../ResultsCalendar';

const AdminResultsPanel: React.FC = () => {
  return (
    <div className="admin-results-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestão de Resultados</h2>
        <p className="text-gray-600">Gerencie os resultados mensais dos portfólios</p>
      </div>
      <ResultsCalendar />
    </div>
  );
};

export default AdminResultsPanel;