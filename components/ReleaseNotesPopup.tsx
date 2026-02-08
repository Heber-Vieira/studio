import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Rocket, CheckCircle2, X, PartyPopper, ArrowRight, Zap, ShieldCheck, User, Users, Star } from 'lucide-react';
import { ReleaseNotesConfig, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ReleaseNotesPopupProps {
  config?: ReleaseNotesConfig;
}

const ReleaseNotesPopup: React.FC<ReleaseNotesPopupProps> = ({ config }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Filtro Inteligente de Novidades por Cargo
  const filteredFeatures = useMemo(() => {
    if (!config || !user) return [];

    return (config.activeNote?.features || []).filter(feature => {
      // Se feature for string (legado), mostra para todos
      if (typeof feature === 'string') return true;
      // Se roles for 'all' ou indefinido, mostra para todos
      if (!feature || !feature.roles || feature.roles === 'all') return true;
      // Se não, verifica se a role do usuário está na lista
      return Array.isArray(feature.roles) && feature.roles.includes(user.role);
    });
  }, [config, user]);

  useEffect(() => {
    if (!config || !config.enabled || !user || filteredFeatures.length === 0) return;

    const now = new Date();
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);

    // Validar janela de campanha
    if (now < start || now > end) return;

    const storageKey = `bella_seen_release_${config.activeNote.version}_${user.role}`;
    const hasSeen = localStorage.getItem(storageKey);

    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [config, user, filteredFeatures]);

  const handleClose = () => {
    if (config && user) {
      localStorage.setItem(`bella_seen_release_${config.activeNote.version}_${user.role}`, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !config || filteredFeatures.length === 0) return null;

  const RoleBadge = () => {
    const rolesMap: Record<UserRole, { label: string, icon: any, color: string }> = {
      master_admin: { label: 'Master Admin', icon: ShieldCheck, color: 'bg-indigo-500' },
      company_admin: { label: 'Admin Studio', icon: Zap, color: 'bg-[#FF69B4]' },
      attendant: { label: 'Especialista', icon: Users, color: 'bg-[#40E0D0]' },
      client: { label: 'Cliente VIP', icon: Star, color: 'bg-yellow-400' }
    };

    const current = rolesMap[user!.role];
    const Icon = current ? current.icon : User;
    const label = current ? current.label : 'Usuário';
    const color = current ? current.color : 'bg-gray-500';

    return (
      <div className={`inline-flex items-center gap-1.5 ${color} px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-sm mb-4`}>
        <Icon size={10} /> {label}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-xl animate-in fade-in duration-700 safe-pt safe-pb">

      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: i % 3 === 0 ? '#FF69B4' : i % 3 === 1 ? '#40E0D0' : '#C71585',
                animationDelay: `${Math.random() * 2}s`,
                top: '-10px'
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-white w-full max-w-lg md:rounded-[4rem] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative animate-in zoom-in duration-700 elastic-bounce flex flex-col max-h-[90vh]">

        {/* Botão Fechar Flutuante */}
        <button onClick={handleClose} className="absolute top-4 right-4 md:top-8 md:right-8 p-2.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all z-30">
          <X size={20} />
        </button>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-20%] right-[-20%] w-80 h-80 bg-[#FF69B4]/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-20%] w-80 h-80 bg-[#40E0D0]/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="bg-gradient-to-br from-[#FF69B4] to-[#C71585] p-8 md:p-12 text-white relative text-center">
            <div className="absolute top-8 left-8 opacity-20 hidden md:block"><Zap size={48} className="animate-pulse" /></div>
            <div className="absolute bottom-8 right-8 opacity-20 rotate-12 hidden md:block"><Rocket size={48} className="animate-bounce" /></div>

            <RoleBadge />

            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full mb-6 border border-white/20">
              <Sparkles size={16} className="text-yellow-300 animate-spin-slow" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Novidades Exclusivas</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 drop-shadow-lg leading-none">v{config.activeNote.version}</h2>
            <p className="text-pink-100 font-bold text-lg md:text-xl px-2 md:px-6 leading-tight">{config.activeNote.title}</p>
          </div>

          <div className="p-8 md:p-12 space-y-8 relative bg-white">
            <div className="space-y-6">
              <p className="text-gray-500 font-medium leading-relaxed italic text-center text-base md:text-lg">
                "{config.activeNote.description}"
              </p>

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center mb-4">Atualizações para o seu perfil:</p>
                {filteredFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 md:p-5 bg-gray-50/70 rounded-[1.5rem] md:rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:border-pink-100 transition-all duration-300 animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${(idx + 1) * 200}ms` }}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 size={20} className="text-[#40E0D0]" />
                    </div>
                    <span className="text-sm font-black text-gray-700 leading-tight">
                      {typeof feature === 'string' ? feature : feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 md:pt-6 space-y-4">
              <button
                onClick={handleClose}
                className="w-full py-5 md:py-6 bg-gray-900 text-white rounded-2xl md:rounded-3xl font-black text-sm uppercase tracking-[0.25em] shadow-2xl hover:scale-[1.03] hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                Explorar Agora <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button
                onClick={handleClose}
                className="w-full text-center text-gray-300 font-black text-[10px] uppercase tracking-[0.3em] hover:text-[#FF69B4] transition-colors py-2"
              >
                Ignorar Novidades
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 5s linear forwards;
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .elastic-bounce {
          animation: elastic-bounce 0.8s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards;
        }
        @keyframes elastic-bounce {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ReleaseNotesPopup;