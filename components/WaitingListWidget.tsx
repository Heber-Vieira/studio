
import React, { useEffect, useState } from 'react';
import { WaitingListEntry } from '../types';
import { queueService } from '../services/queueService';
import { Sparkles, Clock, Users, ArrowRight, BellRing } from 'lucide-react';

interface WaitingListWidgetProps {
    entryId: string;
    onClose?: () => void;
}

export const WaitingListWidget: React.FC<WaitingListWidgetProps> = ({ entryId, onClose }) => {
    const [status, setStatus] = useState<WaitingListEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await queueService.getStatus(entryId);
                setStatus(data);
            } catch (error) {
                console.error("Failed to load queue status", error);
            } finally {
                setLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [entryId]);

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Calculando sua posição... ⏳</div>;

    if (!status) return null;

    return (
        <div className="bg-gradient-to-br from-[#2D2B4D] to-[#1A192E] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden animate-in zoom-in duration-500 border border-white/10">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF69B4]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#40E0D0]/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">

                {/* Header Badge */}
                <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <Sparkles size={14} className="text-[#FF69B4]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF69B4]">Fila de Espera Premium</span>
                </div>

                <h3 className="text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Quase Lá!
                </h3>

                {/* Position Indicator */}
                <div className="flex items-center justify-center gap-6 w-full">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 rounded-2xl bg-[#40E0D0]/20 flex items-center justify-center border border-[#40E0D0]/40 text-[#40E0D0] shadow-[0_0_20px_rgba(64,224,208,0.2)]">
                            <span className="text-3xl font-black">{status.position}º</span>
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Sua Posição</span>
                    </div>

                    <ArrowRight className="text-gray-600 animate-pulse" size={20} />

                    <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-16 rounded-2xl bg-[#FF69B4]/20 flex items-center justify-center border border-[#FF69B4]/40 text-[#FF69B4] shadow-[0_0_20px_rgba(255,105,180,0.2)]">
                            <Clock size={24} />
                        </div>
                        <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">{status.estimatedWaitTime}</span>
                    </div>
                </div>

                {/* Info Text */}
                <p className="text-sm text-gray-300 font-medium leading-relaxed max-w-xs">
                    Você está na lista de espera para <b>{status.serviceName}</b> com <b>{status.professionalName}</b>.
                </p>

                {/* Notification Promise */}
                <div className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 text-left border border-white/5">
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <BellRing size={20} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-white">Fique atenta ao WhatsApp!</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Avisaremos assim que surgir uma vaga para você.</p>
                    </div>
                </div>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest pt-2"
                    >
                        Fechar e Aguardar
                    </button>
                )}
            </div>
        </div>
    );
};
