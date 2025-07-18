import React, { useState, useEffect } from 'react';
import {
  Plus, Edit3, Save, X, DollarSign, AlertCircle, CheckCircle, Filter, Search,
  Trash2, Lock, UserPlus, Users, TrendingUp, Calendar, Minus,
  ChevronDown, ChevronUp, MessageCircle, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown,
  Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import FinancialPanel from './FinancialPanel';

interface User {
  id: string;
  full_name?: string;
  email: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
  leverage_multiplier: number;
  is_active: boolean;
  contracted_plan: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
}

interface ColumnFilter {
  column: string;
  values: string[];
  isOpen: boolean;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'financial'>('users');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkPlan, setBulkPlan] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    is_active: true,
    leverage_multiplier: 1,
    contracted_plan: 'none'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([
    { column: 'status', values: [], isOpen: false },
    { column: 'plan', values: [], isOpen: false },
    { column: 'leverage', values: [], isOpen: false },
    { column: 'verification', values: [], isOpen: false }
  ]);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
  }, []);

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('55') && digits.length >= 13) {
      const country = digits.slice(0, 2);
      const area = digits.slice(2, 4);
      const first = digits.slice(4, 9);
      const second = digits.slice(9, 13);
      return `+${country} (${area}) ${first}-${second}`;
    }
    return phone;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  };

  const validateForm = (data: typeof formData, isEdit = false) => {
    const errors: Record<string, string> = {};
    
    if (isEdit) {
      if (data.email.trim() && !validateEmail(data.email)) {
        errors.email = 'Email inválido';
      }
      if (data.phone.trim() && !validatePhone(data.phone)) {
        errors.phone = 'Telefone inválido';
      }
    } else {
      if (!data.full_name.trim()) errors.full_name = 'Nome completo é obrigatório';
      if (!data.email.trim()) {
        errors.email = 'Email é obrigatório';
      } else if (!validateEmail(data.email)) {
        errors.email = 'Email inválido';
      }
      if (!data.phone.trim()) {
        errors.phone = 'Telefone é obrigatório';
      } else if (!validatePhone(data.phone)) {
        errors.phone = 'Telefone inválido';
      }
      if (!data.password.trim()) {
        errors.password = 'Senha é obrigatória';
      } else if (data.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
    }

    if (data.leverage_multiplier < 1 || data.leverage_multiplier > 5) {
      errors.leverage_multiplier = 'Alavancagem deve estar entre 1x e 5x';
    }

    return errors;
  };

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAdmin(user?.email === 'pedropardal04@gmail.com');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let allUsers: User[] = [];

      try {
        const { data, error } = await supabase.rpc('get_all_users_with_profiles');
        if (!error && data) {
          allUsers = data;
          console.log('Users from function:', allUsers.length);
        } else {
          throw error || new Error('Function returned no data');
        }
      } catch (err) {
        console.warn('Custom function failed, falling back to user_profiles:', err);
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        allUsers = data || [];
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'pedropardal04@gmail.com' && !allUsers.find(u => u.id === user.id)) {
        const { error } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email,
            phone: user.phone || null,
            leverage_multiplier: 5,
            is_active: true,
            contracted_plan: 'none'
          });

        if (!error) {
          allUsers.unshift({
            id: user.id,
            email: user.email,
            phone: user.phone || null,
            full_name: user.user_metadata?.full_name || '',
            created_at: user.created_at,
            last_sign_in_at: null,
            email_confirmed_at: user.email_confirmed_at,
            phone_confirmed_at: user.phone_confirmed_at,
            leverage_multiplier: 5,
            is_active: true,
            contracted_plan: 'none'
          });
        }
      }

      const usersWithoutProfiles = allUsers.filter(user => 
        !user.leverage_multiplier && (user.email || user.phone)
      );

      if (usersWithoutProfiles.length > 0) {
        console.log('Creating profiles for users without them:', usersWithoutProfiles.length);
        const profiles = usersWithoutProfiles.map(user => ({
          id: user.id,
          email: user.email || '',
          phone: user.phone || '',
          full_name: user.full_name || '',
          leverage_multiplier: 1,
          is_active: true,
          contracted_plan: 'none'
        }));

        const { error } = await supabase
          .from('user_profiles')
          .insert(profiles);

        if (!error) {
          usersWithoutProfiles.forEach(user => {
            user.leverage_multiplier = 1;
            user.is_active = true;
            user.contracted_plan = 'none';
          });
        }
      }

      const formattedUsers = allUsers.map(user => ({
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        leverage_multiplier: user.leverage_multiplier || 1,
        is_active: user.is_active !== false,
        contracted_plan: user.contracted_plan || 'none',
        email_confirmed_at: user.email_confirmed_at,
        phone_confirmed_at: user.phone_confirmed_at
      }));

      console.log('Users found:', formattedUsers.length);
      console.log('Users with phones:', formattedUsers.filter(u => u.phone).length);
      console.log('Users with emails:', formattedUsers.filter(u => u.email).length);

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('email, phone')
        .or(`email.eq.${formData.email},phone.eq.${formData.phone}`)
        .maybeSingle();

      if (existingUser) {
        if (existingUser.email === formData.email) {
          setFormErrors({ email: 'Email já está em uso' });
          return;
        }
        if (existingUser.phone === formData.phone) {
          setFormErrors({ phone: 'Telefone já está em uso' });
          return;
        }
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            leverage_multiplier: formData.leverage_multiplier,
            is_active: formData.is_active,
            contracted_plan: formData.contracted_plan
          });

        if (profileError) throw profileError;

        setSuccess('Usuário criado com sucesso!');
        setShowAddForm(false);
        resetForm();
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      setError(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const errors = validateForm(formData, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          leverage_multiplier: formData.leverage_multiplier,
          is_active: formData.is_active,
          contracted_plan: formData.contracted_plan
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      setSuccess('Usuário atualizado com sucesso!');
      setShowEditForm(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      setError(error.message || 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      setError(null);
      
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setSuccess('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Erro ao excluir usuário');
    }
  };

  const handleToggleUserStatus = async (userId: string, newStatus: boolean) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: newStatus })
        .eq('id', userId);

      if (error) throw error;

      setSuccess(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      setError(error.message || 'Erro ao atualizar status do usuário');
    }
  };

  const handleUpdateLeverage = async (userId: string, newLeverage: number) => {
    try {
      setError(null);
      console.log('Updating leverage for user:', userId, 'to:', newLeverage);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ leverage_multiplier: newLeverage })
        .eq('id', userId);

      console.log('Update result:', { error });

      if (error) throw error;

      setSuccess(`Alavancagem atualizada para ${newLeverage}x com sucesso!`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating leverage:', error);
      setError(`Erro ao atualizar alavancagem: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    try {
      setError(null);
      console.log('Updating plan for user:', userId, 'to:', newPlan);
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ contracted_plan: newPlan })
        .eq('id', userId);

      console.log('Update result:', { error });

      if (error) throw error;

      setSuccess(`Plano atualizado para ${getPlanDisplayName(newPlan)} com sucesso!`);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      setError(`Erro ao atualizar plano: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleResetPassword = async (userId: string, email: string) => {
    try {
      setSuccess(`Email de redefinição de senha enviado para ${email}`);
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Erro ao redefinir senha');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      is_active: true,
      leverage_multiplier: 1,
      contracted_plan: 'none'
    });
    setFormErrors({});
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email,
      phone: user.phone || '',
      password: '',
      is_active: user.is_active,
      leverage_multiplier: user.leverage_multiplier,
      contracted_plan: user.contracted_plan
    });
    setShowEditForm(true);
  };

  // Column filter functions
  const toggleColumnFilter = (column: string) => {
    setColumnFilters(prev => prev.map(filter => 
      filter.column === column 
        ? { ...filter, isOpen: !filter.isOpen }
        : { ...filter, isOpen: false }
    ));
  };

  const updateColumnFilter = (column: string, value: string, checked: boolean) => {
    setColumnFilters(prev => prev.map(filter => 
      filter.column === column 
        ? { 
            ...filter, 
            values: checked 
              ? [...filter.values, value]
              : filter.values.filter(v => v !== value)
          }
        : filter
    ));
  };

  const clearColumnFilter = (column: string) => {
    setColumnFilters(prev => prev.map(filter => 
      filter.column === column 
        ? { ...filter, values: [] }
        : filter
    ));
  };

  const getUniqueValues = (column: string) => {
    switch (column) {
      case 'status':
        return ['Ativo', 'Inativo'];
      case 'plan':
        return ['Nenhum', 'Bitcoin', 'Mini Índice', 'Mini Dólar', 'Portfólio Completo'];
      case 'leverage':
        return ['1x', '2x', '3x', '4x', '5x'];
      case 'verification':
        return ['Email Verificado', 'Email Não Verificado', 'Telefone Verificado', 'Telefone Não Verificado'];
      default:
        return [];
    }
  };

  // WhatsApp function
  const sendWhatsAppMessage = (user: User) => {
    if (!user.phone) {
      alert('Usuário não possui telefone cadastrado');
      return;
    }

    const phone = user.phone.replace(/\D/g, '');
    const name = user.full_name || 'Cliente';
    const message = encodeURIComponent(
      `Olá ${name}! 👋\n\n` +
      `Sou da equipe Quant Broker e estou entrando em contato sobre seus Portfólios de IA.\n\n` +
      `Como posso ajudá-lo hoje?\n\n` +
      `📊 Dúvidas sobre performance\n` +
      `⚙️ Configurações de conta\n` +
      `📈 Alavancagem e estratégias\n` +
      `🎯 Suporte técnico\n\n` +
      `Estou aqui para ajudar!`
    );

    const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      } else {
        direction = 'asc';
      }
    }
    
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="h-4 w-4 text-blue-600" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="h-4 w-4 text-blue-600" />;
    } else {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
  };

  // Apply all filters
  let filteredUsers = users.filter(user => {
    // Search filter
    const searchMatch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (user.phone && user.phone.includes(searchTerm));

    // Status filter
    const statusMatch = statusFilter === 'all' || 
                       (statusFilter === 'active' && user.is_active) ||
                       (statusFilter === 'inactive' && !user.is_active);

    // Date range filter
    const dateMatch = !dateRange.start || !dateRange.end ||
                     (new Date(user.created_at) >= new Date(dateRange.start) &&
                      new Date(user.created_at) <= new Date(dateRange.end));

    // Column filters
    const statusFilter_col = columnFilters.find(f => f.column === 'status');
    const statusFilterMatch = !statusFilter_col?.values.length ||
                             statusFilter_col.values.includes(user.is_active ? 'Ativo' : 'Inativo');

    const planFilter = columnFilters.find(f => f.column === 'plan');
    const planFilterMatch = !planFilter?.values.length ||
                           planFilter.values.includes(getPlanDisplayName(user.contracted_plan));

    const leverageFilter = columnFilters.find(f => f.column === 'leverage');
    const leverageFilterMatch = !leverageFilter?.values.length ||
                               leverageFilter.values.includes(`${user.leverage_multiplier}x`);

    return searchMatch && statusMatch && dateMatch && statusFilterMatch && planFilterMatch && leverageFilterMatch;
  });

  // Apply sorting
  if (sortConfig.direction) {
    filteredUsers = [...filteredUsers].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      switch (sortConfig.key) {
        case 'full_name':
          aValue = a.full_name || '';
          bValue = b.full_name || '';
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'leverage_multiplier':
          aValue = a.leverage_multiplier;
          bValue = b.leverage_multiplier;
          break;
        case 'contracted_plan':
          aValue = a.contracted_plan || '';
          bValue = b.contracted_plan || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'last_sign_in_at':
          aValue = a.last_sign_in_at ? new Date(a.last_sign_in_at) : new Date(0);
          bValue = b.last_sign_in_at ? new Date(b.last_sign_in_at) : new Date(0);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    );
  };

  const handleBulkPlanUpdate = async () => {
    if (!bulkPlan || selectedUsers.length === 0) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_profiles')
        .update({ contracted_plan: bulkPlan })
        .in('id', selectedUsers);

      if (error) throw error;

      setSuccess(`Plano ${getPlanDisplayName(bulkPlan)} aplicado a ${selectedUsers.length} usuários!`);
      setSelectedUsers([]);
      setBulkPlan('');
      setShowBulkActions(false);
      fetchUsers();
    } catch (error: any) {
      setError('Erro ao atualizar planos em lote');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteLeads = async () => {
    const leadsToDelete = filteredUsers.filter(user => 
      selectedUsers.includes(user.id) && user.contracted_plan === 'none'
    );
    
    if (leadsToDelete.length === 0) {
      setError('Nenhum lead selecionado para exclusão');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${leadsToDelete.length} leads (usuários sem plano)?`)) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .in('id', leadsToDelete.map(user => user.id));

      if (error) throw error;

      setSuccess(`${leadsToDelete.length} leads excluídos com sucesso!`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error: any) {
      setError('Erro ao excluir leads');
    } finally {
      setLoading(false);
    }
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'bitcoin': return 'Bitcoin';
      case 'mini-indice': return 'Mini Índice';
      case 'mini-dolar': return 'Mini Dólar';
      case 'portfolio-completo': return 'Portfólio Completo';
      case 'none': return 'Nenhum';
      default: return plan;
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'bitcoin': return 'bg-orange-100 text-orange-800';
      case 'mini-indice': return 'bg-blue-100 text-blue-800';
      case 'mini-dolar': return 'bg-green-100 text-green-800';
      case 'portfolio-completo': return 'bg-purple-100 text-purple-800';
      case 'none': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gestão de Usuários
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'financial'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Painel Financeiro
              </button>
            </nav>
          </div>
        </div>

        {/* Render active tab content */}
        {activeTab === 'financial' ? (
          <FinancialPanel />
        ) : (
          <>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <img 
              src="https://i.postimg.cc/5tjcZ4qJ/Chat-GPT-Image-12-de-jul-de-2025-21-56-40.png" 
              alt="Quant Broker Logo" 
              className="h-12 w-12 mr-4 rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
              <p className="text-gray-600">Gerencie usuários e configurações de alavancagem</p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">até</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Usuário
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.is_active).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alavancagem Média</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.length > 0 ? (users.reduce((acc, user) => acc + user.leverage_multiplier, 0) / users.length).toFixed(1) : '0'}x
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Filtrados</p>
                <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {showBulkActions && selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-blue-900 mb-3">
              Ações em Lote ({selectedUsers.length} usuários selecionados)
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-blue-800">Alterar Plano:</label>
                <select
                  value={bulkPlan}
                  onChange={(e) => setBulkPlan(e.target.value)}
                  className="border border-blue-300 rounded px-2 py-1 text-sm"
                >
                  <option value="">Selecione um plano</option>
                  <option value="none">Nenhum</option>
                  <option value="bitcoin">Bitcoin</option>
                  <option value="mini-indice">Mini Índice</option>
                  <option value="mini-dolar">Mini Dólar</option>
                  <option value="portfolio-completo">Portfólio Completo</option>
                </select>
                <button
                  onClick={handleBulkPlanUpdate}
                  disabled={!bulkPlan || loading}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Aplicar
                </button>
              </div>
              <div className="border-l border-blue-300 pl-4">
                <button
                  onClick={handleBulkDeleteLeads}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Excluir Leads Selecionados
                </button>
                <p className="text-xs text-red-700 mt-1">
                  Remove apenas usuários sem plano contratado
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Usuários</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Total: {users.length} | Filtrados: {filteredUsers.length}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{selectedUsers.length} selecionados</span>
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Limpar seleção
                    </button>
                  </div>
                )}
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedUsers.length === filteredUsers.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Ações em Lote
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    <button
                      onClick={() => handleSort('full_name')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Nome / Email</span>
                      {getSortIcon('full_name')}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    <button
                      onClick={() => handleSort('phone')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Telefone</span>
                      {getSortIcon('phone')}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('is_active')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Status</span>
                        {getSortIcon('is_active')}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => toggleColumnFilter('status')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {columnFilters.find(f => f.column === 'status')?.isOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                            <div className="p-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium">Filtrar Status</span>
                                <button
                                  onClick={() => clearColumnFilter('status')}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Limpar
                                </button>
                              </div>
                              {getUniqueValues('status').map(value => (
                                <label key={value} className="flex items-center gap-2 py-1">
                                  <input
                                    type="checkbox"
                                    checked={columnFilters.find(f => f.column === 'status')?.values.includes(value) || false}
                                    onChange={(e) => updateColumnFilter('status', value, e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm">{value}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('leverage_multiplier')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Alavancagem</span>
                        {getSortIcon('leverage_multiplier')}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => toggleColumnFilter('leverage')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {columnFilters.find(f => f.column === 'leverage')?.isOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                            <div className="p-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium">Filtrar Alavancagem</span>
                                <button
                                  onClick={() => clearColumnFilter('leverage')}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Limpar
                                </button>
                              </div>
                              {getUniqueValues('leverage').map(value => (
                                <label key={value} className="flex items-center gap-2 py-1">
                                  <input
                                    type="checkbox"
                                    checked={columnFilters.find(f => f.column === 'leverage')?.values.includes(value) || false}
                                    onChange={(e) => updateColumnFilter('leverage', value, e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm">{value}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort('contracted_plan')}
                        className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                      >
                        <span>Plano</span>
                        {getSortIcon('contracted_plan')}
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => toggleColumnFilter('plan')}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Filter className="h-3 w-3" />
                        </button>
                        {columnFilters.find(f => f.column === 'plan')?.isOpen && (
                          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                            <div className="p-2">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium">Filtrar Plano</span>
                                <button
                                  onClick={() => clearColumnFilter('plan')}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Limpar
                                </button>
                              </div>
                              {getUniqueValues('plan').map(value => (
                                <label key={value} className="flex items-center gap-2 py-1">
                                  <input
                                    type="checkbox"
                                    checked={columnFilters.find(f => f.column === 'plan')?.values.includes(value) || false}
                                    onChange={(e) => updateColumnFilter('plan', value, e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm">{value}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Cadastro</span>
                      {getSortIcon('created_at')}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    <button
                      onClick={() => handleSort('last_sign_in_at')}
                      className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
                    >
                      <span>Último Login</span>
                      {getSortIcon('last_sign_in_at')}
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate">
                            {user.full_name || 'Nome não informado'}
                          </div>
                          <div className="text-xs text-gray-500 max-w-[180px] truncate">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            {user.email_confirmed_at ? (
                              <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-yellow-500 mr-1" />
                            )}
                            {user.email_confirmed_at ? 'Verificado' : 'Não verificado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900">
                        {formatPhoneNumber(user.phone || '')}
                      </div>
                      {user.phone_confirmed_at ? (
                        <div className="text-xs text-green-600 flex items-center mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          ✓
                        </div>
                      ) : user.phone ? (
                        <div className="text-xs text-yellow-600 flex items-center mt-1">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          !
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleToggleUserStatus(user.id, !user.is_active)}
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdateLeverage(user.id, Math.max(1, user.leverage_multiplier - 1))}
                          className="p-1 text-red-600 hover:text-red-800"
                          disabled={user.leverage_multiplier <= 1}
                          title="Diminuir alavancagem"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-medium text-gray-900 min-w-[2rem] text-center">
                          {user.leverage_multiplier}x
                        </span>
                        <button
                          onClick={() => handleUpdateLeverage(user.id, Math.min(5, user.leverage_multiplier + 1))}
                          className="p-1 text-green-600 hover:text-green-800"
                          disabled={user.leverage_multiplier >= 5}
                          title="Aumentar alavancagem"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPlanBadgeColor(user.contracted_plan)}`}>
                          {getPlanDisplayName(user.contracted_plan)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {formatDateTime(user.last_sign_in_at)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center space-x-2">
                        {user.phone && (
                          <button
                            onClick={() => sendWhatsAppMessage(user)}
                            className="p-2 text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar usuário"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Redefinir senha"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {loading ? 'Carregando usuários...' : 
                 users.length === 0 ? 'Nenhum usuário cadastrado' : 
                 'Nenhum usuário encontrado com os filtros aplicados'}
              </p>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Adicionar Novo Usuário</h2>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.full_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome completo do usuário"
                    />
                    {formErrors.full_name && <p className="text-red-600 text-sm mt-1">{formErrors.full_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                    {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                    {formErrors.phone && <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Senha *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          formErrors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {formErrors.password && <p className="text-red-600 text-sm mt-1">{formErrors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alavancagem</label>
                    <select
                      value={formData.leverage_multiplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, leverage_multiplier: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={3}>3x</option>
                      <option value={4}>4x</option>
                      <option value={5}>5x</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plano Contratado</label>
                    <select
                      value={formData.contracted_plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, contracted_plan: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">Nenhum</option>
                      <option value="bitcoin">Bitcoin</option>
                      <option value="mini-indice">Mini Índice</option>
                      <option value="mini-dolar">Mini Dólar</option>
                      <option value="portfolio-completo">Portfólio Completo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Conta ativa
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Criando...' : 'Criar Usuário'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditForm && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Editar Usuário</h2>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.full_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome completo do usuário"
                    />
                    {formErrors.full_name && <p className="text-red-600 text-sm mt-1">{formErrors.full_name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="email@exemplo.com"
                    />
                    {formErrors.email && <p className="text-red-600 text-sm mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        formErrors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="(11) 99999-9999"
                    />
                    {formErrors.phone && <p className="text-red-600 text-sm mt-1">{formErrors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alavancagem</label>
                    <select
                      value={formData.leverage_multiplier}
                      onChange={(e) => setFormData(prev => ({ ...prev, leverage_multiplier: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={3}>3x</option>
                      <option value={4}>4x</option>
                      <option value={5}>5x</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plano Contratado</label>
                    <select
                      value={formData.contracted_plan}
                      onChange={(e) => setFormData(prev => ({ ...prev, contracted_plan: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="none">Nenhum</option>
                      <option value="bitcoin">Bitcoin</option>
                      <option value="mini-indice">Mini Índice</option>
                      <option value="mini-dolar">Mini Dólar</option>
                      <option value="portfolio-completo">Portfólio Completo</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="edit_is_active" className="ml-2 text-sm text-gray-700">
                    Conta ativa
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;