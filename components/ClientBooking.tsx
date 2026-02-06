
import React, { useState, useMemo, useEffect } from 'react';
import { Service, Professional, Appointment, BlockedPeriod, SalonSettings, AnamnesisTemplate, AnamnesisRecord } from '../types';
import { ChevronLeft, ChevronRight, Clock, Star, Scissors, Check, Calendar, Sparkles, X, Phone, User, Tag, LogOut, AlertTriangle, ShieldCheck, Signature, FileText, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { queueService } from '../services/queueService';
import { WaitingListWidget } from './WaitingListWidget';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas';

interface ClientBookingProps {
  settings: SalonSettings;
  services: Service[];
  staff: Professional[];
  appointments: Appointment[];
  blockedPeriods: BlockedPeriod[];
  onBook: (apt: Appointment) => void;
  onClose: () => void;
  initialClientData?: { name: string; phone: string; id?: string };
  templates: AnamnesisTemplate[];
  onAddAnamnesisRecord: (record: AnamnesisRecord) => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

const ClientBooking: React.FC<ClientBookingProps> = ({ settings, services, staff, appointments, blockedPeriods, onBook, onClose, initialClientData, templates, onAddAnamnesisRecord, onShowToast }) => {
  const { logout, user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState({
    name: initialClientData?.name || '',
    phone: initialClientData?.phone || '',
    id: initialClientData?.id
  });
  const [bookingFinished, setBookingFinished] = useState(false);

  // Anamnesis State
  const [anamnesisStep, setAnamnesisStep] = useState(0);
  const [anamnesisAnswers, setAnamnesisAnswers] = useState<Record<string, any>>({});
  const sigCanvas = React.useRef<any>(null);

  // Waiting List State
  const [waitingListEntryId, setWaitingListEntryId] = useState<string | null>(null);
  const [isJoiningQueue, setIsJoiningQueue] = useState(false);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);

  const handleJoinWaitingList = async () => {
    setIsJoiningQueue(true);
    try {
      const entry = await queueService.joinWaitingList(
        clientInfo,
        selectedService!,
        selectedPro!.id,
        selectedPro!.name,
        selectedDate
      );
      setWaitingListEntryId(entry.id);
      onShowToast("Você entrou na fila de espera!", 'success');
      setStep(6);
    } catch (error) {
      console.error("Failed to join queue", error);
      onShowToast("Erro ao entrar na fila. Tente novamente.", 'error');
    } finally {
      setIsJoiningQueue(false);
    }
  };

  const handleWaitlistClickStep3 = () => {
    if (clientInfo.name && clientInfo.phone) {
      // Data ready, join immediately
      handleJoinWaitingList();
    } else {
      // Need data, go to step 4
      setIsWaitlistMode(true);
      setStep(4);
    }
  };

  const selectedTimeDisplay = selectedTime || (isWaitlistMode ? 'Fila de Espera' : '');

  // ... (rest of code) ...

  // IN STEP 3 RENDER:
  // Update the button onClick to handleWaitlistClickStep3

  // IN STEP 4 RENDER:
  // Update texts and button action based on isWaitlistMode.



  // Sync with initialClientData if provided late or updated
  useEffect(() => {
    if (initialClientData) {
      setClientInfo({
        name: initialClientData.name,
        phone: initialClientData.phone,
        id: initialClientData.id
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

  const isPhoneValid = clientInfo.phone.replace(/\D/g, '').length >= 10;
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
    const dayBlocks = (blockedPeriods || []).filter(b => b.professionalId === selectedPro.id && b.date === selectedDate);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = selectedDate === todayStr;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return slots.filter(slotTime => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + newServiceDuration;

      // 1. Future check
      if (isToday && slotStart <= currentMinutes + 30) return false;

      // 2. Work hours check
      if (slotEnd > workEnd) return false;

      // 3. Lunch check
      if (lunchStart !== -1 && lunchEnd !== -1 && isColliding(slotStart, slotEnd, lunchStart, lunchEnd)) return false;

      // 4. Break check
      if (breakStart !== -1 && breakEnd !== -1 && isColliding(slotStart, slotEnd, breakStart, breakEnd)) return false;

      // 5. Appointment collision
      const hasAppointmentConflict = dayAppointments.some(apt => {
        const aptService = services.find(s => s.id === apt.serviceId || s.name === apt.service);
        const aptDuration = aptService ? parseDuration(aptService.duration) : 60;
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + aptDuration;
        return isColliding(slotStart, slotEnd, aptStart, aptEnd);
      });
      if (hasAppointmentConflict) return false;

      // 6. Block conflict
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

    // Check if anamnesis is required
    const serviceHasTemplate = selectedService.anamnesisTemplateId && templates.find(t => t.id === selectedService.anamnesisTemplateId);
    if (serviceHasTemplate && step < 5) {
      setStep(5);
      return;
    }

    const appointmentId = Math.random().toString(36).substr(2, 9);

    // Save Anamnesis if filled
    if (serviceHasTemplate) {
      const template = templates.find(t => t.id === selectedService.anamnesisTemplateId)!;
      const signatureData = sigCanvas.current?.toDataURL('image/png');

      const anamnesisRecord: AnamnesisRecord = {
        id: Math.random().toString(36).substr(2, 9),
        templateId: template.id,
        clientId: clientInfo.id || 'external',
        clientName: clientInfo.name,
        answers: anamnesisAnswers,
        signatureUrl: signatureData,
        signedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      onAddAnamnesisRecord(anamnesisRecord);
    }

    onBook({
      id: appointmentId,
      clientId: clientInfo.id || 'external',
      clientName: clientInfo.name,
      clientPhone: clientInfo.phone,
      serviceId: selectedService.id,
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
      setClientInfo({ name: '', phone: '', id: undefined });
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
            onClick={async () => { await logout(); onClose(); }}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
          >
            <LogOut size={16} /> Sair
          </button>
          {!initialClientData && (
            <button onClick={onClose} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 text-gray-500 transition-all">
              <X size={20} />
            </button>
          )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                  {services.map(svc => (
                    <div
                      key={svc.id}
                      onClick={() => { setSelectedService(svc); setStep(2); }}
                      className="bg-white/80 backdrop-blur-sm p-5 rounded-[2rem] border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-xl hover:border-[#FF69B4]/40 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98] relative overflow-hidden min-h-[130px]"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF69B4]/5 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex items-start gap-4 mb-3 relative z-10">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-50 to-white rounded-xl flex items-center justify-center text-[#FF69B4] shadow-inner group-hover:scale-110 transition-transform shrink-0">
                          <Scissors size={22} strokeWidth={1.5} />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-black text-gray-900 text-base sm:text-lg tracking-tight leading-tight group-hover:text-[#FF69B4] transition-colors break-words">
                            {svc.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-1">
                            <Clock size={10} className="text-pink-300" /> {svc.duration.replace(';', ':')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2 relative z-10">
                        <div className="bg-[#2D2B4D] px-4 py-2 rounded-xl shadow-md shadow-indigo-100/50 group-hover:bg-[#FF69B4] group-hover:shadow-pink-100/50 transition-all">
                          <span className="font-black text-base text-white whitespace-nowrap">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-all">
                          <ChevronRight size={18} strokeWidth={4} className="text-gray-200 group-hover:text-[#FF69B4]" />
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
                        <div className="col-span-full py-8 text-center flex flex-col items-center gap-4">
                          <div className="p-4 bg-gray-50 rounded-full text-gray-300"><Calendar size={32} strokeWidth={1} /></div>
                          <p className="font-bold text-gray-400 text-sm max-w-xs mx-auto">
                            {selectedPro && selectedPro.schedule?.[new Date(selectedDate + 'T12:00:00').getDay()]?.isOff
                              ? 'Dia de descanso do especialista.'
                              : 'Sem horários disponíveis para esta data.'}
                          </p>

                          {/* Waiting List CTA */}
                          {!waitingListEntryId && (
                            <button
                              onClick={handleWaitlistClickStep3}
                              disabled={isJoiningQueue}
                              className="mt-2 px-8 py-3 bg-gradient-to-r from-[#2D2B4D] to-[#4B4870] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                              {isJoiningQueue ? <span className="animate-spin">⏳</span> : <Sparkles size={14} className="text-[#FF69B4]" />}
                              Entrar na Fila de Espera
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {waitingListEntryId && (
                  <div className="mt-8">
                    <WaitingListWidget entryId={waitingListEntryId} />
                  </div>
                )}

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
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                    {isWaitlistMode ? 'Entrar na Fila ⏳' : 'Só mais um detalhe... 🌸'}
                  </h2>
                  <p className="text-gray-500 font-medium">
                    {isWaitlistMode ? 'Informe seus dados para avisarmos quando surgir uma vaga.' : 'Identifique-se para confirmarmos o horário.'}
                  </p>
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
                      <span className="text-gray-900 font-black text-sm">
                        {isWaitlistMode
                          ? `Aguardando Vaga em ${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}`
                          : `${new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')} às ${selectedTime}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <span className="text-gray-900 font-black uppercase text-xs">Total</span>
                      <span className="text-3xl font-black text-gray-900 tracking-tighter">R$ {selectedService?.price}</span>
                    </div>
                  </div>

                  <button
                    onClick={isWaitlistMode ? handleJoinWaitingList : handleFinish}
                    disabled={!isNameValid || !isPhoneValid || isJoiningQueue}
                    className="w-full py-6 bg-[#2D2B4D] text-white rounded-[2rem] font-black text-lg shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 relative z-10"
                  >
                    {isWaitlistMode
                      ? (isJoiningQueue ? "Entrando..." : "Confirmar Fila")
                      : (isJoiningQueue ? "Agendando..." : "Agendar Agora")
                    }
                    {!isJoiningQueue && <Sparkles size={20} className="text-[#FF69B4]" />}
                  </button>
                </div>
              </div>
            )}



            {step === 6 && (
              <div className="space-y-10 fade-in max-w-md mx-auto pb-20 text-center">
                <div className="w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                  <Sparkles size={48} className="text-emerald-500" />
                </div>

                <div className="space-y-4">
                  <h2 className="text-4xl font-black text-gray-900 tracking-tight">Você está na fila! 🎉</h2>
                  <p className="text-gray-500 font-medium text-lg px-4">
                    Já salvamos seu lugar. Assim que surgir uma vaga para <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>, avisaremos no WhatsApp:
                  </p>
                  <p className="text-2xl font-black text-[#40E0D0]">{clientInfo.phone}</p>
                </div>

                {waitingListEntryId && (
                  <div className="py-8">
                    <WaitingListWidget entryId={waitingListEntryId} />
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-6 bg-gray-100 text-gray-500 rounded-[2rem] font-black text-lg hover:bg-gray-200 transition-all"
                >
                  Voltar ao Início
                </button>
              </div>
            )}

            {step === 5 && selectedService?.anamnesisTemplateId && (
              <div className="space-y-10 fade-in max-w-2xl mx-auto pb-20">
                {(() => {
                  const template = templates.find(t => t.id === selectedService.anamnesisTemplateId);
                  if (!template) return null;

                  const totalAnamnesisSteps = template.fields.length + 1;
                  const currentField = anamnesisStep < template.fields.length ? template.fields[anamnesisStep] : null;
                  const isSignatureStep = anamnesisStep === template.fields.length;

                  return (
                    <div className="space-y-8 min-h-[600px] flex flex-col">
                      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <FileText size={20} />
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-sm">{template.title}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ficha de Segurança</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: totalAnamnesisSteps }).map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === anamnesisStep ? 'w-6 bg-indigo-600' : (i < anamnesisStep ? 'w-3 bg-indigo-200' : 'w-3 bg-gray-100')}`} />
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 bg-white p-10 rounded-[4rem] shadow-2xl border border-gray-50 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>

                        {currentField && (
                          <div className="w-full space-y-10" key={anamnesisStep}>
                            <div className="space-y-3">
                              <h4 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">{currentField.label}</h4>
                              {currentField.description && <p className="text-sm text-gray-400 font-medium px-4">{currentField.description}</p>}
                            </div>

                            <div className="w-full max-w-lg mx-auto">
                              {currentField.type === 'boolean' ? (
                                <div className="flex gap-4 max-w-xs mx-auto">
                                  <button
                                    onClick={() => { setAnamnesisAnswers({ ...anamnesisAnswers, [currentField.id]: true }); setAnamnesisStep(anamnesisStep + 1); }}
                                    className="flex-1 py-10 bg-emerald-50 text-emerald-600 rounded-[2.5rem] font-black text-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 flex flex-col items-center gap-2"
                                  >
                                    <Check size={32} />
                                    <span>SIM</span>
                                  </button>
                                  <button
                                    onClick={() => { setAnamnesisAnswers({ ...anamnesisAnswers, [currentField.id]: false }); setAnamnesisStep(anamnesisStep + 1); }}
                                    className="flex-1 py-10 bg-rose-50 text-rose-600 rounded-[2.5rem] font-black text-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95 flex flex-col items-center gap-2"
                                  >
                                    <X size={32} />
                                    <span>NÃO</span>
                                  </button>
                                </div>
                              ) : currentField.type === 'select' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                                  {currentField.options?.map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => { setAnamnesisAnswers({ ...anamnesisAnswers, [currentField.id]: opt }); setAnamnesisStep(anamnesisStep + 1); }}
                                      className="py-5 px-6 bg-gray-50 text-gray-700 rounded-3xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all active:scale-95 border-2 border-transparent hover:border-white shadow-sm"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-8">
                                  {currentField.type === 'textarea' ? (
                                    <textarea
                                      autoFocus
                                      className="w-full bg-gray-50 border-none rounded-[3rem] p-10 text-xl font-bold text-gray-800 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-inner min-h-[200px]"
                                      placeholder="Digite sua resposta..."
                                      value={anamnesisAnswers[currentField.id] || ''}
                                      onChange={e => setAnamnesisAnswers({ ...anamnesisAnswers, [currentField.id]: e.target.value })}
                                    />
                                  ) : (
                                    <input
                                      autoFocus
                                      type={currentField.type === 'number' ? 'number' : 'text'}
                                      className="w-full bg-gray-50 border-none rounded-full p-10 text-3xl font-black text-center text-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-gray-200 shadow-inner"
                                      placeholder="Sua resposta..."
                                      value={anamnesisAnswers[currentField.id] || ''}
                                      onChange={e => setAnamnesisAnswers({ ...anamnesisAnswers, [currentField.id]: e.target.value })}
                                      onKeyDown={e => e.key === 'Enter' && setAnamnesisStep(anamnesisStep + 1)}
                                    />
                                  )}
                                  <button
                                    onClick={() => setAnamnesisStep(anamnesisStep + 1)}
                                    className="px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 mx-auto"
                                  >
                                    Próxima Pergunta <ChevronRight size={18} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {isSignatureStep && (
                          <div className="w-full space-y-10">
                            <div className="space-y-4">
                              <h4 className="text-3xl font-black text-gray-800 tracking-tight leading-tight">Assinatura Digital</h4>
                              <p className="text-sm text-gray-400 font-medium px-8">Confirme o serviço e assine digitalmente no campo abaixo.</p>
                            </div>

                            {/* Recap do Serviço no Final da Anamnese */}
                            <div className="max-w-xs mx-auto bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-2">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                                <span>Serviço Selecionado</span>
                                <Scissors size={12} />
                              </div>
                              <h5 className="text-xl font-black text-gray-900">{selectedService?.name}</h5>
                              <div className="flex items-center gap-3 mt-1 text-xs font-bold text-gray-400">
                                <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                                <div className="flex items-center gap-1"><Clock size={12} /> {selectedTime}</div>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 overflow-hidden relative group max-w-lg mx-auto shadow-inner">
                              <SignatureCanvas
                                ref={sigCanvas}
                                penColor='#4F46E5'
                                canvasProps={{ className: 'w-full h-56 cursor-crosshair' }}
                              />
                              <button
                                onClick={() => sigCanvas.current.clear()}
                                className="absolute bottom-6 right-6 p-4 bg-white/90 backdrop-blur-sm text-gray-400 rounded-2xl hover:text-rose-500 transition-all shadow-sm"
                              >
                                <AlertTriangle size={16} /> Limpar
                              </button>
                            </div>

                            <button
                              onClick={handleFinish}
                              className="w-full py-8 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                            >
                              Finalizar Agendamento <Send size={24} />
                            </button>
                          </div>
                        )}

                        {anamnesisStep > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setAnamnesisStep(anamnesisStep - 1); }}
                            className="absolute bottom-10 left-10 flex items-center gap-2 text-gray-400 font-bold text-xs hover:text-indigo-600 transition-colors"
                          >
                            <ChevronLeft size={16} /> Voltar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
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
