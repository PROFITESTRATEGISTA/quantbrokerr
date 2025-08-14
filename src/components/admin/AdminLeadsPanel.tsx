import React, { useState, useEffect } from 'react';
import { Target, Users, Clock, Calendar, Mail, Send, CheckSquare, Square, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Lead {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  source: 'users' | 'waitlist' | 'consultation';
  portfolio_type?: string;
  capital_available?: string;
  status?: string;
  created_at: string;
}

const AdminLeadsPanel: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Email marketing
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sendingEmails, setSendingEmails] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, searchTerm, sourceFilter, statusFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from all sources
      const [usersResult, waitlistResult, consultationResult] = await Promise.all([
        supabase.from('user_profiles').select('id, email, full_name, phone, created_at'),
        supabase.from('waitlist_entries').select('id, email, full_name, phone, portfolio_type, capital_available, status, created_at'),
        supabase.from('consultation_forms').select('id, email, full_name, phone, consultation_type, capital_available, created_at').catch(() => ({ data: [], error: null }))
      ]);

      // Combine and deduplicate by email
      const allLeads: Lead[] = [];
      const emailSet = new Set<string>();

      // Add users
      if (usersResult.data) {
        usersResult.data.forEach(user => {
          if (!emailSet.has(user.email.toLowerCase())) {
            emailSet.add(user.email.toLowerCase());
            allLeads.push({
              id: user.id,
              email: user.email,
              full_name: user.full_name || '',
              phone: user.phone,
              source: 'users',
              created_at: user.created_at
            });
          }
        });
      }

      // Add waitlist entries
      if (waitlistResult.data) {
        waitlistResult.data.forEach(entry => {
          if (!emailSet.has(entry.email.toLowerCase())) {
            emailSet.add(entry.email.toLowerCase());
            allLeads.push({
              id: entry.id,
              email: entry.email,
              full_name: entry.full_name,
              phone: entry.phone,
              source: 'waitlist',
              portfolio_type: entry.portfolio_type,
              capital_available: entry.capital_available,
              status: entry.status,
              created_at: entry.created_at
            });
          }
        });
      }

      // Add consultation forms
      if (consultationResult.data) {
        consultationResult.data.forEach(form => {
          if (!emailSet.has(form.email.toLowerCase())) {
            emailSet.add(form.email.toLowerCase());
            allLeads.push({
              id: form.id,
              email: form.email,
              full_name: form.full_name,
              phone: form.phone,
              source: 'consultation',
              capital_available: form.capital_available,
              created_at: form.created_at
            });
          }
        });
      }

      // Sort by creation date (newest first)
      allLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setLeads(allLeads);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...leads];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.phone && lead.phone.includes(searchTerm))
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'contacted') {
        filtered = filtered.filter(lead => lead.status === 'contacted');
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(lead => !lead.status || lead.status === 'pending');
      }
    }

    setFilteredLeads(filtered);
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
    }
  };

  const getSourceDisplayName = (source: string) => {
    const sources = {
      'users': 'Usuários Cadastrados',
      'waitlist': 'Fila de Espera',
      'consultation': 'Formulários Consultoria'
    };
    return sources[source as keyof typeof sources] || source;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      'users': 'bg-blue-100 text-blue-800',
      'waitlist': 'bg-orange-100 text-orange-800',
      'consultation': 'bg-purple-100 text-purple-800'
    };
    return colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleSendBulkEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setError('Assunto e mensagem são obrigatórios');
      return;
    }

    try {
      setSendingEmails(true);
      setError(null);

      const selectedLeadsList = filteredLeads.filter(lead => selectedLeads.has(lead.id));
      
      // Aqui você integraria com seu provedor de email (SendGrid, Mailgun, etc.)
      // Por enquanto, vamos simular o envio
      console.log('📧 Enviando emails para:', selectedLeadsList.length, 'leads');
      console.log('📝 Assunto:', emailSubject);
      console.log('💬 Mensagem:', emailMessage);
      
      selectedLeadsList.forEach(lead => {
        const personalizedMessage = emailMessage.replace(/{nome}/g, lead.full_name || 'Cliente');
        console.log(`📤 Email para ${lead.email}:`, {
          subject: emailSubject,
          message: personalizedMessage
        });
      });

      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccess(`Emails enviados com sucesso para ${selectedLeadsList.length} leads!`);
      setShowEmailModal(false);
      setSelectedLeads(new Set());
      setEmailSubject('');
      setEmailMessage('');
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar emails');
    } finally {
      setSendingEmails(false);
    }
  };

  const getPreviewMessage = () => {
    if (!emailMessage) return '';
    return emailMessage.replace(/{nome}/g, 'João Silva');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalLeads = leads.length;
  const usersCount = leads.filter(l => l.source === 'users').length;
  const waitlistCount = leads.filter(l => l.source === 'waitlist').length;
  const consultationCount = leads.filter(l => l.source === 'consultation').length;
  const thisMonthLeads = leads.filter(lead => {
    const leadDate = new Date(lead.created_at);
    const now = new Date();
    return leadDate.getMonth() === now.getMonth() && leadDate.getFullYear() === now.getFullYear();
  }).length;

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
        
        <button
          onClick={() => setShowEmailModal(true)}
          disabled={selectedLeads.size === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Email em Massa ({selectedLeads.size})
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Total Leads Únicos</h3>
          <p className="text-2xl font-bold text-green-600">{totalLeads}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Usuários</h3>
          <p className="text-2xl font-bold text-blue-600">{usersCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Fila de Espera</h3>
          <p className="text-2xl font-bold text-orange-600">{waitlistCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500">Leads Este Mês</h3>
          <p className="text-2xl font-bold text-purple-600">{thisMonthLeads}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Fontes</option>
              <option value="users">Usuários Cadastrados</option>
              <option value="waitlist">Fila de Espera</option>
              <option value="consultation">Formulários Consultoria</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Sem Contato</option>
              <option value="contacted">Contatado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Leads Únicos ({filteredLeads.length} de {totalLeads})
          </h3>
          <p className="text-sm text-gray-600">Todos os leads únicos por email, sem duplicação entre fontes</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 hover:text-gray-700"
                  >
                    {selectedLeads.size === filteredLeads.length && filteredLeads.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    Selecionar
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fonte</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capital</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Registro</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSelectLead(lead.id)}
                      className="flex items-center justify-center"
                    >
                      {selectedLeads.has(lead.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {(lead.full_name || lead.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.full_name || 'Nome não informado'}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        {lead.phone && (
                          <div className="text-sm text-gray-500">{lead.phone}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSourceColor(lead.source)}`}>
                      {getSourceDisplayName(lead.source)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.capital_available || 'Não informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.portfolio_type ? (
                      <div>
                        <div className="font-medium">Interesse: {lead.portfolio_type}</div>
                        {lead.status && (
                          <div className="text-xs text-gray-500">Status: {lead.status}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={lead.status || 'pending'}
                      onChange={(e) => {
                        // Aqui você pode implementar a atualização do status
                        console.log('Updating status for', lead.email, 'to', e.target.value);
                      }}
                      className="text-xs px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="pending">Sem Contato</option>
                      <option value="contacted">Contatado</option>
                      <option value="converted">Convertido</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                        title="Enviar email individual"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      {lead.phone && (
                        <button
                          onClick={() => window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}`, '_blank')}
                          className="text-green-600 hover:text-green-800"
                          title="Contatar via WhatsApp"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum lead encontrado</h3>
            <p className="text-gray-600">Os leads aparecerão aqui conforme forem sendo gerados</p>
          </div>
        )}
      </div>

      {/* Distribution by Source */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Fonte</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{usersCount}</div>
            <div className="text-sm text-gray-600">Usuários Cadastrados</div>
            <div className="text-xs text-gray-500">{totalLeads > 0 ? ((usersCount / totalLeads) * 100).toFixed(1) : 0}% do total</div>
          </div>
          
          <div className="text-center">
            <Clock className="h-12 w-12 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600">{waitlistCount}</div>
            <div className="text-sm text-gray-600">Fila de Espera</div>
            <div className="text-xs text-gray-500">{totalLeads > 0 ? ((waitlistCount / totalLeads) * 100).toFixed(1) : 0}% do total</div>
          </div>
          
          <div className="text-center">
            <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600">{consultationCount}</div>
            <div className="text-sm text-gray-600">Formulários Consultoria</div>
            <div className="text-xs text-gray-500">{totalLeads > 0 ? ((consultationCount / totalLeads) * 100).toFixed(1) : 0}% do total</div>
          </div>
        </div>
      </div>

      {/* Email Marketing Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Email Marketing em Massa
                </h2>
                <p className="text-sm text-gray-600">
                  Enviando para {selectedLeads.size} leads selecionados
                </p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Selected Leads Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Leads Selecionados ({selectedLeads.size})
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
                    {filteredLeads
                      .filter(lead => selectedLeads.has(lead.id))
                      .map(lead => (
                        <div key={lead.id} className="flex items-center">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs mr-2">
                            {(lead.full_name || lead.email).charAt(0).toUpperCase()}
                          </div>
                          <span>{lead.full_name || lead.email}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Email Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assunto do Email *
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Oportunidade Exclusiva - Portfólios de IA"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensagem do Email *
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Olá {nome},

Espero que esteja bem! 

Tenho uma oportunidade exclusiva para você conhecer nossos Portfólios de IA Quant Broker...

Use {nome} para personalizar automaticamente com o nome do lead.

Atenciosamente,
Equipe Quant Broker"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use <code className="bg-gray-100 px-1 rounded">{'{nome}'}</code> para personalizar automaticamente
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Preview da Mensagem</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-80 overflow-y-auto">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        <strong>Para:</strong> joao.silva@email.com<br />
                        <strong>Assunto:</strong> {emailSubject || 'Assunto do email'}<br />
                        <br />
                        {getPreviewMessage() || 'Digite sua mensagem para ver o preview...'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-900 mb-2">⚠️ Importante</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Esta é uma simulação - integre com provedor real de email</li>
                      <li>• Respeite as leis de LGPD e anti-spam</li>
                      <li>• Inclua sempre opção de descadastro</li>
                      <li>• Teste com poucos emails primeiro</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSendBulkEmail}
                  disabled={sendingEmails || !emailSubject.trim() || !emailMessage.trim() || selectedLeads.size === 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sendingEmails ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Enviando Emails...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Enviar para {selectedLeads.size} Leads
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeadsPanel;