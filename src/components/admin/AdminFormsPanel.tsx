import React from 'react';
import { Calendar, MessageCircle, AlertCircle } from 'lucide-react';

const AdminFormsPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Formulários de Consultoria</h2>
            <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
          </div>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Formulários de Consultoria</h3>
          <p className="text-sm text-gray-600">
            Esta funcionalidade será implementada em breve
          </p>
        </div>

        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Formulários de Consultoria</h3>
          <p className="text-gray-600 mb-4">
            Esta funcionalidade será implementada quando a tabela consultation_forms for criada no banco de dados.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">
                Para ativar esta funcionalidade, crie a tabela consultation_forms no Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
            className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Contato WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminFormsPanel;