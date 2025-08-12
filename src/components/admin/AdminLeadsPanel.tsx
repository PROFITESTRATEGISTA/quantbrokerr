import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Mail, Phone, MessageCircle, Target, UserCheck, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LeadSource {
  email: string;
  full_name: string;
  phone: string;
  source: 'user' | 'waitlist' | 'consultation';
  created_at: string;
  status?: string;
  portfolio_type?: string;
  consultation_type?: string;
}

const AdminLeadsPanel: React.FC = () => {
  const [leads, setLeads] = useState<LeadSource[]>([]);
  const [uniqueLeads, setUniqueLeads] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | 'user' | 'waitlist' | 'consultation'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, filterSource, searchTerm]);

  const fetchAllLeads = async () => {
    try {
      setLoading(true);
      
      // Buscar dados de todas as fontes
      const [usersResult, waitlistResult, consultationResult] = await Promise.all([
        supabase.from('user_profiles').select('id, email, full_name, phone, created_at'),
        supabase.from('waitlist_entries').select('id, email, full_name, phone, portfolio_type, status, created_at'),
        supabase.from('consultation_forms').select('id, email, full_name, phone, consultation_type, status, created_at')
      ]);

      const allLeads: LeadSource[] = [];

      // Adicionar usuários
      if (usersResult.data) {
        usersResult.data.forEach(user => {
          allLeads.push({
            email: user.email.toLowerCase(),
            full_name: user.full_name || 'Nome não informado',
            phone: user.phone || 'Telefone não informado',
            source: 'user',
            created_at: user.created_at
          });
        });
      }

      // Adicionar formulários de consultoria
      if (consultationResult.data) {
        consultationResult.data.forEach(form => {
          allLeads.push({
            email: form.email.toLowerCase(),
            full_name: form.full_name,
            phone: form.phone,
            source: 'consultation',
            created_at: form.created_at,
            status: form.status,
            consultation_type: form.consultation_type
          });
        });
      }

      // Adicionar fila de espera
      if (waitlistResult.data) {
        waitlistResult.data.forEach(entry => {
          allLeads.push({
            email: entry.email.toLowerCase(),
            full_name: entry.full_name,
            phone: entry.phone,
            source: 'waitlist',
            created_at: entry.created_at,
            status: entry.status,
            portfolio_type: entry.portfolio_type
          });
        });
      }
      setLeads(allLeads);

      // Criar lista de leads únicos (sem duplicação por email)
      const uniqueLeadsMap = new Map<string, LeadSource>();
      
      // Ordenar por data de criação (mais antigo primeiro para manter o primeiro contato)
      const sortedLeads = allLeads.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedLeads.forEach(lead => {
        if (!uniqueLeadsMap.has(lead.email)) {
          uniqueLeadsMap.set(lead.email, lead);
        }
      });

      setUniqueLeads(Array.from(uniqueLeadsMap.values()));

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...uniqueLeads];

    // Filter by source
    if (filterSource !== 'all') {
      filtered = filtered.filter(lead => lead.source === filterSource);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
      );
    }

    return filtered;
  };

  const filteredLeads = applyFilters();

  const getSourceDisplayName = (source: string) => {
    const names = {
      'user': 'Usuário Cadastrado',
      'waitlist': 'Fila de Espera',
      'consultation': 'Formulário Consultoria'
    };
    return names[source as keyof typeof names] || source;
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'waitlist': return 'bg-orange-100 text-orange-800';
      case 'consultation': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'user': return Users;
      case 'waitlist': return Clock;
      case 'consultation': return Calendar;
      default: return Users;
    }
  };

  // Calculate metrics
  const totalUniqueLeads = uniqueLeads.length;
  const userLeads = uniqueLeads.filter(l => l.source === 'user').length;
  const waitlistLeads = uniqueLeads.filter(l => l.source === 'waitlist').length;
  const consultationLeads = uniqueLeads.filter(l => l.source === 'consultation').length;

  // Calculate leads this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthLeads = uniqueLeads.filter(lead => {
    const leadDate = new Date(lead.created_at);
    return leadDate.getMonth() === currentMonth && leadDate.getFullYear() === currentYear;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Target className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Central de Leads</h2>
            <p className="text-gray-600">Leads únicos de todas as fontes (sem duplicação por email)</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads Únicos</p>
              <p className="text-2xl font-bold text-green-600">{totalUniqueLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Usuários</p>
              <p className="text-2xl font-bold text-blue-600">{userLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Fila de Espera</p>
              <p className="text-2xl font-bold text-orange-600">{waitlistLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Este Mês</p>
              <p className="text-2xl font-bold text-blue-600">{thisMonthLeads}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por nome, email ou telefone..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fonte</label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Fontes</option>
              <option value="user">Usuários Cadastrados</option>
              <option value="waitlist">Fila de Espera</option>
              <option value="consultation">Formulários Consultoria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Leads Únicos ({filteredLeads.length} de {totalUniqueLeads})
          </h3>
          <p className="text-sm text-gray-600">
            Todos os leads únicos por email, sem duplicação entre fontes
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fonte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead, index) => {
                const SourceIcon = getSourceIcon(lead.source);
                
                return (
                  <tr key={`${lead.email}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {lead.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{lead.full_name}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          <div className="text-sm text-gray-500">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                          lead.source === 'user' ? 'bg-blue-100' :
                          lead.source === 'waitlist' ? 'bg-orange-100' : 'bg-purple-100'
                        }`}>
                          <SourceIcon className={`h-4 w-4 ${
                            lead.source === 'user' ? 'text-blue-600' :
                            lead.source === 'waitlist' ? 'text-orange-600' : 'text-purple-600'
                          }`} />
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(lead.source)}`}>
                          {getSourceDisplayName(lead.source)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {lead.portfolio_type && (
                          <div className="text-gray-900 font-medium">
                            Interesse: {lead.portfolio_type}
                          </div>
                        )}
                        {lead.consultation_type && (
                          <div className="text-gray-900 font-medium">
                            Consultoria: {lead.consultation_type}
                          </div>
                        )}
                        {lead.status && (
                          <div className="text-gray-500 text-xs">
                            Status: {lead.status}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=Olá ${lead.full_name}, sou da Quant Broker. Vi seu interesse em nossos Portfólios de IA. Como posso ajudar?`, '_blank')}
                        className="text-green-600 hover:text-green-800"
                        title="Contatar via WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterSource !== 'all' ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterSource !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Os leads aparecerão aqui conforme forem sendo captados'
              }
            </p>
          </div>
        )}
      </div>

      {/* Lead Sources Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Fonte</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{userLeads}</div>
            <div className="text-sm text-gray-600">Usuários Cadastrados</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalUniqueLeads > 0 ? ((userLeads / totalUniqueLeads) * 100).toFixed(1) : 0}% do total
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{waitlistLeads}</div>
            <div className="text-sm text-gray-600">Fila de Espera</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalUniqueLeads > 0 ? ((waitlistLeads / totalUniqueLeads) * 100).toFixed(1) : 0}% do total
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{consultationLeads}</div>
            <div className="text-sm text-gray-600">Formulários Consultoria</div>
            <div className="text-xs text-gray-500 mt-1">
              {totalUniqueLeads > 0 ? ((consultationLeads / totalUniqueLeads) * 100).toFixed(1) : 0}% do total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeadsPanel;