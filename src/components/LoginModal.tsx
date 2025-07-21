import React, { useState } from 'react';
import { X, Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

// RD Station integration
declare global {
  interface Window {
    RdIntegration?: any;
  }
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Load RD Station script
  React.useEffect(() => {
    if (!window.RdIntegration) {
      const script = document.createElement('script');
      script.src = 'https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add +55 if not present
    if (digits.startsWith('55')) {
      return `+${digits}`;
    } else if (digits.length === 11) {
      return `+55${digits}`;
    } else if (digits.length === 10) {
      return `+55${digits}`;
    }
    
    return `+55${digits}`;
  };

  const validatePhone = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        // Send to RD Station first
        try {
          if (window.RdIntegration) {
            window.RdIntegration.post({
              token_rdstation: '57e7abbb49395ca58551fe103433f9da',
              identificador: 'registro-usuario',
              nome: fullName,
              email: email,
              telefone: phone,
              tags: ['registro', 'usuario-novo', 'quant-broker']
            });
          }
        } catch (rdError) {
          console.warn('RD Station integration error:', rdError);
          // Continue with registration even if RD Station fails
        }

        // Validation
        if (!fullName || !email || !password) {
          throw new Error('Nome, email e senha são obrigatórios');
        }

        if (phone && !validatePhone(phone)) {
          throw new Error('Número de telefone inválido. Use o formato (11) 99999-9999');
        }

        const formattedPhone = phone ? formatPhoneNumber(phone) : null;
        
        // Register with email only - no SMS verification
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            data: {
              full_name: fullName,
              phone: formattedPhone,
              email: email
            },
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;
        
        if (data.user && !data.session) {
          // Email confirmation required
          setError('✅ Conta criada! Verifique seu email para confirmar o cadastro e depois faça login.');
          setIsRegister(false); // Switch to login mode
        } else if (data.session) {
          // User logged in immediately (email confirmation disabled)
          onLogin();
          onClose();
          resetForm();
        }
      } else {
        // Login - can use either email or phone
        if (!password) {
          throw new Error('Senha é obrigatória');
        }

        let loginData;
        
        if (loginMethod === 'email') {
          if (!email) {
            throw new Error('Email é obrigatório para login');
          }
          
          loginData = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        } else {
          if (!phone) {
            throw new Error('Telefone é obrigatório para login');
          }
          
          const formattedPhone = formatPhoneNumber(phone);
          
          // Try to find user by phone in user_profiles and then login with email
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('email')
            .eq('phone', formattedPhone)
            .single();
          
          if (!profile) {
            throw new Error('Usuário não encontrado com este telefone');
          }
          
          loginData = await supabase.auth.signInWithPassword({
            email: profile.email,
            password,
          });
        }

        if (loginData.error) throw loginData.error;
        
        if (loginData.data.user) {
          onLogin();
          onClose();
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = error.message || 'Erro ao processar solicitação';
      
      // Handle specific database errors
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        if (errorMessage.includes('email')) {
          errorMessage = 'Este email já está cadastrado. Tente fazer login.';
        } else if (errorMessage.includes('phone')) {
          errorMessage = 'Este telefone já está cadastrado. Tente fazer login.';
        }
      } else if (errorMessage.includes('invalid phone number')) {
        errorMessage = 'Número de telefone inválido. Use o formato (11) 99999-9999';
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado. Tente fazer login.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setError('');
    setLoginMethod('email');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isRegister ? 'Criar Conta' : 'Fazer Login'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form 
          name={isRegister ? "registro-usuario" : "login-usuario"}
          onSubmit={handleSubmit} 
          className="p-6 space-y-6"
        >
          {/* Hidden RD Station fields */}
          <input type="hidden" name="identificador" value={isRegister ? "registro-usuario" : "login-usuario"} />
          
          {error && (
            <div className={`border px-4 py-3 rounded-lg ${
              error.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {isRegister ? (
            // Registration form - simplified, email only
            <>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Telefone (opcional)
                </label>
                <input
                  type="tel"
                  id="telefone"
                  name="telefone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="(11) 99999-9999"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: (11) 99999-9999 ou 11999999999
                </p>
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    name="senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-sensitive="true"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Confirmação por Email:</strong> Você receberá um email de confirmação para ativar sua conta.
                </p>
              </div>
            </>
          ) : (
            // Login form - email or phone choice
            <>
              {/* Login Method Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Como você quer fazer login?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      loginMethod === 'email'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <Mail className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Email</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('phone')}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      loginMethod === 'phone'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <Phone className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Telefone</div>
                  </button>
                </div>
              </div>

              {/* Login Fields */}
              {loginMethod === 'email' ? (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone (com DDD)
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="(11) 99999-9999"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: (11) 99999-9999 ou 11999999999
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="senha"
                    name="senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-sensitive="true"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="lembrar"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Lembrar de mim</span>
                </label>
                <button 
                  type="button"
                  onClick={() => window.open('https://wa.me/5511911560276', '_blank')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Esqueceu a senha?
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              isRegister ? 'Criando conta...' : 'Entrando...'
            ) : (
              isRegister ? 'Criar Conta' : 'Entrar'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              {isRegister ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                  setEmail('');
                  setPhone('');
                  setPassword('');
                  setFullName('');
                  setLoginMethod('email');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                {isRegister ? 'Fazer Login' : 'Cadastre-se'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;