import React, { useState, useEffect } from 'react';
import { Users, Edit3, Save, X, Plus, Trash2, Shield, Mail, Phone, Calendar, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  leverage_multiplier: number;
  current_leverage?: number;
  plan_status?: string;
  is_active: boolean;
  contracted_plan: string | null;
  created_at: string;
  updated_at: string;
  phone_confirmed_at?: string | null;
  has_profile?: boolean;
}

const UserManagementPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    phone: '',
    full_name: '',
    is_active: true
  });
  const [isAdmin] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching users via admin edge function...');
      
      // First, try to get current user to verify admin access
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        setError('Erro de autenticação');
        return;
      }
      
      if (!currentUser || currentUser.email !== 'pedropardal04@gmail.com') {
        setError('Acesso negado. Apenas administradores podem ver a lista de usuários.');
        return;
      }
      
      console.log('✅ Admin access verified for:', currentUser.email);
      
      // Use admin edge function to get users with proper permissions
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.users) {
        console.log('✅ Users loaded from edge function:', result.users.length);
        setUsers(result.users);
        
        if (result.users.length === 0) {
          setError('Nenhum usuário encontrado no sistema. Clique em "Sincronizar Usuários" para buscar usuários do sistema de autenticação.');
        }
      } else {
        throw new Error(result.error || 'Erro ao carregar usuários');
      }
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(`Erro ao carregar usuários: ${error.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user.id);
    console.log('🔧 Editing user:', user.email, 'Current values:', {
      plan: user.contracted_plan,
      leverage: user.current_leverage || user.leverage_multiplier,
      active: user.is_active
    });
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      current_leverage: Number(user.current_leverage || user.leverage_multiplier || 1),
      contracted_plan: user.contracted_plan || 'none',
      plan_status: user.plan_status || 'inactive',
      is_active: user.is_active !== false // Default to true if undefined
    });
    setError(null);
    setSuccess(null);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      setError(null);
      const userToEdit = users.find(u => u.id === editingUser);
      console.log('💾 Saving user edit for:', userToEdit?.email);
      console.log('📝 Form data:', editForm);
      
      // Prepare update data - only update changed fields
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Only include fields that are actually being edited
      if (editForm.full_name !== undefined) {
        updateData.full_name = editForm.full_name || '';
      }
      if (editForm.phone !== undefined) {
        updateData.phone = editForm.phone || null;
      }
      if (editForm.current_leverage !== undefined) {
        updateData.current_leverage = Number(editForm.current_leverage) || 1;
        updateData.leverage_multiplier = Number(editForm.current_leverage) || 1; // Keep both in sync
      }
      if (editForm.contracted_plan !== undefined) {
        updateData.contracted_plan = editForm.contracted_plan;
        updateData.plan_status = editForm.contracted_plan && editForm.contracted_plan !== 'none' ? 'active' : 'inactive';
      }
      if (editForm.is_active !== undefined) {
        updateData.is_active = editForm.is_active;
      }
      
      console.log('📤 Sending update:', updateData);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', editingUser)
        .select();

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }
      
      console.log('✅ Update successful:', data);
      
      setSuccess('Usuário atualizado com sucesso!');
      setEditingUser(null);
      setEditForm({});
      await fetchUsers();
    } catch (error: any) {
      console.error('❌ Error saving user edit:', error);
      setError(error.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
    setError(null);
    setSuccess(null);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      // First delete from user_profiles (if exists)
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (error && !error.message.includes('No rows found')) {
        throw error;
      }
      
      // Then delete from auth (admin operation)
      const { error: authError } = await supabase.auth.admin.deleteUser(id);
      
      if (authError) {
        console.warn('Warning deleting auth user:', authError);
        // Don't throw error here as profile deletion might be enough
      }
      
      setSuccess('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSyncUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      console.log('🔄 Sincronizando usuários...');
      
      // Use admin edge function to sync users
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSuccess(result.message || 'Sincronização concluída com sucesso!');
        await fetchUsers();
      } else {
        throw new Error(result.error || 'Erro na sincronização');
      }
      
    } catch (error: any) {
      console.error('Sync error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Use admin edge function to create user
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserForm.email,
          phone: newUserForm.phone,
          full_name: newUserForm.full_name,
          is_active: newUserForm.is_active
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSuccess(result.message || 'Usuário criado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao criar usuário');
      }
      
      setShowAddModal(false);
      setNewUserForm({
        email: '',
        phone: '',
        full_name: '',
        is_active: true
      });
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message);
    }
  };

  const getPlanDisplayName = (plan: string | null) => {
    if (!plan || plan === 'none') return 'Nenhum';
    const names = {
      'bitcoin': 'Bitcoin',
      'mini-indice': 'Mini Índice',
      'mini-dolar': 'Mini Dólar',
      'portfolio-completo': 'Portfólio Completo'
    };
    return names[plan as keyof typeof names] || plan;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-12 w-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Central de Usuários</h1>
                <p className="text-gray-600">Gerencie perfis de usuários e contratos</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSyncUsers}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4" />
                {loading ? 'Sincronizando...' : 'Sincronizar Usuários'}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Usuário
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-blue-600">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Com Contratos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.contracted_plan && u.contracted_plan !== 'none').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Novos (30 dias)</p>
                <p className="text-2xl font-bold text-orange-600">
                  {users.filter(u => {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return new Date(u.created_at) > thirtyDaysAgo;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Usuários</h2>
            <p className="text-sm text-gray-600">Gerencie perfis, contratos e configurações dos usuários</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Login</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {editingUser === user.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-900"
                            title="Salvar alterações"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                            title="Cancelar edição"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar usuário"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir usuário"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {(user.full_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">ID: {user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={editForm.full_name || ''}
                          onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                          className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 min-w-[150px]"
                          placeholder="Nome completo"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || 'Nome não informado'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 min-w-[140px]"
                          placeholder="(11) 99999-9999"
                        />
                      ) : (
                        <div className="space-y-1">
                          {user.phone ? (
                            <>
                              <div className="text-sm text-gray-900 font-medium">
                                {user.phone}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => window.open(`https://wa.me/55${user.phone.replace(/\D/g, '')}?text=Olá, sou do Quant Broker e estou aqui para te ajudar com seu portfólio de IA. Como posso ajudar?`, '_blank')}
                                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  WhatsApp
                                </button>
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Não informado</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email_confirmed_at ? (
                        <div>
                          <div className="text-gray-900 font-medium">
                            {new Date(user.email_confirmed_at).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(user.email_confirmed_at).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Email não confirmado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.is_active ? 'active' : 'inactive'}
                          onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'active'})}
                          className="text-sm border border-gray-300 rounded px-2 py-1 min-w-[80px]"
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-600 mb-4">Os usuários cadastrados aparecerão aqui</p>
              <button
                onClick={handleSyncUsers}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                Sincronizar Usuários do Auth
              </button>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Novo Usuário</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddUserManual} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="usuario@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newUserForm.phone}
                      onChange={(e) => setNewUserForm({...newUserForm, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={newUserForm.full_name}
                      onChange={(e) => setNewUserForm({...newUserForm, full_name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do usuário"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newUserForm.is_active ? 'active' : 'inactive'}
                      onChange={(e) => setNewUserForm({...newUserForm, is_active: e.target.value === 'active'})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Informações sobre a tabela user_profiles</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Conectada à tabela de autenticação via foreign key</li>
                    <li>• Planos e alavancagem gerenciados via contratos</li>
                    <li>• Policies de segurança configuradas</li>
                    <li>• Triggers automáticos para atualizações</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> O usuário será criado com a senha temporária "TempPassword123!" 
                    e deverá alterá-la no primeiro login.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    Criar Usuário
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
      </div>
    </div>
  );
};

export default UserManagementPanel;