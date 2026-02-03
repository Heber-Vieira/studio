
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import {
  Sparkles,
  ArrowRight,
  Mail,
  Loader2,
  Lock,
  User,
  CheckCircle2,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Scissors,
  Crown,
  Heart,
  Smartphone
} from 'lucide-react';
import { Button, InputField, Modal } from './ui';

const LoginView: React.FC = () => {
  const { login, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'login') {
        const { error: loginError } = await login(email, password);
        if (loginError) setError(loginError.message);
      } else if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password, name, role);
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSuccessMsg('Cadastro realizado! Verifique seu e-mail para confirmar.');
          setMode('login');
        }
      }
    } catch (err: any) {
      setError('Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'client', label: 'Cliente', icon: <Heart size={18} />, desc: 'Para agendar seus serviços' },
    { id: 'attendant', label: 'Equipe', icon: <Scissors size={18} />, desc: 'Para profissionais e recepção' },
    { id: 'company_admin', label: 'Gestor', icon: <Crown size={18} />, desc: 'Controle total do negócio' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-pink-100/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-50/50 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] overflow-hidden border border-white relative z-10">

        {/* Left Side: Brand & Visual */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-gray-900 to-black text-white relative">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/10 rounded-full" />
            <div className="absolute bottom-20 right-10 w-64 h-64 border border-white/5 rounded-full" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20">
              <Sparkles size={32} className="text-[#FF69B4]" />
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-6 leading-tight">
              A beleza da<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF69B4] to-[#FFB6C1]">
                Gestão Inteligente.
              </span>
            </h1>
            <p className="text-gray-400 text-lg max-w-sm leading-relaxed">
              Bem-vinda ao BellaAI. Onde a sofisticação encontra a produtividade para transformar o seu salão.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <div className="flex -space-x-4">
                {[1, 2, 3].map(i => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    className="w-12 h-12 rounded-full border-4 border-black"
                    alt="User"
                  />
                ))}
              </div>
              <p className="text-sm text-gray-400">
                <span className="text-white font-bold">+500</span> gestoras confiam no BellaAI
              </p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
              Powered by BellaAI Systems • 2025
            </p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white relative">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
              {mode === 'login' ? 'Olá de novo! ✨' : 'Crie sua conta 🌸'}
            </h2>
            <p className="text-gray-400 font-medium">
              {mode === 'login'
                ? 'Entre com suas credenciais para continuar.'
                : 'Junte-se a nós e transforme seu negócio.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-500 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-teal-50 border border-teal-100 rounded-2xl flex items-center gap-3 text-teal-600 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 size={18} />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'signup' && (
              <>
                <InputField
                  label="Nome Completo"
                  placeholder="Como quer ser chamada?"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  icon={<User size={20} />}
                  required
                />

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block">
                    Perfil de Acesso
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {roles.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id as UserRole)}
                        className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 group ${role === r.id
                          ? 'border-[#FF69B4] bg-[#FF69B4]/5 text-[#FF69B4]'
                          : 'border-gray-50 bg-[#FBFBFB] text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        <div className={`p-2 rounded-xl border ${role === r.id ? 'bg-[#FF69B4] text-white border-transparent' : 'bg-white border-gray-100'}`}>
                          {r.icon}
                        </div>
                        <span className="font-black text-[10px] uppercase tracking-wider">{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <InputField
              label="E-mail"
              type="email"
              placeholder="seu@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={20} />}
              required
            />

            <div className="relative group">
              <InputField
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                icon={<Lock size={20} />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 bottom-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              icon={mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}
              iconPosition="right"
              className="py-5 text-lg shadow-2xl shadow-pink-200"
            >
              {mode === 'login' ? 'Entrar no Sistema' : 'Criar minha conta'}
            </Button>

            <div className="flex flex-col gap-4 text-center mt-8">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-[#FF69B4] transition-all"
              >
                {mode === 'login'
                  ? 'Não tem conta? Cadastre-se'
                  : 'Já possui conta? Faça Login'}
              </button>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-gray-300 text-[10px] font-bold uppercase tracking-widest hover:text-gray-500 transition-all"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
          </form>

          {/* Mobile Footer Credit */}
          <div className="lg:hidden mt-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300">
              BellaAI Systems • 2025
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={mode === 'forgot'}
        onClose={() => setMode('login')}
        title="Recuperar Senha"
        subtitle="Enviaremos um link de recuperação"
        icon={<Lock size={24} />}
      >
        <div className="space-y-6">
          <p className="text-gray-500 text-sm">
            Informe o e-mail associado à sua conta BellaAI para receber as instruções de redefinição.
          </p>
          <InputField
            label="E-mail de Cadastro"
            placeholder="seu@exemplo.com"
            icon={<Mail size={20} />}
          />
          <Button fullWidth onClick={() => { setSuccessMsg('E-mail de recuperação enviado!'); setMode('login'); }}>
            Enviar Link de Recuperação
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LoginView;
