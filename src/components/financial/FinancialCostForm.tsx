import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Tag, Repeat } from 'lucide-react';

interface FinancialCostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (costData: any) => void;
  loading: boolean;
}

const FinancialCostForm: React.FC<FinancialCostFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading
}) => {
  const [formData, setFormData] = useState({
    description: '',
    category: 'operacional',
    amount: '',
    cost_date: new Date().toISOString().split('T')[0],
    is_recurring: false
  });

  const categories = [
    { value: 'operacional', label: 'Operacional', icon: '⚙️' },
    { value: 'marketing', label: 'Marketing', icon: '📢' },
    { value: 'tecnologia', label: 'Tecnologia', icon: '💻' },
    { value: 'pessoal', label: 'Pessoal', icon: '👥' },
    { value: 'infraestrutura', label: 'Infraestrutura', icon: '🏗️' },
    { value: 'outros', label: 'Outros', icon: '📋' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.cost_date) {
      return;
    }

    onSubmit({
      description: formData.description,
      category: formData.category,
      amount: parseFloat(formData.amount),
      cost_date: formData.cost_date,
      is_recurring: formData.is_recurring
    });

    // Reset form
    setFormData({
      description: '',
      category: 'operacional',
      amount: '',
      cost_date: new Date().toISOString().split('T')[0],
      is_recurring: false
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Novo Custo Financeiro</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              Descrição do Custo *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Licença software, Marketing digital, etc."
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="h-4 w-4 inline mr-1" />
              Categoria *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(category => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleInputChange('category', category.value)}
                  className={`p-3 border-2 rounded-lg transition-all text-left ${
                    formData.category === category.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg mb-1">{category.icon}</div>
                  <div className="text-sm font-medium">{category.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
                required
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Data do Custo *
              </label>
              <input
                type="date"
                value={formData.cost_date}
                onChange={(e) => handleInputChange('cost_date', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Recorrente */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_recurring}
                onChange={(e) => handleInputChange('is_recurring', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
              />
              <div className="flex items-center">
                <Repeat className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">
                  Este é um custo recorrente (mensal)
                </span>
              </div>
            </label>
            <p className="text-xs text-blue-700 mt-2 ml-7">
              Marque esta opção se este custo se repete mensalmente (ex: assinaturas, salários)
            </p>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Resumo do Custo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Descrição:</span>
                <span className="font-medium">{formData.description || 'Não informado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Categoria:</span>
                <span className="font-medium">
                  {categories.find(c => c.value === formData.category)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor:</span>
                <span className="font-medium text-green-600">
                  R$ {formData.amount ? parseFloat(formData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo:</span>
                <span className={`font-medium ${formData.is_recurring ? 'text-purple-600' : 'text-orange-600'}`}>
                  {formData.is_recurring ? 'Recorrente' : 'Único'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !formData.description || !formData.amount}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adicionando...' : 'Adicionar Custo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialCostForm;