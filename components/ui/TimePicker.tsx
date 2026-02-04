import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TimePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (hours: number, minutes: number) => void;
    initialHours?: number;
    initialMinutes?: number;
    label?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
    isOpen,
    onClose,
    onConfirm,
    initialHours = 0,
    initialMinutes = 0,
    label = "Duração"
}) => {
    const [hours, setHours] = useState(initialHours);
    const [minutes, setMinutes] = useState(initialMinutes);

    // Sync with initial values when opening
    useEffect(() => {
        if (isOpen) {
            setHours(initialHours);
            setMinutes(initialMinutes);
        }
    }, [isOpen, initialHours, initialMinutes]);

    if (!isOpen) return null;

    const hourOptions = Array.from({ length: 25 }, (_, i) => i);
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

    const handleConfirm = () => {
        onConfirm(hours, minutes);
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[320px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FF69B4]/10 rounded-xl flex items-center justify-center text-[#FF69B4]">
                            <Clock size={18} />
                        </div>
                        <h3 className="font-bold text-gray-800">{label}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Pickers Container */}
                <div className="p-8 flex items-center justify-center gap-8">
                    {/* Hours Column */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Horas</span>
                        <div className="h-40 overflow-y-auto scrollbar-hide snap-y snap-mandatory px-4 flex flex-col items-center">
                            <div className="h-16 shrink-0" /> {/* Padding top */}
                            {hourOptions.map(h => (
                                <button
                                    key={`h-${h}`}
                                    onClick={() => setHours(h)}
                                    className={`h-10 flex items-center justify-center text-2xl font-black transition-all snap-center ${hours === h ? 'text-gray-900 scale-125' : 'text-gray-300'}`}
                                >
                                    {h}
                                </button>
                            ))}
                            <div className="h-16 shrink-0" /> {/* Padding bottom */}
                        </div>
                        <span className="text-sm font-bold text-gray-400 mt-1">h</span>
                    </div>

                    {/* Separator */}
                    <div className="text-3xl font-black text-gray-100 mt-6">:</div>

                    {/* Minutes Column */}
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Minutos</span>
                        <div className="h-40 overflow-y-auto scrollbar-hide snap-y snap-mandatory px-4 flex flex-col items-center">
                            <div className="h-16 shrink-0" /> {/* Padding top */}
                            {minuteOptions.map(m => (
                                <button
                                    key={`m-${m}`}
                                    onClick={() => setMinutes(m)}
                                    className={`h-10 flex items-center justify-center text-2xl font-black transition-all snap-center ${minutes === m ? 'text-gray-900 scale-125' : 'text-gray-300'}`}
                                >
                                    {m.toString().padStart(2, '0')}
                                </button>
                            ))}
                            <div className="h-16 shrink-0" /> {/* Padding bottom */}
                        </div>
                        <span className="text-sm font-bold text-gray-400 mt-1">min</span>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-4 bg-[#FF69B4] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TimePicker;
