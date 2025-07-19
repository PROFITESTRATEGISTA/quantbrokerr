import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

interface ResultTypeTagProps {
  isBacktest: boolean;
  isAdmin: boolean;
  month: string;
  year: number;
  currentResultType: 'backtest' | 'live';
  onEdit: (month: string, year: number, resultType: 'backtest' | 'live') => void;
  onUpdate: (month: string, year: number, resultType: 'backtest' | 'live') => Promise<void>;
  isEditing: boolean;
  editingResultType: 'backtest' | 'live';
  onCancel: () => void;
}

const ResultTypeTag: React.FC<ResultTypeTagProps> = ({
  isBacktest,
  isAdmin,
  month,
  year,
  currentResultType,
  onEdit,
  onUpdate,
  isEditing,
  editingResultType,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(month, year, editingResultType);
      onCancel(); // Close editing mode
    } catch (error) {
      console.error('Erro ao atualizar tipo de resultado:', error);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="absolute top-2 left-2 z-20 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-lg min-w-[140px]">
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tipo de Resultado</label>
            <select
              value={editingResultType}
              onChange={(e) => onEdit(month, year, e.target.value as 'backtest' | 'live')}
              className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-500 rounded text-white focus:border-blue-500 focus:outline-none"
              disabled={loading}
            >
              <option value="live">Mercado ao Vivo</option>
              <option value="backtest">Backtest</option>
            </select>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              disabled={loading || editingResultType === currentResultType}
              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium transition-colors flex items-center justify-center"
              title="Salvar"
            >
              {loading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 rounded text-xs font-medium transition-colors flex items-center justify-center"
              title="Cancelar"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-2 left-2 group/tag z-10">
      <span 
        className={`text-xs px-2 py-1 rounded-full font-medium transition-all ${
          isAdmin ? 'cursor-pointer hover:scale-105' : ''
        } ${
          isBacktest 
            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' 
            : 'bg-green-500/20 text-green-300 border border-green-500/30'
        }`}
        onClick={(e) => {
          if (isAdmin) {
            e.stopPropagation();
            onEdit(month, year, currentResultType);
          }
        }}
        title={isAdmin ? "Clique para editar tipo de resultado" : undefined}
      >
        {isBacktest ? 'Backtest' : 'Ao Vivo'}
        {isAdmin && (
          <span className="ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity">
            ✏️
          </span>
        )}
      </span>
    </div>
  );
};

export default ResultTypeTag;