import React, { useState } from 'react';
import { X, Eye, EyeOff, Phone, Mail, MessageCircle } from 'lucide-react';
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
  const [success, setSuccess] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // SMS Verification states
  const [showSMSVerification, setShowSMSVerification] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);

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

  const sendSMSCode = async (phoneNumber: string) => {
    try {
      setSmsLoading(true);
      setError('');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          action: 'send'
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar SMS');
      }

      setSuccess('Código SMS enviado com sucesso! Verifique seu telefone.');
      return true;
    } catch (error: any) {
      console.error('SMS send error:', error);
      setError(error.message || 'Erro ao enviar código SMS');
      return false;
    } finally {
      setSmsLoading(false);
    }
  };

  const verifySMSCode = async (phoneNumber: string, code: string) => {
    try {
      setSmsLoading(true);
      setError('');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
          code: code,
          action: 'verify'
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Código SMS inválido');
      }

      return result.success;
    } catch (error: any) {
      console.error('SMS verify error:', error);
      setError(error.message || 'Erro ao verificar código SMS');
      return false;
    } finally {
      setSmsLoading(false);
    }
  };

  const handleSMSVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!smsCode || smsCode.length !== 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);
    const isValid = await verifySMSCode(formattedPhone, smsCode);
    
    if (isValid && pendingUserData) {
      try {
        // Complete registration after SMS verification
        const { data, error } = await supabase.auth.signUp({
          email: pendingUserData.email,
          password: pendingUserData.password,
          options: {
            data: {
              full_name: pendingUserData.fullName,
              phone: formattedPhone,
              email: pendingUserData.email,
              phone_verified: true
            }
          }
        });

        if (error) throw error;

        console.log('✅ User created in auth:', data.user?.id);

        // Wait for trigger to execute and then ensure profile exists
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if profile was created by trigger
        if (data.user) {
          const { data: existingProfile, error: profileCheckError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('id', data.user.id)
            .single();

          console.log('🔍 Profile check result:', { existingProfile, profileCheckError });

          // If profile doesn't exist, create it manually
          if (!existingProfile) {
            console.log('⚠️ Profile not found, creating manually...');
            const { error: createProfileError } = await supabase
              .from('user_profiles')
              .insert({
                id: data.user.id,
                email: pendingUserData.email,
                phone: formattedPhone,
                full_name: pendingUserData.fullName,
                leverage_multiplier: 1,
                is_active: true,
                contracted_plan: 'none'
              });

            if (createProfileError) {
              console.error('❌ Error creating profile manually:', createProfileError);
            } else {
              console.log('✅ Profile created manually');
            }
          } else {
            console.log('✅ Profile already exists from trigger');
          }
        }
        // Send to RD Station
        try {
          if (window.RdIntegration) {
            window.RdIntegration.post({
              token_rdstation: '57e7abbb49395ca58551fe103433f9da',
              identificador: 'registro-usuario-sms',
              nome: pendingUserData.fullName,
              email: pendingUserData.email,
              telefone: formattedPhone,
              tags: ['registro', 'usuario-novo', 'sms-verificado', 'quant-broker']
            });
          }
        } catch (rdError) {
          console.warn('RD Station integration error:', rdError);
        }

        setSuccess('Conta criada com sucesso! Você já está logado.');
        onLogin();
        onClose();
        resetForm();
      } catch (error: any) {
        setError(error.message || 'Erro ao criar conta');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (isRegister) {
        // Validation
        if (!fullName || !email || !password || !phone) {
          throw new Error('Todos os campos são obrigatórios para registro');
        }

        if (!validatePhone(phone)) {
          throw new Error('Número de telefone inválido. Use o formato (11) 99999-9999');
        }

        const formattedPhone = formatPhoneNumber(phone);
        
        // Check if email or phone already exists
        const { data: existingUser } = await supabase
          .from('user_profiles')
          .select('email, phone')
          .or(`email.eq.${email},phone.eq.${formattedPhone}`)
          .single();

        if (existingUser) {
          if (existingUser.email === email) {
            throw new Error('Este email já está cadastrado. Tente fazer login.');
          }
          if (existingUser.phone === formattedPhone) {
            throw new Error('Este telefone já está cadastrado. Tente fazer login.');
          }
        }

        // Send SMS verification code
        const smsSent = await sendSMSCode(formattedPhone);
        
        if (smsSent) {
          // Store user data for after SMS verification
          setPendingUserData({
            fullName,
            email,
            password,
            phone: formattedPhone
          });
          setShowSMSVerification(true);
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
          setSuccess('Login realizado com sucesso!');
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
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email/telefone ou senha incorretos.';
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
    setSuccess('');
    setLoginMethod('email');
    setShowSMSVerification(false);
    setSmsCode('');
    setPendingUserData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resendSMS = async () => {
    if (pendingUserData?.phone) {
      await sendSMSCode(pendingUserData.phone);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {showSMSVerification ? 'Verificação SMS' : isRegister ? 'Criar Conta' : 'Fazer Login'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {showSMSVerification ? (
          // SMS Verification Form
          <form onSubmit={handleSMSVerification} className="p-4 space-y-4">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Verificação por SMS
              </h3>
              <p className="text-gray-600 mb-2 text-sm">
                Enviamos um código de 6 dígitos para:
              </p>
              <p className="font-medium text-gray-900 mb-4">
                {pendingUserData?.phone}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="smsCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código SMS (6 dígitos)
              </label>
              <input
                type="text"
                id="smsCode"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-center text-xl font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={smsLoading || smsCode.length !== 6}
                className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {smsLoading ? 'Verificando...' : 'Verificar Código'}
              </button>
              
              <button
                type="button"
                onClick={resendSMS}
                disabled={smsLoading}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Reenviar
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSMSVerification(false)}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              ← Voltar ao cadastro
            </button>
          </form>
        ) : (
          // Main Login/Register Form
          <form 
            name={isRegister ? "registro-usuario" : "login-usuario"}
            onSubmit={handleSubmit} 
            className="p-4 space-y-4"
          >
            {/* Hidden RD Station fields */}
            <input type="hidden" name="identificador" value={isRegister ? "registro-usuario" : "login-usuario"} />
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
                {success}
              </div>
            )}

            {isRegister ? (
              // Registration form with SMS verification
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="nome"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone (com DDD) *
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="(11) 99999-9999"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: (11) 99999-9999 ou 11999999999
                  </p>
                </div>

                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <p className="text-xs text-blue-800">
                    <strong>Verificação por SMS:</strong> Você receberá um código no seu telefone para confirmar o cadastro.
                  </p>
                </div>
              </>
            ) : (
              // Login form - email or phone choice
              <>
                {/* Login Method Selector */}
                <div className="mb-4">
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefone (com DDD)
                    </label>
                    <input
                      type="tel"
                      id="telefone"
                      name="telefone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="(11) 99999-9999"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Formato: (11) 99999-9999 ou 11999999999
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                    onClick={() => window.open('https://wa.me/5511975333355', '_blank')}
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
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                isRegister ? 'Enviando código SMS...' : 'Entrando...'
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
                    setSuccess('');
                    setEmail('');
                    setPhone('');
                    setPassword('');
                    setFullName('');
                    setLoginMethod('email');
                    setShowSMSVerification(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {isRegister ? 'Fazer Login' : 'Cadastre-se'}
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginModal;