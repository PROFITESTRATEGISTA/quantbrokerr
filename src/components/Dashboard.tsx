import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Mail, Phone, MessageCircle, Target, UserCheck, Clock, AlertCircle, Edit3, Save, X, CheckCircle } from 'lucide-react';
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
  lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'no_contact';
  notes?: string;
  last_contact?: string;
  lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'no_contact';
  notes?: string;
  last_contact?: string;
}

const AdminLeadsPanel: React.FC = () => {
  const [leads, setLeads] = useState<LeadSource[]>([]);
  const [uniqueLeads, setUniqueLeads] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<'all' | 'user' | 'waitlist' | 'consultation'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'no_contact'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'no_contact'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    lead_status: string;
    notes: string;
  }>({
    lead_status: 'new',
    notes: ''
  });
  const [editingLead, setEditingLead] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    lead_status: string;
    notes: string;
  }>({
    lead_status: 'new',
    notes: ''
  });

  useEffect(() => {
    fetchAllLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [leads, filterSource, filterStatus, searchTerm]);

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
            created_at: user.created_at,
            lead_status: 'new'
            lead_status: 'new'
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
            consultation_type: form.consultation_type,
            lead_status: 'new'
            lead_status: 'new'
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
            portfolio_type: entry.portfolio_type,
            lead_status: 'new'
            lead_status: 'new'
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

    // Filter by lead status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => (lead.lead_status || 'new') === filterStatus);
    }

    // Filter by lead status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(lead => (lead.lead_status || 'new') === filterStatus);
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

  const updateLeadStatus = async (email: string, leadStatus: string, notes: string = '') => {
    try {
      setError(null);
      
      // Store lead status in localStorage (since we don't have a dedicated leads table)
      const leadStatusKey = `lead_status_${email}`;
      const leadData = {
        lead_status: leadStatus,
        notes: notes,
        last_contact: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem(leadStatusKey, JSON.stringify(leadData));
      
      // Update the leads array with new status
      setUniqueLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.email === email 
            ? { 
                ...lead, 
                lead_status: leadStatus as any,
                notes: notes,
                last_contact: new Date().toISOString()
              }
            : lead
        )
      );
      
      setSuccess('Status do lead atualizado com sucesso!');
      setEditingLead(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getLeadStatusFromStorage = (email: string) => {
    try {
      const stored = localStorage.getItem(`lead_status_${email}`);
      return stored ? JSON.parse(stored) : { lead_status: 'new', notes: '', last_contact: null };
    } catch {
      return { lead_status: 'new', notes: '', last_contact: null };
    }
  };

  const handleEditLead = (lead: LeadSource) => {
    const storedData = getLeadStatusFromStorage(lead.email);
    setEditingLead(lead.email);
    setEditForm({
      lead_status: storedData.lead_status || 'new',
      notes: storedData.notes || ''
    });
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;
    
    await updateLeadStatus(editingLead, editForm.lead_status, editForm.notes);
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setEditForm({ lead_status: 'new', notes: '' });
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'no_contact': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getLeadStatusDisplayName = (status: string) => {
    const names = {
      'new': 'Novo',
      'contacted': 'Contatado',
      'qualified': 'Qualificado',
      'converted': 'Convertido',
      'lost': 'Perdido',
      'no_contact': 'Sem Contato'
    };
    return names[status as keyof typeof names] || 'Novo';
  };
  const updateLeadStatus = async (email: string, leadStatus: string, notes: string = '') => {
    try {
      setError(null);
      
      // Store lead status in localStorage (since we don't have a dedicated leads table)
      const leadStatusKey = `lead_status_${email}`;
      const leadData = {
        lead_status: leadStatus,
        notes: notes,
        last_contact: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      localStorage.setItem(leadStatusKey, JSON.stringify(leadData));
      
      // Update the leads array with new status
      setUniqueLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.email === email 
            ? { 
                ...lead, 
                lead_status: leadStatus as any,
                notes: notes,
                last_contact: new Date().toISOString()
              }
            : lead
        )
      );
      
      setSuccess('Status do lead atualizado com sucesso!');
      setEditingLead(null);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const getLeadStatusFromStorage = (email: string) => {
    try {
      const stored = localStorage.getItem(`lead_status_${email}`);
      return stored ? JSON.parse(stored) : { lead_status: 'new', notes: '', last_contact: null };
    } catch {
      return { lead_status: 'new', notes: '', last_contact: null };
    }
  };

  const handleEditLead = (lead: LeadSource) => {
    const storedData = getLeadStatusFromStorage(lead.email);
    setEditingLead(lead.email);
    setEditForm({
      lead_status: storedData.lead_status || 'new',
      notes: storedData.notes || ''
    });
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;
    
    await updateLeadStatus(editingLead, editForm.lead_status, editForm.notes);
  };

  const handleCancelEdit = () => {
    setEditingLead(null);
    setEditForm({ lead_status: 'new', notes: '' });
  };

  const getLeadStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'qualified': return 'bg-purple-100 text-purple-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'no_contact': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getLeadStatusDisplayName = (status: string) => {
    const names = {
      'new': 'Novo',
      'contacted': 'Contatado',
      'qualified': 'Qualificado',
      'converted': 'Convertido',
      'lost': 'Perdido',
      'no_contact': 'Sem Contato'
    };
    return names[status as keyof typeof names] || 'Novo';
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

  // Calculate status metrics
  const leadsWithStoredStatus = uniqueLeads.map(lead => ({
    ...lead,
    ...getLeadStatusFromStorage(lead.email)
  }));

  const newLeads = leadsWithStoredStatus.filter(l => (l.lead_status || 'new') === 'new').length;
  const contactedLeads = leadsWithStoredStatus.filter(l => l.lead_status === 'contacted').length;
  const convertedLeads = leadsWithStoredStatus.filter(l => l.lead_status === 'converted').length;
  const conversionRate = totalUniqueLeads > 0 ? (convertedLeads / totalUniqueLeads) * 100 : 0;
  // Calculate status metrics
  const leadsWithStoredStatus = uniqueLeads.map(lead => ({
    ...lead,
    ...getLeadStatusFromStorage(lead.email)
  }));

  const newLeads = leadsWithStoredStatus.filter(l => (l.lead_status || 'new') === 'new').length;
  const contactedLeads = leadsWithStoredStatus.filter(l => l.lead_status === 'contacted').length;
  const convertedLeads = leadsWithStoredStatus.filter(l => l.lead_status === 'converted').length;
  const conversionRate = totalUniqueLeads > 0 ? (convertedLeads / totalUniqueLeads) * 100 : 0;
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

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Contatados</p>
              <p className="text-2xl font-bold text-yellow-600">{contactedLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Novos</p>
              <p className="text-2xl font-bold text-blue-600">{newLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <MessageCircle className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Contatados</p>
              <p className="text-2xl font-bold text-yellow-600">{contactedLeads}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Novos</p>
              <p className="text-2xl font-bold text-blue-600">{newLeads}</p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status do Lead</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novos</option>
              <option value="contacted">Contatados</option>
              <option value="qualified">Qualificados</option>
              <option value="converted">Convertidos</option>
              <option value="lost">Perdidos</option>
              <option value="no_contact">Sem Contato</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status do Lead</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="new">Novos</option>
              <option value="contacted">Contatados</option>
              <option value="qualified">Qualificados</option>
              <option value="converted">Convertidos</option>
              <option value="lost">Perdidos</option>
              <option value="no_contact">Sem Contato</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead, index) => {
                const SourceIcon = getSourceIcon(lead.source);
                const storedData = getLeadStatusFromStorage(lead.email);
                const leadStatus = storedData.lead_status || 'new';
                const storedData = getLeadStatusFromStorage(lead.email);
                const leadStatus = storedData.lead_status || 'new';
                
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingLead === lead.email ? (
                        <div className="space-y-2">
                          <select
                            value={editForm.lead_status}
                            onChange={(e) => setEditForm({...editForm, lead_status: e.target.value})}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="new">Novo</option>
                            <option value="contacted">Contatado</option>
                            <option value="qualified">Qualificado</option>
                            <option value="converted">Convertido</option>
                            <option value="lost">Perdido</option>
                            <option value="no_contact">Sem Contato</option>
                          </select>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            placeholder="Observações..."
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleSaveLead}
                              className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                            >
                              <Save className="w-3 h-3 mx-auto" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
                            >
                              <X className="w-3 h-3 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLeadStatusColor(leadStatus)}`}>
                            {getLeadStatusDisplayName(leadStatus)}
                          </span>
                          {storedData.notes && (
                            <div className="text-xs text-gray-500 max-w-[150px] truncate" title={storedData.notes}>
                              {storedData.notes}
                            </div>
                          )}
                          {storedData.last_contact && (
                            <div className="text-xs text-gray-400">
                              Último contato: {new Date(storedData.last_contact).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      )}
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
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar status do lead"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=Olá ${lead.full_name}, sou da Quant Broker. Vi seu interesse em nossos Portfólios de IA. Como posso ajudar?`, '_blank');
                            // Auto-update status to contacted when WhatsApp is opened
                            updateLeadStatus(lead.email, 'contacted', 'Contato via WhatsApp');
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditLead(lead)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar status do lead"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            window.open(`https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=Olá ${lead.full_name}, sou da Quant Broker. Vi seu interesse em nossos Portfólios de IA. Como posso ajudar?`, '_blank');
                            // Auto-update status to contacted when WhatsApp is opened
                            updateLeadStatus(lead.email, 'contacted', 'Contato via WhatsApp');
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Contatar via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
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

        {/* Lead Status Breakdown */}
        <div className="mt-8">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Status dos Leads</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-xl font-bold text-blue-600">{newLeads}</div>
              <div className="text-xs text-gray-600">Novos</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-xl font-bold text-yellow-600">{contactedLeads}</div>
              <div className="text-xs text-gray-600">Contatados</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-xl font-bold text-purple-600">
                {leadsWithStoredStatus.filter(l => l.lead_status === 'qualified').length}
              </div>
              <div className="text-xs text-gray-600">Qualificados</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-xl font-bold text-green-600">{convertedLeads}</div>
              <div className="text-xs text-gray-600">Convertidos</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-xl font-bold text-red-600">
                {leadsWithStoredStatus.filter(l => l.lead_status === 'lost').length}
              </div>
              <div className="text-xs text-gray-600">Perdidos</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-gray-600" />
              </div>
              <div className="text-xl font-bold text-gray-600">
                {leadsWithStoredStatus.filter(l => l.lead_status === 'no_contact').length}
              </div>
              <div className="text-xs text-gray-600">Sem Contato</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLeadsPanel;