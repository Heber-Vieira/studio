
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Professional, Appointment, BlockedPeriod, SalonSettings } from '../types';
import { ChevronLeft, ChevronRight, Clock, Star, Scissors, Check, Calendar, Sparkles, X, Phone, User, Tag, LogOut, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ClientBookingProps {
  settings: SalonSettings;
  services: Service[];
  staff: Professional[];
  appointments: Appointment[];
  blockedPeriods: BlockedPeriod[];
  onBook: (apt: Appointment) => void;
  onClose: () => void;
  initialClientData?: { name: string; phone: string };
}

const ClientBooking: React.FC<ClientBookingProps> = ({ settings, services, staff, appointments, blockedPeriods, onBook, onClose, initialClientData }) => {
  const { logout, user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState({
    name: initialClientData?.name || '',
    phone: initialClientData?.phone || ''
  });
  const [bookingFinished, setBookingFinished] = useState(false);

  // Sync with initialClientData if provided late or updated
  useEffect(() => {
    if (initialClientData) {
      setClientInfo({
        name: initialClientData.name,
        phone: initialClientData.phone
      });
    }
  }, [initialClientData]);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substr(0, 15);
    }
    return value.substr(0, 15);
  };

  const isPhoneValid = clientInfo.phone.replace(/\D/g, '').length === 11;
  const isNameValid = clientInfo.name.trim().split(/\s+/).length >= 2;

  const qualifiedStaff = useMemo(() => {
    if (!selectedService) return [];
    return staff.filter(pro => pro.services?.includes(selectedService.id));
  }, [selectedService, staff]);

  const availableTimes = useMemo(() => {
    if (!selectedPro || !selectedDate || !selectedService) return [];

    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const parseDuration = (dur: string) => {
      let total = 0;
      const hours = dur.match(/(\d+)h/);
      const mins = dur.match(/(\d+)min/);
      if (hours) total += parseInt(hours[1]) * 60;
      if (mins) total += parseInt(mins[1]);
      return total || 30;
    };

    const isColliding = (startA: number, endA: number, startB: number, endB: number) => {
      return startA < endB && endA > startB;
    };

    const dateObj = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const daySchedule = selectedPro.schedule?.[dayOfWeek];

    if (!daySchedule || daySchedule.isOff) return [];

    const newServiceDuration = parseDuration(selectedService.duration);
    const workStart = timeToMinutes(daySchedule.workStart);
    const workEnd = timeToMinutes(daySchedule.workEnd);
    const lunchStart = daySchedule.lunchStart ? timeToMinutes(daySchedule.lunchStart) : -1;
    const lunchEnd = daySchedule.lunchEnd ? timeToMinutes(daySchedule.lunchEnd) : -1;
    const breakStart = daySchedule.breakStart ? timeToMinutes(daySchedule.breakStart) : -1;
    const breakEnd = daySchedule.breakEnd ? timeToMinutes(daySchedule.breakEnd) : -1;

    const slots = [];
    for (let m = workStart; m < workEnd; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    const dayAppointments = appointments.filter(a => a.professionalId === selectedPro.id && a.date === selectedDate && a.status !== 'cancelled');
    const dayBlocks = blockedPeriods.filter(b => b.professionalId === selectedPro.id && b.date === selectedDate);

    return slots.filter(slotTime => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + newServiceDuration;
      if (slotEnd > workEnd) return false;
      if (lunchStart !== -1 && lunchEnd !== -1 && isColliding(slotStart, slotEnd, lunchStart, lunchEnd)) return false;
      if (breakStart !== -1 && breakEnd !== -1 && isColliding(slotStart, slotEnd, breakStart, breakEnd)) return false;
      const hasAppointmentConflict = dayAppointments.some(apt => {
        const aptService = services.find(s => s.name === apt.service);
        const aptDuration = aptService ? parseDuration(aptService.duration) : 60;
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + aptDuration;
        return isColliding(slotStart, slotEnd, aptStart, aptEnd);
      });
      if (hasAppointmentConflict) return false;
      const hasBlockConflict = dayBlocks.some(block => {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        return isColliding(slotStart, slotEnd, blockStart, blockEnd);
      });
      return !hasBlockConflict;
    });
  }, [selectedPro, selectedDate, selectedService, appointments, blockedPeriods, services]);

  const handleFinish = () => {
    if (!selectedService || !selectedPro || !selectedTime || !isNameValid || !isPhoneValid) return;
    onBook({
      id: Math.random().toString(36).substr(2, 9),
      clientId: 'external',
      clientName: clientInfo.name,
      service: selectedService.name,
      date: selectedDate,
      time: selectedTime,
      status: 'pending',
      price: selectedService.price,
      professionalId: selectedPro.id
    });
    setBookingFinished(true);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedPro(null);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime(null);
    if (!initialClientData) {
      setClientInfo({ name: '', phone: '' });
    }
    setBookingFinished(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-['Inter'] safe-pb">
      {/* Header conforme o Screenshot */}
      <header className="bg-white p-6 sticky top-0 z-50 flex justify-between items-center safe-pt">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-[#2D2B4D] rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden">
            {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain p-1" /> : <span className="font-black text-xs">LN</span>}
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-gray-900 text-lg leading-tight tracking-tight">{settings.name}</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.1em]">PORTAL DE AGENDAMENTO</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {initialClientData && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
              <ShieldCheck size={16} />
              <span className="text-xs font-bold">Link Identificado</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
          >
            <LogOut size={16} /> Sair
          </button>
          <button onClick={onClose} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-500 transition-all">
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Linha de Progresso Rosa - Conforme Screenshot */}
      <div className="h-1 w-full bg-gray-50 relative">
        <div
          className="h-full bg-[#FF69B4] transition-all duration-700"
          style={{ width: bookingFinished ? '100%' : `${(step / 4) * 100}%` }}
        />
      </div>

      <main className={`flex-1 max-w-6xl mx-auto w-full p-6 md:p-12 ${bookingFinished ? 'flex items-center justify-center' : ''}`}>
        {bookingFinished ? (
          <div className="flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 w-full">
            <div className="w-24 h-24 bg-[#40E0D0] rounded-[2rem] flex items-center justify-center text-white shadow-2xl mb-8 animate-bounce">
              <Check size={48} />
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Agendamento Realizado! ✨</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-10 text-lg font-medium">
              Sua solicitação foi enviada para o <b>{settings.name}</b>. Avisaremos você via WhatsApp assim que for confirmado.
            </p>
            <button onClick={handleReset} className="px-12 py-4 bg-[#FF69B4] text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">Voltar ao Início</button>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-12 fade-in max-w-4xl mx-auto">
                <div className="text-left space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">O que vamos fazer hoje, {clientInfo.name ? clientInfo.name.split(' ')[0] : 'querida'}? 🌸</h2>
                  <p className="text-gray-500 font-medium">Selecione o serviço que deseja realizar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {services.map(svc => (
                    <div
                      key={svc.id}
                      onClick={() => { setSelectedService(svc); setStep(2); }}
                      className="bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-[#FF69B4]/30 transition-all cursor-pointer flex justify-between items-center group active:scale-98"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[#F8F9FA] rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-[#FF69B4] transition-all">
                          <Scissors size={26} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-black text-gray-900 text-xl tracking-tight">{svc.name}</h4>
                          <div className="flex items-center gap-1.5 text-gray-400 font-bold text-xs uppercase tracking-widest">
                            <Clock size={14} className="text-gray-300" /> {svc.duration}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-2xl text-gray-900">R$ {svc.price}</span>
                        <div className="p-2 text-gray-200 group-hover:text-[#FF69B4] group-hover:translate-x-1 transition-all">
                          <ChevronRight size={24} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 fade-in max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(1)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><ChevronLeft size={20} /></button>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Escolha seu Atendente ✨</h2>
                    <p className="text-gray-500 font-medium">Especialistas disponíveis para {selectedService?.name}.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                  {qualifiedStaff.map(pro => (
                    <div
                      key={pro.id}
                      onClick={() => { setSelectedPro(pro); setStep(3); }}
                      className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#40E0D0]/30 transition-all cursor-pointer flex flex-col items-center text-center group active:scale-95"
                    >
                      <div className="relative mb-6">
                        <img src={pro.avatar} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl group-hover:scale-110 transition-transform" />
                        <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-full shadow-lg">
                          <div className="bg-[#40E0D0] text-white p-1.5 rounded-full"><Check size={12} strokeWidth={4} /></div>
                        </div>
                      </div>
                      <h4 className="font-black text-gray-900 text-xl tracking-tight mb-1">{pro.name}</h4>
                      <p className="text-[#40E0D0] font-black text-[10px] uppercase tracking-[0.2em] mb-4">{pro.role}</p>
                      <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-50 px-4 py-1.5 rounded-full text-xs font-black mb-6">
                        <Star size={14} fill="currentColor" /> {pro.rating}
                      </div>
                      <button className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-[#40E0D0] group-hover:text-white transition-all shadow-inner">Selecionar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 fade-in max-w-4xl mx-auto pb-20">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep(2)} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all"><ChevronLeft size={20} /></button>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Quando será seu brilho? 📅</h2>
                    <p className="text-gray-500 font-medium">Selecione o melhor dia e horário na agenda de {selectedPro?.name.split(' ')[0]}.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 ml-1">DATA DO SERVIÇO</h4>
                    <input
                      type="date"
                      className="w-full bg-[#F5F5F5] border-none rounded-2xl px-6 py-5 outline-none focus:ring-4 focus:ring-[#FF69B4]/10 font-black text-xl [color-scheme:light] transition-all"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => { setSelectedDate(e.target.value); setSelectedTime(null); }}
                    />
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 ml-1">HORÁRIOS LIVRES</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {availableTimes.length > 0 ? availableTimes.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-4 rounded-2xl font-black text-sm transition-all active:scale-90 ${selectedTime === time ? 'bg-[#FF69B4] text-white shadow-xl shadow-pink-100 scale-105' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {time}
                        </button>
                      )) : (
                        <div className="col-span-full py-10 text-center text-gray-300 italic text-sm flex flex-col items-center gap-3">
                          <div className="p-4 bg-gray-50 rounded-full"><Calendar size={32} strokeWidth={1} /></div>
                          <p className="font-bold">Sem horários nesta data.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTime && (
                  <button
                    onClick={() => setStep(4)}
                    className="w-full py-6 bg-[#FF69B4] text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4"
                  >
                    Prosseguir <ChevronRight size={24} />
                  </button>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-10 fade-in max-w-md mx-auto pb-20">
                <div className="text-center space-y-2">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Só mais um detalhe... 🌸</h2>
                  <p className="text-gray-500 font-medium">Identifique-se para confirmarmos o horário.</p>
                </div>

                <div className="space-y-6 bg-white p-10 rounded-[4rem] shadow-2xl border border-gray-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF69B4]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                  <div className="space-y-2 relative z-10">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">NOME COMPLETO</label>
                    <div className="relative group">
                      <User className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${initialClientData ? 'text-[#FF69B4]' : 'text-gray-300 group-focus-within:text-[#FF69B4]'}`} size={20} />
                      <input
                        type="text"
                        placeholder="Maria Oliveira..."
                        className={`w-full bg-[#F8F9FA] border-2 rounded-[1.5rem] pl-14 pr-6 py-5 outline-none transition-all font-bold text-lg ${initialClientData ? 'border-[#FF69B4]/20 ring-4 ring-[#FF69B4]/5' : (clientInfo.name.length > 0 && !isNameValid
                          ? 'border-rose-200 text-rose-600'
                          : 'border-transparent focus:border-[#FF69B4]/30')
                          }`}
                        value={clientInfo.name}
                        onChange={e => setClientInfo({ ...clientInfo, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-3">SEU WHATSAPP</label>
                    <div className="relative group">
                      <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${initialClientData ? 'text-[#40E0D0]' : 'text-gray-300 group-focus-within:text-[#40E0D0]'}`} size={20} />
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={15}
                        placeholder="(00) 00000-0000"
                        className={`w-full bg-[#F8F9FA] border-2 rounded-[1.5rem] pl-14 pr-6 py-5 outline-none transition-all font-bold text-lg ${initialClientData ? 'border-[#40E0D0]/20 ring-4 ring-[#40E0D0]/5' : (clientInfo.phone.length > 0 && !isPhoneValid
                          ? 'border-rose-200 text-rose-600'
                          : 'border-transparent focus:border-[#40E0D0]/30')
                          }`}
                        value={clientInfo.phone}
                        onChange={e => setClientInfo({ ...clientInfo, phone: formatPhoneNumber(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="bg-[#F8F9FA] p-8 rounded-[2.5rem] space-y-4 border border-gray-100 shadow-inner">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Resumo</span>
                      <span className="text-[#FF69B4] font-black text-sm">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 font-black uppercase">Quando</span>
                      <span className="text-gray-900 font-black text-sm">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} às {selectedTime}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-gray-900 font-black uppercase text-xs">Total</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">R$ {selectedService?.price}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleFinish}
                    disabled={!isNameValid || !isPhoneValid}
                    className="w-full py-6 bg-[#2D2B4D] text-white rounded-[2rem] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 relative z-10"
                  >
                    Agendar Agora <Sparkles size={20} className="text-[#FF69B4]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Minimalista - Conforme Screenshot */}
      <footer className="p-12 text-center text-gray-300 text-[10px] font-black uppercase tracking-[0.3em] safe-pb">
        POWERED BY BELLAAI &copy; 2025
      </footer>
    </div>
  );
};

export default ClientBooking;
