import React, { useState, useEffect } from 'react';
import { Calendar, Users, Edit3, Save, X, Plus, Trash2, ExternalLink, CheckCircle, AlertCircle, MessageCircle, Send, Eye, EyeOff, Clock, Video, Globe, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  platform: string;
  event_link: string;
  is_active: boolean;
  max_participants: number;
  current_participants: number;
  invitation_message: string;
  created_at: string;
  updated_at: string;
}

interface Lead {
  email: string;
  full_name: string;
  phone: string;
  source: string;
  status?: string;
}

const AdminEventsPanel: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'live',
    platform: 'youtube',
    event_link: '',
    max_participants: 100,
    invitation_message: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchLeads();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const fetchLeads = async () => {
    try {
      // Buscar leads de todas as fontes
      const [usersResult, waitlistResult, consultationResult] = await Promise.all([
        supabase.from('user_profiles').select('id, email, full_name, phone, created_at'),
        supabase.from('waitlist_entries').select('id, email, full_name, phone, portfolio_type, status, created_at'),
        supabase.from('consultation_forms').select('id, email, full_name, phone, consultation_type, status, created_at')
      ]);

      const allLeads: Lead[] = [];

      // Adicionar usuários
      if (usersResult.data) {
        usersResult.data.forEach(user => {
          allLeads.push({
            email: user.email.toLowerCase(),
            full_name: user.full_name || 'Nome não informado',
            phone: user.phone || 'Telefone não informado',
            source: 'user'
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
            status: entry.status
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
            status: form.status
          });
        });
      }

      // Remover duplicatas por email
      const uniqueLeads = new Map<string, Lead>();
      allLeads.forEach(lead => {
        if (!uniqueLeads.has(lead.email)) {
          uniqueLeads.set(lead.email, lead);
        }
      });

      setLeads(Array.from(uniqueLeads.values()));
    } catch (error: any) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);

      const eventData = {
        ...newEvent,
        event_date: new Date(newEvent.event_date).toISOString(),
        is_active: true,
        current_participants: 0
      };

      const { error } = await supabase
        .from('events')
        .insert(eventData);

      if (error) throw error;

      setSuccess('Evento criado com sucesso!');
      setShowAddModal(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        event_type: 'live',
        platform: 'youtube',
        event_link: '',
        max_participants: 100,
        invitation_message: ''
      });
      fetchEvents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event.id);
    setEditForm({
      title: event.title,
      description: event.description,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      event_type: event.event_type,
      platform: event.platform,
      event_link: event.event_link,
      max_participants: event.max_participants,
      invitation_message: event.invitation_message,
      is_active: event.is_active
    });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    try {
      setError(null);

      const updateData = {
        ...editForm,
        event_date: new Date(editForm.event_date!).toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', editingEvent);

      if (error) throw error;

      setSuccess('Evento atualizado com sucesso!');
      setEditingEvent(null);
      setEditForm({});
      fetchEvents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuccess('Evento excluído com sucesso!');
      fetchEvents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_active: !currentStatus })
        .eq('id', eventId);

      if (error) throw error;

      setSuccess(`Evento ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchEvents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleInviteLeads = (event: Event) => {
    setSelectedEvent(event);
    setCustomMessage(event.invitation_message || getDefaultInvitationMessage(event));
    setShowInviteModal(true);
  };

  const getDefaultInvitationMessage = (event: Event) => {
    return `🚀 *${event.title}*

Olá ${'{nome}'}! 

Você está convidado(a) para nossa live exclusiva sobre Portfólios de IA Quant Broker.

📅 *Data:* ${new Date(event.event_date).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}
⏰ *Horário:* ${new Date(event.event_date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}

${event.description}

🔗 *Link para participar:* ${event.event_link}

Não perca esta oportunidade de conhecer nossos resultados em detalhes!

Equipe Quant Broker`;
  };

  const sendInvitations = async () => {
    if (selectedLeads.length === 0) {
      setError('Selecione pelo menos um lead para enviar convites');
      return;
    }

    try {
      setSendingInvites(true);
      setError(null);

      const selectedLeadData = leads.filter(lead => selectedLeads.includes(lead.email));
      
      // Simular envio de convites (aqui você integraria com WhatsApp Business API ou similar)
      for (const lead of selectedLeadData) {
        const personalizedMessage = customMessage.replace('{nome}', lead.full_name);
        
        // Abrir WhatsApp para cada lead (em produção, isso seria automatizado)
        const whatsappUrl = `https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(personalizedMessage)}`;
        
        // Em um cenário real, você enviaria via API
        console.log(`Convite enviado para ${lead.full_name}: ${whatsappUrl}`);
      }

      // Atualizar contador de participantes
      if (selectedEvent) {
        await supabase
          .from('events')
          .update({ 
            current_participants: selectedEvent.current_participants + selectedLeads.length 
          })
          .eq('id', selectedEvent.id);
      }

      setSuccess(`Convites preparados para ${selectedLeads.length} leads! Abra os links do WhatsApp para enviar.`);
      setShowInviteModal(false);
      setSelectedLeads([]);
      fetchEvents();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSendingInvites(false);
    }
  };

  const getEventTypeDisplayName = (type: string) => {
    const types = {
      'live': 'Live',
      'webinar': 'Webinar',
      'presentation': 'Apresentação',
      'workshop': 'Workshop'
    };
    return types[type as keyof typeof types] || type;
  };

  const getPlatformDisplayName = (platform: string) => {
    const platforms = {
      'youtube': 'YouTube',
      'zoom': 'Zoom',
      'teams': 'Microsoft Teams',
      'meet': 'Google Meet',
      'instagram': 'Instagram',
      'facebook': 'Facebook'
    };
    return platforms[platform as keyof typeof platforms] || platform;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'live': return Video;
      case 'webinar': return Globe;
      case 'presentation': return Users;
      case 'workshop': return Zap;
      default: return Calendar;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'live': return 'bg-red-100 text-red-800';
      case 'webinar': return 'bg-blue-100 text-blue-800';
      case 'presentation': return 'bg-purple-100 text-purple-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Calendar className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Eventos</h2>
            <p className="text-gray-600">Agende lives e envie convites para leads</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
              <p className="text-2xl font-bold text-purple-600">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Eventos Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {events.filter(e => e.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Participantes</p>
              <p className="text-2xl font-bold text-blue-600">
                {events.reduce((sum, e) => sum + e.current_participants, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Send className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Leads Disponíveis</p>
              <p className="text-2xl font-bold text-orange-600">{leads.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Eventos</h3>
          <p className="text-sm text-gray-600">Gerencie lives, webinars e apresentações</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data/Hora</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo/Plataforma</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participantes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => {
                const EventIcon = getEventTypeIcon(event.event_type);
                const isUpcoming = new Date(event.event_date) > new Date();
                
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {editingEvent === event.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editForm.title || ''}
                            onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                            className="w-full text-sm font-medium border border-gray-300 rounded px-2 py-1"
                            placeholder="Título do evento"
                          />
                          <textarea
                            value={editForm.description || ''}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                            placeholder="Descrição"
                            rows={2}
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{event.title}</div>
                          <div className="text-sm text-gray-500 max-w-[200px] truncate">
                            {event.description}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingEvent === event.id ? (
                        <input
                          type="datetime-local"
                          value={editForm.event_date || ''}
                          onChange={(e) => setEditForm({...editForm, event_date: e.target.value})}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(event.event_date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.event_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                          <div className={`text-xs ${isUpcoming ? 'text-green-600' : 'text-gray-500'}`}>
                            {isUpcoming ? 'Próximo' : 'Passado'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingEvent === event.id ? (
                        <div className="space-y-2">
                          <select
                            value={editForm.event_type || ''}
                            onChange={(e) => setEditForm({...editForm, event_type: e.target.value})}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="live">Live</option>
                            <option value="webinar">Webinar</option>
                            <option value="presentation">Apresentação</option>
                            <option value="workshop">Workshop</option>
                          </select>
                          <select
                            value={editForm.platform || ''}
                            onChange={(e) => setEditForm({...editForm, platform: e.target.value})}
                            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="zoom">Zoom</option>
                            <option value="teams">Microsoft Teams</option>
                            <option value="meet">Google Meet</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                            <EventIcon className="h-3 w-3 mr-1" />
                            {getEventTypeDisplayName(event.event_type)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {getPlatformDisplayName(event.platform)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingEvent === event.id ? (
                        <input
                          type="number"
                          min="1"
                          value={editForm.max_participants || ''}
                          onChange={(e) => setEditForm({...editForm, max_participants: parseInt(e.target.value)})}
                          className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {event.current_participants} / {event.max_participants}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min((event.current_participants / event.max_participants) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleEventStatus(event.id, event.is_active)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            event.is_active ? 'bg-green-600' : 'bg-gray-400'
                          }`}
                          title={event.is_active ? 'Desativar evento' : 'Ativar evento'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              event.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-xs ${event.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                          {event.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {editingEvent === event.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="text-green-600 hover:text-green-800"
                              title="Salvar alterações"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingEvent(null);
                                setEditForm({});
                              }}
                              className="text-gray-600 hover:text-gray-800"
                              title="Cancelar edição"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Editar evento"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleInviteLeads(event)}
                              className="text-purple-600 hover:text-purple-800"
                              title="Convidar leads"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            {event.event_link && (
                              <a
                                href={event.event_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800"
                                title="Abrir link do evento"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Excluir evento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600 mb-4">Comece criando seu primeiro evento</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Evento
            </button>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Novo Evento</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Evento *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Live - Resultados Dezembro 2024"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Descreva o que será apresentado no evento"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data e Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Participantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newEvent.max_participants}
                    onChange={(e) => setNewEvent({...newEvent, max_participants: parseInt(e.target.value) || 100})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Evento *
                  </label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="live">Live</option>
                    <option value="webinar">Webinar</option>
                    <option value="presentation">Apresentação</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plataforma *
                  </label>
                  <select
                    value={newEvent.platform}
                    onChange={(e) => setNewEvent({...newEvent, platform: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="youtube">YouTube</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="meet">Google Meet</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link do Evento
                  </label>
                  <input
                    type="url"
                    value={newEvent.event_link}
                    onChange={(e) => setNewEvent({...newEvent, event_link: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://youtube.com/live/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem de Convite Personalizada
                  </label>
                  <textarea
                    value={newEvent.invitation_message}
                    onChange={(e) => setNewEvent({...newEvent, invitation_message: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Mensagem personalizada para convites (opcional)"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{nome}'} para personalizar com o nome do lead
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Criar Evento
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Leads Modal */}
      {showInviteModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Convidar Leads</h2>
                <p className="text-sm text-gray-600">{selectedEvent.title}</p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Event Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Detalhes do Evento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-purple-700 font-medium">Data:</span> {new Date(selectedEvent.event_date).toLocaleDateString('pt-BR')}
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Horário:</span> {new Date(selectedEvent.event_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Plataforma:</span> {getPlatformDisplayName(selectedEvent.platform)}
                  </div>
                  <div>
                    <span className="text-purple-700 font-medium">Vagas:</span> {selectedEvent.current_participants}/{selectedEvent.max_participants}
                  </div>
                </div>
              </div>

              {/* Lead Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Selecionar Leads ({selectedLeads.length} selecionados)</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedLeads(leads.map(l => l.email))}
                      className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200"
                    >
                      Selecionar Todos
                    </button>
                    <button
                      onClick={() => setSelectedLeads([])}
                      className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200"
                    >
                      Limpar Seleção
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {leads.map((lead) => (
                    <label key={lead.email} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeads([...selectedLeads, lead.email]);
                          } else {
                            setSelectedLeads(selectedLeads.filter(email => email !== lead.email));
                          }
                        }}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-3"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{lead.full_name}</div>
                        <div className="text-sm text-gray-500">{lead.email}</div>
                        <div className="text-xs text-gray-400">{lead.phone}</div>
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {lead.source === 'user' ? 'Usuário' : lead.source === 'waitlist' ? 'Fila' : 'Consultoria'}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Message Preview */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Mensagem de Convite</h3>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={8}
                  placeholder="Digite a mensagem de convite..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use {'{nome}'} para personalizar com o nome do lead
                </p>
              </div>

              {/* Preview */}
              {selectedLeads.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Preview da Mensagem</h4>
                  <div className="bg-white p-3 rounded border text-sm">
                    {customMessage.replace('{nome}', leads.find(l => l.email === selectedLeads[0])?.full_name || 'Nome do Lead')}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={sendInvitations}
                  disabled={sendingInvites || selectedLeads.length === 0}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sendingInvites ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Preparando Convites...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Convites ({selectedLeads.length})
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
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

export default AdminEventsPanel;