
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Cookie, X, Settings as SettingsIcon, Check, Info, Shield, Lock, Activity, Megaphone } from 'lucide-react';

interface CookiePreferences {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
}

const STORAGE_KEY = 'bella_cookie_consent';

const CookieConsent: React.FC = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        analytics: false,
        marketing: false,
        functional: false
    });

    useEffect(() => {
        const savedConsent = localStorage.getItem(STORAGE_KEY);
        if (!savedConsent) {
            // Delay slightly for better UX
            const timer = setTimeout(() => setShowBanner(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const allAccepted = { essential: true, analytics: true, marketing: true, functional: true };
        saveConsent(allAccepted);
    };

    const handleRejectAll = () => {
        const allRejected = { essential: true, analytics: false, marketing: false, functional: false };
        saveConsent(allRejected);
    };

    const handleSaveCustom = () => {
        saveConsent(preferences);
        setShowModal(false);
    };

    const saveConsent = (prefs: CookiePreferences) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            ...prefs,
            timestamp: new Date().toISOString()
        }));
        setShowBanner(false);
    };

    const PreferenceToggle: React.FC<{
        id: keyof CookiePreferences;
        title: string;
        description: string;
        icon: any;
        disabled?: boolean
    }> = ({ id, title, description, icon: Icon, disabled }) => (
        <div className={`p-4 rounded-3xl border transition-all ${preferences[id] ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50/50 border-gray-100'}`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${preferences[id] ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 shadow-sm'}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-gray-900 leading-tight">{title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{description}</p>
                    </div>
                </div>
                <button
                    onClick={() => !disabled && setPreferences(prev => ({ ...prev, [id]: !prev[id] }))}
                    disabled={disabled}
                    className={`w-12 h-7 rounded-full relative transition-all duration-300 p-1 ${disabled ? 'opacity-50 cursor-not-allowed bg-indigo-500' : preferences[id] ? 'bg-indigo-500' : 'bg-gray-200'}`}
                >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${preferences[id] || disabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    {disabled && <Lock size={8} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50" />}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Privacy Icon Trigger (Floating) - MOVED TO THE RIGHT TO AVOID SIDEBAR CONFLICT */}
            {!showBanner && !showModal && (
                <button
                    onClick={() => setShowModal(true)}
                    className="fixed bottom-6 right-24 w-10 h-10 bg-white shadow-xl rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:scale-110 transition-all z-[10002] border border-gray-100 group"
                    title="Preferências de Privacidade"
                >
                    <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute right-12 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all whitespace-nowrap">
                        Privacidade
                    </div>
                </button>
            )}

            {/* Main Banner */}
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-6 inset-x-4 md:inset-x-auto md:right-6 md:w-[450px] bg-white/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-white/20 p-8 z-[1000] overflow-hidden group"
                    >
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 rotate-3">
                                    <Cookie size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Controle sua privacidade</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-full">LGPD & GDPR Compliant</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                Nosso site usa cookies para melhorar a navegação, analisar tráfego e personalizar sua experiência.
                                Ao clicar em "Aceitar", você concorda com nossa <a href="#" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4">Política de Privacidade</a> e <a href="#" className="text-indigo-600 font-bold hover:underline decoration-2 underline-offset-4">Opt-out</a>.
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-4 py-3 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <SettingsIcon size={14} /> Customizar
                                </button>
                                <button
                                    onClick={handleRejectAll}
                                    className="px-4 py-3 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all"
                                >
                                    Rejeitar
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="col-span-2 md:col-span-1 px-4 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] active:scale-95 shadow-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={14} /> Aceitar
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preferences Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl space-y-8 border border-white/20 relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-8 right-8 p-2 text-gray-300 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <X size={20} />
                            </button>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl shadow-inner">
                                        <Shield size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">Preferências de Cookies</h3>
                                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Configurações de Privacidade</p>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
                                    <PreferenceToggle
                                        id="essential"
                                        title="Essenciais (Obrigatórios)"
                                        description="Segurança e funcionalidades básicas."
                                        icon={Lock}
                                        disabled={true}
                                    />
                                    <PreferenceToggle
                                        id="functional"
                                        title="Funcionais"
                                        description="Personalização de idioma e temas."
                                        icon={SettingsIcon}
                                    />
                                    <PreferenceToggle
                                        id="analytics"
                                        title="Estatísticas e Performance"
                                        description="Métricas de uso e tráfego do site."
                                        icon={Activity}
                                    />
                                    <PreferenceToggle
                                        id="marketing"
                                        title="Marketing e Publicidade"
                                        description="Ofertas sob medida para você."
                                        icon={Megaphone}
                                    />
                                </div>

                                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100 flex gap-4 items-start">
                                    <div className="p-2 bg-white rounded-xl text-indigo-500 shadow-sm"><Info size={16} /></div>
                                    <p className="text-[11px] text-indigo-700 leading-relaxed font-medium">
                                        Sua privacidade é nossa prioridade. Cookies essenciais permitem que o Studio BellaAI funcione corretamente e não podem ser desativados.
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <button
                                        onClick={handleAcceptAll}
                                        className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                                    >
                                        Aceitar Todos
                                    </button>
                                    <button
                                        onClick={handleSaveCustom}
                                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        Salvar Seleção
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </>
    );
};

export default CookieConsent;
