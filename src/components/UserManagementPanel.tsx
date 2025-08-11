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
    leverage_multiplier: 1,
    contracted_plan: 'none',
    is_active: true
  });
  const [isAdmin] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching all users via edge function...');

      // Tentar buscar todos os usuários via edge function
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅ Usuários carregados via edge function:', result.users.length);
          console.log('
          )
        }
      }
    }
  }
}📊 Total auth users:', result.total_auth_users);
          console.log('📊 Total profiles:', result.total_profiles);
          setUsers(result.users);
          return;
        } else {
          throw new Error(result.error || 'Erro na edge function');
        }
      } catch (edgeError) {
        console.warn('⚠️ Edge function não disponível, usando fallback:', edgeError);
        
        // Fallback: buscar apenas da tabela user_profiles
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching users from profiles:', error);
          setError('Erro ao carregar usuários');
          return;
        }
        
        console.log('📊 Users found in user_profiles (fallback):', (data || []).length);
        setUsers(data || []);
        setError('Lista limitada aos usuários com perfis. Use "Sincronizar Usuários" para carregar todos.');
      }
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError('Erro ao carregar usuários');
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
      
      console.log('🔄 Sincronizando usuários via edge function...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        console.log('✅ Sincronização concluída:', result);
        
        // Recarregar lista de usuários
        await fetchUsers();
      } else {
        throw new Error(result.error || 'Erro na sincronização');
      }
      
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      setError(`Erro na sincronização: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUserManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Criar usuário através do signup normal
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: 'TempPassword123!',
        options: {
          data: {
            full_name: newUserForm.full_name,
            phone: newUserForm.phone
          }
        }
      });

      if (authError) throw authError;

      // O trigger handle_new_user criará automaticamente o perfil
      // Aguardar um pouco para o trigger executar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Atualizar o perfil com dados adicionais
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: newUserForm.full_name,
            phone: newUserForm.phone,
            leverage_multiplier: newUserForm.leverage_multiplier,
            contracted_plan: newUserForm.contracted_plan,
            is_active: newUserForm.is_active
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.warn('Warning updating profile:', profileError);
        }
      }

      setSuccess('Usuário criado com sucesso! Senha temporária: TempPassword123!');
      setShowAddModal(false);
      setNewUserForm({
        email: '',
        phone: '',
        full_name: '',
        leverage_multiplier: 1,
        contracted_plan: 'none',
        is_active: true
      });
      fetchUsers();
    } catch (error: any) {
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tel. Verificado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alavancagem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
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
                          {editingUser === user.id ? (
                            <input
                              type="text"
                              value={editForm.full_name || ''}
                              onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                              className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                              placeholder="Nome completo"
                            />
                          ) : (
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || 'Nome não informado'}
                            </div>
                          )}
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <input
                          type="tel"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-full"
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
                                  onClick={() => window.open(`https://wa.me/55${user.phone.replace(/\D/g, '')}?text=Olá, sou do Quant Broker e estou aqui para te ajudar a escolher o portfólio de IA preferido. Como posso ajudar?`, '_blank')}
                                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                                >
                                  <MessageCircle className="h-3 w-3" />
                                  WhatsApp
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-sm text-gray-400">Não informado</span>
                              {isAdmin && (
                                <button
                                  onClick={() => window.open(`https://wa.me/5511975333355?text=Olá, sou do Quant Broker e estou aqui para te ajudar a escolher o portfólio de IA preferido. Como posso ajudar?`, '_blank')}
                                  className="block text-xs text-blue-600 hover:text-blue-800"
                                >
                                  + Adicionar telefone
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.phone_confirmed_at 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.phone_confirmed_at ? 'Verificado' : 'Não verificado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.contracted_plan || user.contracted_plan || 'none'}
                          onChange={(e) => {
                            const newPlan = e.target.value;
                            console.log('🔧 Changing plan to:', newPlan);
                            setEditForm({...editForm, contracted_plan: newPlan});
                          }}
                          className="text-sm border border-gray-300 rounded px-3 py-2 w-full min-w-[160px] bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                          disabled={false}
                        >
                          <option value="none">Nenhum</option>
                          <option value="bitcoin">Bitcoin</option>
                          <option value="mini-indice">Mini Índice</option>
                          <option value="mini-dolar">Mini Dólar</option>
                          <option value="portfolio-completo">Portfólio Completo</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.contracted_plan && user.contracted_plan !== 'none'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getPlanDisplayName(user.contracted_plan)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <>
                          <input
                            type="number"
                            min="1"
                            value={editForm.current_leverage || user.current_leverage || user.leverage_multiplier || 1}
                        </>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {user.current_leverage || user.leverage_multiplier || 1}x
                          </div>
                          <div className="text-xs text-gray-500">
                            Sem limite
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.is_active ? 'active' : 'inactive'}
                          onChange={(e) => setEditForm({...editForm, is_active: e.target.value === 'active'})}
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-full min-w-[80px]"
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
                      {user.updated_at ? new Date(user.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
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
              <p className="text-gray-600">Os usuários cadastrados aparecerão aqui</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alavancagem</label>
                    <input
                      type="number"
                      min="1"
                      value={newUserForm.leverage_multiplier}
                      onChange={(e) => setNewUserForm({...newUserForm, leverage_multiplier: parseInt(e.target.value) || 1})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Digite qualquer valor (sem limite máximo)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plano Contratado</label>
                    <select
                      value={newUserForm.contracted_plan}
                      onChange={(e) => setNewUserForm({...newUserForm, contracted_plan: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">Nenhum</option>
                      <option value="bitcoin">Bitcoin</option>
                      <option value="mini-indice">Mini Índice</option>
                      <option value="mini-dolar">Mini Dólar</option>
                      <option value="portfolio-completo">Portfólio Completo</option>
                    </select>
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
                  <h4 className="font-semibold text-blue-900 mb-2">Controle de Alavancagem</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Alavancagem pode ser definida livremente (sem limite)</li>
                    <li>• Digite qualquer valor numérico desejado</li>
                    <li>• Mudanças são registradas no histórico</li>
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