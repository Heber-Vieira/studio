
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Appointment, Client, Professional, Service, BlockedPeriod } from '../types';
import {
  Plus,
  Filter,
  Search,
  Sparkles,
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Calendar as CalendarIcon,
  User,
  RefreshCw,
  MessageCircle,
  Trash2,
  Tag,
  Sun,
  Moon,
  Utensils,
  ShieldAlert,
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Scissors,
  Save,
  Send,
  UserSearch,
  Users
} from 'lucide-react';
import { COLORS } from '../constants';
import { translations } from '../i18n';
import { Modal, Button, SelectField, InputField, TimePicker } from './ui';

interface AppointmentsProps {
  appointments: Appointment[];
  clients: Client[];
  staff: Professional[];
  services: Service[];
  onAdd: (apt: Appointment) => void;
  onDelete: (id: string) => void;
  onBlock: (block: BlockedPeriod) => void;
  lang?: any;
  initialDate?: string;
  blockedPeriods?: BlockedPeriod[];
}

type ViewMode = 'day' | 'week' | 'month';

const AppointmentsView: React.FC<AppointmentsProps> = ({ appointments, clients, staff, services, onAdd, onDelete, onBlock, lang = 'pt', initialDate, blockedPeriods = [] }) => {
  const t = translations[lang as keyof typeof translations];
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const [startHour, setStartHour] = useState(() => Number(localStorage.getItem('bella_start_hour')) || 8);
  const [endHour, setEndHour] = useState(() => Number(localStorage.getItem('bella_end_hour')) || 20);
  const [isSmartFocus, setIsSmartFocus] = useState(() => {
    const saved = localStorage.getItem('bella_smart_focus');
    return saved === null ? true : saved === 'true';
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Estados de Filtro
  const [clientSearch, setClientSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('all');

  // Estados dos Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isConfirmCancelOpen, setIsConfirmCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  // Estado de Reagendamento
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  const [timePickerConfig, setTimePickerConfig] = useState<{
    isOpen: boolean;
    label: string;
    onConfirm: (h: number, m: number) => void;
    initialH: number;
    initialM: number;
  }>({
    isOpen: false,
    label: '',
    onConfirm: () => { },
    initialH: 0,
    initialM: 0
  });

  const formatDateISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = new Date();
  const TODAY = formatDateISO(todayDate);

  // Estado do Formulário de Novo Agendamento
  const [newApt, setNewApt] = useState({
    clientId: '',
    serviceId: '',
    professionalId: '',
    date: TODAY,
    time: ''
  });

  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }, [staff]);

  // --- LÓGICA DE DISPONIBILIDADE DINÂMICA ---

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
    return total || 60;
  };

  const isColliding = (startA: number, endA: number, startB: number, endB: number) => {
    return startA < endB && endA > startB;
  };

  // Função para calcular slots livres de um profissional em uma data
  const getAvailableSlotsForPro = (proId: string, date: string, serviceId: string) => {
    const pro = staff.find(p => p.id === proId);
    const svc = services.find(s => s.id === serviceId);
    if (!pro || !date || !svc) return [];

    const dateObj = new Date(date + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();
    const daySchedule = pro.schedule?.[dayOfWeek];

    if (!daySchedule || daySchedule.isOff) return [];

    const duration = parseDuration(svc.duration);
    const workStart = timeToMinutes(daySchedule.workStart);
    const workEnd = timeToMinutes(daySchedule.workEnd);
    const lunchStart = daySchedule.lunchStart ? timeToMinutes(daySchedule.lunchStart) : -1;
    const lunchEnd = daySchedule.lunchEnd ? timeToMinutes(daySchedule.lunchEnd) : -1;

    const slots = [];
    for (let m = workStart; m < workEnd; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }

    const dayAppointments = appointments.filter(a => a.professionalId === proId && a.date === date && a.status !== 'cancelled');
    const dayBlocks = blockedPeriods.filter(b => b.professionalId === proId && b.date === date);

    return slots.filter(slotTime => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + duration;
      if (slotEnd > workEnd) return false;
      if (lunchStart !== -1 && isColliding(slotStart, slotEnd, lunchStart, lunchEnd)) return false;

      const hasConflict = dayAppointments.some(apt => {
        const aptSvc = services.find(s => s.name === apt.service);
        const aptDur = aptSvc ? parseDuration(aptSvc.duration) : 60;
        const aptStart = timeToMinutes(apt.time);
        return isColliding(slotStart, slotEnd, aptStart, aptStart + aptDur);
      });
      if (hasConflict) return false;

      return !dayBlocks.some(b => isColliding(slotStart, slotEnd, timeToMinutes(b.startTime), timeToMinutes(b.endTime)));
    });
  };

  // Filtra serviços disponíveis baseados no profissional selecionado
  const availableServicesForForm = useMemo(() => {
    if (!newApt.professionalId) return services;
    const pro = sortedStaff.find(p => p.id === newApt.professionalId);
    return pro ? services.filter(s => pro.services?.includes(s.id)) : services;
  }, [services, sortedStaff, newApt.professionalId]);

  // Horários disponíveis baseados no Profissional e Data
  const availableTimesForForm = useMemo(() => {
    if (!newApt.professionalId || !newApt.date || !newApt.serviceId) return [];
    return getAvailableSlotsForPro(newApt.professionalId, newApt.date, newApt.serviceId);
  }, [newApt.professionalId, newApt.date, newApt.serviceId, appointments, blockedPeriods]);

  // Especialistas filtrados (por serviço E por horário se o horário estiver selecionado)
  const availableStaffForForm = useMemo(() => {
    let filtered = sortedStaff;
    if (newApt.serviceId) {
      filtered = filtered.filter(p => p.services?.includes(newApt.serviceId));
    }
    // Se o usuário selecionou um horário, só mostra quem está livre nele
    if (newApt.time && newApt.date && newApt.serviceId) {
      filtered = filtered.filter(p => {
        const slots = getAvailableSlotsForPro(p.id, newApt.date, newApt.serviceId);
        return slots.includes(newApt.time);
      });
    }
    return filtered;
  }, [sortedStaff, newApt.serviceId, newApt.time, newApt.date, appointments, blockedPeriods]);


  const [selectedDate, setSelectedDate] = useState(initialDate || TODAY);

  const [viewDate, setViewDate] = useState(() => {
    const date = initialDate ? new Date(initialDate + 'T12:00:00') : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  useEffect(() => {
    localStorage.setItem('bella_start_hour', startHour.toString());
    localStorage.setItem('bella_end_hour', endHour.toString());
    localStorage.setItem('bella_smart_focus', isSmartFocus.toString());
  }, [startHour, endHour, isSmartFocus]);

  // Lógica para fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de Smart Focus
  useEffect(() => {
    if (isSmartFocus) {
      const datesToAnalyze = viewMode === 'day' ? [selectedDate] : getWeekDates.map(d => formatDateISO(d));
      const relevantAppts = appointments.filter(a => datesToAnalyze.includes(a.date) && a.status !== 'cancelled');

      if (relevantAppts.length > 0) {
        const hours = relevantAppts.map(a => parseInt(a.time.split(':')[0]));
        setStartHour(Math.max(0, Math.min(...hours) - 1));
        setEndHour(Math.min(24, Math.max(...hours) + 2));
      } else if (viewMode === 'day') {
        setStartHour(8); setEndHour(19);
      }
    }
  }, [isSmartFocus, selectedDate, viewDate, appointments, viewMode]);

  const PIXELS_PER_MINUTE = 1.8;
  const schedulerHeight = (endHour - startHour) * 60 * PIXELS_PER_MINUTE;

  const getPositionStyle = (time: string, durationStr: string) => {
    const startMinutes = timeToMinutes(time);
    const durationMinutes = parseDuration(durationStr);
    const dayStartMinutes = startHour * 60;
    const top = (startMinutes - dayStartMinutes) * PIXELS_PER_MINUTE;
    const height = durationMinutes * PIXELS_PER_MINUTE;
    return { top: `${top}px`, height: `${height}px` };
  };

  const getWeekDates = useMemo(() => {
    const baseDate = viewMode === 'day' ? new Date(selectedDate + 'T12:00:00') : new Date(viewDate);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day;
    const sunday = new Date(new Date(baseDate).setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [viewDate, selectedDate, viewMode]);

  // Função para formatar o rótulo de data garantindo 'de' minúsculo e primeira letra maiúscula
  const formattedDateLabel = useMemo(() => {
    let label = '';
    if (viewMode === 'day') {
      label = new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    } else if (viewMode === 'week') {
      label = `${getWeekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${getWeekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
    } else {
      label = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    // Capitaliza apenas a primeira letra da frase e garante que 'de' esteja minúsculo
    if (!label) return '';
    const result = label.charAt(0).toUpperCase() + label.slice(1);
    return result.replace(/\sDe\s/g, ' de ');
  }, [viewMode, selectedDate, viewDate, getWeekDates]);

  const timeLabels = useMemo(() => {
    const labels = [];
    for (let h = startHour; h <= endHour; h++) {
      labels.push(`${h.toString().padStart(2, '0')}:00`);
      if (h < endHour) labels.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return labels;
  }, [startHour, endHour]);

  const visibleStaff = selectedProfessionalId === 'all' ? sortedStaff : sortedStaff.filter(p => p.id === selectedProfessionalId);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ type: 'empty' as const });
    for (let i = 1; i <= lastDate; i++) {
      const dateStr = formatDateISO(new Date(year, month, i));
      days.push({ type: 'day' as const, day: i, dateStr });
    }
    return days;
  }, [viewDate]);

  const handleNavigate = (direction: number) => {
    const newDate = new Date(viewDate);
    if (viewMode === 'day') {
      const curr = new Date(selectedDate + 'T12:00:00');
      curr.setDate(curr.getDate() + direction);
      setSelectedDate(formatDateISO(curr));
      setViewDate(new Date(curr.getFullYear(), curr.getMonth(), curr.getDate()));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
      setViewDate(newDate);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
      setViewDate(newDate);
    }
  };

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newApt.clientId);
    const service = services.find(s => s.id === newApt.serviceId);

    if (!client || !service || !newApt.date || !newApt.time || !newApt.professionalId) return;

    onAdd({
      id: Math.random().toString(36).substr(2, 9),
      clientId: client.id,
      clientName: client.name,
      serviceId: service.id,
      service: service.name,
      date: newApt.date,
      time: newApt.time,
      status: 'confirmed',
      price: service.price,
      professionalId: newApt.professionalId
    });

    setIsModalOpen(false);
    setNewApt({ clientId: '', serviceId: '', professionalId: '', date: TODAY, time: '' });
  };

  const handleConfirmCancel = () => {
    if (selectedAppointment) {
      onDelete(selectedAppointment.id);
      setIsConfirmCancelOpen(false);
      setIsDetailsModalOpen(false);
      setSelectedAppointment(null);
    }
  };

  const handleReschedule = () => {
    if (!selectedAppointment || !rescheduleData.date || !rescheduleData.time) return;

    const client = clients.find(c => c.id === selectedAppointment.clientId);
    const pro = staff.find(p => p.id === selectedAppointment.professionalId);

    // 1. Gerar link de WhatsApp se o cliente tiver telefone
    if (client && client.phone) {
      const dateFormatted = new Date(rescheduleData.date + 'T12:00:00').toLocaleDateString('pt-BR');
      const messageTemplate = translations[lang as keyof typeof translations].appointments.whatsappMessage;
      const finalMessage = messageTemplate
        .replace('{clientName}', client.name.split(' ')[0])
        .replace('{proName}', pro?.name.split(' ')[0] || 'Studio')
        .replace('{service}', selectedAppointment.service)
        .replace('{date}', dateFormatted)
        .replace('{time}', rescheduleData.time);

      const phoneClean = client.phone.replace(/\D/g, '');
      const waUrl = `https://wa.me/55${phoneClean}?text=${encodeURIComponent(finalMessage)}`;
      window.open(waUrl, '_blank');
    }

    // 2. Atualizar no sistema (Deleta antigo e adiciona novo)
    onDelete(selectedAppointment.id);
    onAdd({
      ...selectedAppointment,
      id: Math.random().toString(36).substr(2, 9),
      date: rescheduleData.date,
      time: rescheduleData.time,
      status: 'confirmed'
    });

    // 3. Fechar modais
    setIsRescheduleOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedAppointment(null);
  };

  // Função para filtrar agendamentos baseados no cliente e profissional
  const filterApt = (apt: Appointment) => {
    const matchesClient = !clientSearch || apt.clientName.toLowerCase().includes(clientSearch.toLowerCase());
    const matchesPro = selectedProfessionalId === 'all' || apt.professionalId === selectedProfessionalId;
    return apt.status !== 'cancelled' && matchesClient && matchesPro;
  };

  const filteredClientsForSearch = useMemo(() => {
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5);
  }, [clients, clientSearch]);

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap md:items-center gap-4 w-full min-w-0">
          <div className="flex items-center gap-3 shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold whitespace-nowrap">Agenda 📅</h2>
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              {(['day', 'week', 'month'] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)} className={`px-3 sm:px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewMode === mode ? 'bg-white text-[#FF69B4] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                  {mode === 'day' ? 'Dia' : mode === 'week' ? 'Sem' : 'Mês'}
                </button>
              ))}
            </div>
          </div>

          {/* Busca por Cliente com Lista Suspendida */}
          <div className="relative flex-1 min-w-[200px] max-w-full md:max-w-md" ref={searchRef}>
            <UserSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar agendamento por cliente..."
              className="w-full bg-[#F5F5F5] border-none rounded-2xl py-3 pl-11 pr-10 focus:ring-2 focus:ring-[#FF69B4]/20 outline-none font-medium text-sm transition-all"
              value={clientSearch}
              onChange={e => { setClientSearch(e.target.value); setIsSearchFocused(true); }}
              onFocus={() => setIsSearchFocused(true)}
            />
            {clientSearch && (
              <button
                onClick={() => { setClientSearch(''); setIsSearchFocused(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}

            {/* Lista de Sugestões de Clientes */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-gray-50 flex items-center gap-2">
                  <Users size={14} className="text-[#FF69B4]" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seus Clientes Cadastrados</span>
                </div>
                <div className="max-h-64 overflow-y-auto scrollbar-hide">
                  {filteredClientsForSearch.length > 0 ? filteredClientsForSearch.map(client => (
                    <button
                      key={client.id}
                      onClick={() => { setClientSearch(client.name); setIsSearchFocused(false); }}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-pink-50 transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs group-hover:bg-white transition-colors">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{client.name}</p>
                          <p className="text-[10px] text-gray-400">{client.phone}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-[#FF69B4] group-hover:translate-x-1 transition-all" />
                    </button>
                  )) : (
                    <div className="p-8 text-center text-gray-300 italic text-sm">
                      Nenhum cliente encontrado...
                    </div>
                  )}
                </div>
                {clientSearch && (
                  <button
                    onClick={() => setIsSearchFocused(false)}
                    className="w-full p-3 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                  >
                    Fechar Lista
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filtro por Profissional */}
          <div className="relative w-full md:w-56 group">
            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF69B4] transition-colors" size={18} />
            <select
              value={selectedProfessionalId}
              onChange={e => setSelectedProfessionalId(e.target.value)}
              className="w-full bg-[#F5F5F5] border-none rounded-2xl py-3 pl-11 pr-10 focus:ring-2 focus:ring-[#FF69B4]/20 outline-none font-bold text-xs uppercase tracking-widest text-gray-500 appearance-none cursor-pointer transition-all"
            >
              <option value="all">Filtro: Todos</option>
              {sortedStaff.map(pro => (
                <option key={pro.id} value={pro.id}>{pro.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none group-focus-within:text-[#FF69B4] transition-colors" />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleNavigate(-1)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} className="text-gray-400" /></button>
            <p className="text-gray-500 font-bold text-sm min-w-[180px] text-center">
              {formattedDateLabel}
            </p>
            <button onClick={() => handleNavigate(1)} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          <div className="relative">
            <button onClick={() => setIsConfigOpen(!isConfigOpen)} className={`px-4 py-3 rounded-2xl border-2 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest ${isConfigOpen ? 'bg-gray-900 text-white border-gray-900 shadow-xl' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}>
              <Clock size={16} /> <span>Janela: {startHour}h-{endHour}h</span>
            </button>
            {isConfigOpen && (
              <>
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110] md:hidden" onClick={() => setIsConfigOpen(false)} />
                <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:absolute md:top-full md:mt-3 md:right-0 md:translate-y-0 md:inset-x-auto w-auto md:w-80 bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] p-8 z-[120] border border-gray-100 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-8">
                    <h4 className="font-black text-gray-900 uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">LENTE DE FOCO <Clock size={14} className="text-gray-400" /></h4>
                    <button onClick={() => setIsConfigOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={16} className="text-gray-300" /></button>
                  </div>
                  <div className="space-y-8">
                    <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center justify-between group transition-all hover:bg-white hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSmartFocus ? 'bg-[#40E0D0] text-white shadow-lg shadow-teal-100' : 'bg-white text-gray-300 shadow-sm'}`}>
                          <Sparkles size={20} />
                        </div>
                        <div className="text-left">
                          <span className={`block font-black text-[10px] uppercase tracking-wider ${isSmartFocus ? 'text-teal-600' : 'text-gray-400'}`}>Smart Focus</span>
                          <span className="text-[9px] text-gray-400 font-bold">Auto-ajuste dinâmico</span>
                        </div>
                      </div>
                      <button onClick={() => setIsSmartFocus(!isSmartFocus)} className={`w-12 h-7 rounded-full relative transition-all duration-500 ${isSmartFocus ? 'bg-[#40E0D0]' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-sm ${isSmartFocus ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className={`space-y-6 transition-all duration-300 ${isSmartFocus ? 'opacity-30 pointer-events-none grayscale blur-[1px]' : 'opacity-100'}`}>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Início</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTimePickerConfig({
                                isOpen: true,
                                label: "Início da Agenda",
                                initialH: startHour,
                                initialM: 0,
                                onConfirm: (nh) => {
                                  const newStart = Math.min(endHour - 1, nh);
                                  setStartHour(newStart);
                                  localStorage.setItem('bella_start_hour', String(newStart));
                                }
                              });
                            }}
                            className="w-full bg-[#F5F5F5] border-none rounded-2xl px-5 py-4 font-black text-gray-800 text-lg text-left hover:bg-gray-100 transition-all font-mono"
                          >
                            {startHour.toString().padStart(2, '0')}:00
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fim</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTimePickerConfig({
                                isOpen: true,
                                label: "Fim da Agenda",
                                initialH: endHour,
                                initialM: 0,
                                onConfirm: (nh) => {
                                  const newEnd = Math.max(startHour + 1, nh);
                                  setEndHour(newEnd);
                                  localStorage.setItem('bella_end_hour', String(newEnd));
                                }
                              });
                            }}
                            className="w-full bg-[#F5F5F5] border-none rounded-2xl px-5 py-4 font-black text-gray-800 text-lg text-left hover:bg-gray-100 transition-all font-mono"
                          >
                            {endHour.toString().padStart(2, '0')}:00
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => { setViewDate(new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)); setSelectedDate(TODAY); setViewMode('day'); }}
            className="bg-gray-50 text-gray-400 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-50 hover:text-[#FF69B4] transition-all"
          >
            Hoje
          </button>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#FF69B4] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all">Novo Agendamento</button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[700px] transition-all duration-500">
        {(viewMode === 'day' || viewMode === 'week') && (
          <>
            <div className="flex border-b border-gray-50 sticky top-0 bg-white z-30">
              <div className="w-20 shrink-0 bg-gray-50/30 border-r border-gray-50 flex items-center justify-center">
                <Clock size={18} className="text-gray-300" />
              </div>
              <div className="flex-1 overflow-x-auto scrollbar-hide flex">
                {viewMode === 'day' ? (
                  visibleStaff.map(pro => (
                    <div key={pro.id} className="min-w-[200px] flex-1 p-5 flex items-center justify-center gap-4 border-r border-gray-50 last:border-0">
                      <img src={pro.avatar} className="w-11 h-11 rounded-2xl object-cover shadow-sm ring-2 ring-white" alt={pro.name} />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate leading-none">{pro.name.split(' ')[0]}</h4>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1 truncate">{pro.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  getWeekDates.map(day => (
                    <div key={day.toISOString()} className={`min-w-[150px] flex-1 p-5 text-center border-r border-gray-50 last:border-0 ${formatDateISO(day) === TODAY ? 'bg-pink-50/30' : ''}`}>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                      <span className={`text-lg font-black ${formatDateISO(day) === TODAY ? 'text-[#FF69B4]' : 'text-gray-800'}`}>{day.getDate()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto relative scrollbar-hide">
              <div className="flex relative transition-all duration-500 ease-in-out" style={{ height: `${schedulerHeight}px` }}>
                <div className="w-20 shrink-0 bg-gray-50/20 border-r border-gray-50 text-center relative">
                  {timeLabels.map((time, idx) => (
                    <div key={time} className={`absolute w-full flex justify-center items-center text-[10px] font-black tracking-tighter ${time.endsWith('00') ? 'text-gray-900' : 'text-gray-300'}`} style={{ top: `${idx * 30 * PIXELS_PER_MINUTE}px`, transform: 'translateY(-50%)' }}>
                      {time}
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex relative">
                  <div className="absolute inset-0 z-0">
                    {timeLabels.map((_, idx) => (
                      <div key={idx} className={`w-full border-t ${idx % 2 === 0 ? 'border-gray-100/60' : 'border-gray-50/30'}`} style={{ position: 'absolute', top: `${idx * 30 * PIXELS_PER_MINUTE}px` }} />
                    ))}
                  </div>

                  {viewMode === 'week' ? (
                    getWeekDates.map(day => {
                      const dateStr = formatDateISO(day);
                      const dayAppts = appointments.filter(a => a.date === dateStr && filterApt(a));
                      return (
                        <div key={dateStr} className="min-w-[150px] flex-1 relative border-r border-gray-50 last:border-0">
                          {dayAppts.map(apt => {
                            const svc = services.find(s => s.name === apt.service);
                            const color = svc?.color || COLORS.pink;
                            const style = getPositionStyle(apt.time, svc?.duration || '1h');
                            if (parseFloat(style.top) < 0 || parseFloat(style.top) > schedulerHeight) return null;
                            return (
                              <div key={apt.id} onClick={() => { setSelectedAppointment(apt); setIsDetailsModalOpen(true); }}
                                className="absolute left-1 right-1 rounded-xl p-2 shadow-sm border-l-4 cursor-pointer hover:scale-[1.02] transition-all z-20 overflow-hidden flex flex-col justify-center"
                                style={{ ...style, backgroundColor: `${color}10`, borderLeftColor: color }}>
                                <span className="text-[8px] font-black uppercase tracking-tight mb-0.5" style={{ color }}>{apt.time}</span>
                                <h5 className="font-bold text-[9px] text-gray-900 leading-none truncate">{apt.service}</h5>
                                <p className="text-[8px] text-gray-400 truncate mt-0.5">{apt.clientName}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    visibleStaff.map(pro => {
                      const proAppts = appointments.filter(a => a.professionalId === pro.id && a.date === selectedDate && filterApt(a));
                      return (
                        <div key={pro.id} className="min-w-[200px] flex-1 relative border-r border-gray-50 last:border-0">
                          {proAppts.map(apt => {
                            const svc = services.find(s => s.name === apt.service);
                            const color = svc?.color || COLORS.pink;
                            const style = getPositionStyle(apt.time, svc?.duration || '1h');
                            if (parseFloat(style.top) < 0 || parseFloat(style.top) > schedulerHeight) return null;
                            return (
                              <div key={apt.id} onClick={() => { setSelectedAppointment(apt); setIsDetailsModalOpen(true); }}
                                className="absolute left-2 right-2 rounded-2xl p-3 shadow-md border-l-4 cursor-pointer hover:scale-[1.02] transition-all z-20 overflow-hidden flex flex-col justify-center"
                                style={{ ...style, backgroundColor: `${color}10`, borderLeftColor: color }}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color }}><Clock size={10} /> {apt.time}</span>
                                  <div className="w-4 h-4 bg-white/50 rounded-full flex items-center justify-center"><CheckCircle2 size={10} className="text-emerald-500" /></div>
                                </div>
                                <h5 className="font-bold text-[11px] text-gray-900 leading-tight truncate">{apt.service}</h5>
                                <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{apt.clientName}</p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {viewMode === 'month' && (
          <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="bg-gray-50/80 p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
              ))}
              {calendarDays.map((item, i) => (
                <div key={i} className={`bg-white min-h-[140px] p-3 border-r border-b border-gray-50 last:border-r-0 flex flex-col gap-2 transition-colors hover:bg-gray-50/50 ${item.type === 'day' ? 'cursor-pointer' : ''}`}>
                  {item.type === 'day' && (
                    <>
                      <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-xl mb-2 ${item.dateStr === TODAY ? 'bg-[#FF69B4] text-white shadow-lg shadow-pink-100' : 'text-gray-400'}`}>{item.day}</span>
                      <div className="space-y-1">
                        {appointments.filter(a => a.date === item.dateStr && filterApt(a)).slice(0, 3).map(a => (
                          <div
                            key={a.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedAppointment(a); setIsDetailsModalOpen(true); }}
                            className="text-[9px] truncate bg-gray-50 p-1.5 rounded-lg border border-gray-100 font-bold text-gray-600 flex items-center gap-1 cursor-pointer hover:bg-white hover:shadow-sm hover:border-[#FF69B4]/30 transition-all active:scale-95"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-[#40E0D0]"></div>
                            {a.time} {a.clientName.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Novo Agendamento */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FF69B4] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <CalendarIcon size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Novo Agendamento 🌸</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Reserva de horário rápida</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <form onSubmit={handleAddAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Selecionar Cliente</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF69B4]" size={18} />
                  <select
                    required
                    value={newApt.clientId}
                    onChange={e => setNewApt({ ...newApt, clientId: e.target.value })}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#FF69B4]/20 font-bold appearance-none transition-all"
                  >
                    <option value="">Buscar cliente...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                  Serviço
                  {newApt.professionalId && <span className="text-[#40E0D0] ml-1 lowercase">({availableServicesForForm.length} ativos)</span>}
                </label>
                <div className="relative group">
                  <Scissors className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF69B4]" size={18} />
                  <select
                    required
                    value={newApt.serviceId}
                    onChange={e => {
                      const svcId = e.target.value;
                      setNewApt(prev => {
                        const currentPro = staff.find(p => p.id === prev.professionalId);
                        const isCompatible = currentPro?.services?.includes(svcId);
                        return {
                          ...prev,
                          serviceId: svcId,
                          professionalId: isCompatible ? prev.professionalId : '',
                          time: '' // Reset horário ao trocar serviço
                        };
                      });
                    }}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#FF69B4]/20 font-bold appearance-none transition-all"
                  >
                    <option value="">Escolher serviço</option>
                    {availableServicesForForm.map(s => <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">
                  Especialista
                  <span className={`ml-1 lowercase ${newApt.time ? 'text-[#FF69B4]' : 'text-gray-400'}`}>({availableStaffForForm.length} livres)</span>
                </label>
                <div className="relative group">
                  <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF69B4]" size={18} />
                  <select
                    required
                    value={newApt.professionalId}
                    onChange={e => {
                      const proId = e.target.value;
                      setNewApt(prev => {
                        const newPro = sortedStaff.find(p => p.id === proId);
                        const isCompatible = newPro?.services?.includes(prev.serviceId);
                        return {
                          ...prev,
                          professionalId: proId,
                          serviceId: isCompatible ? prev.serviceId : '',
                          time: '' // Revalida disponibilidade
                        };
                      });
                    }}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#FF69B4]/20 font-bold appearance-none transition-all"
                  >
                    <option value="">Selecionar profissional</option>
                    {availableStaffForForm.map(p => <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                <input
                  required
                  type="date"
                  value={newApt.date}
                  onChange={e => setNewApt({ ...newApt, date: e.target.value, time: '' })}
                  min={TODAY}
                  className="w-full bg-[#F5F5F5] border-none rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-[#FF69B4]/20 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Horário
                  {availableTimesForForm.length > 0 && <span className="text-[#40E0D0] ml-1 lowercase">({availableTimesForForm.length} slots)</span>}
                </label>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      const timeStr = newApt.time || '12:00';
                      const parts = timeStr.split(':');
                      const h = parts[0] ? Number(parts[0]) : 12;
                      const m = parts[1] ? Number(parts[1]) : 0;

                      setTimePickerConfig({
                        isOpen: true,
                        label: "Escolher Horário",
                        initialH: h,
                        initialM: m,
                        onConfirm: (nh, nm) => setNewApt(prev => ({ ...prev, time: `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}` }))
                      });
                    }}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 py-4 font-bold text-left hover:bg-gray-100 transition-all"
                  >
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <span>{newApt.time || '--:--'}</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 pt-4">
                <button type="submit" className="w-full py-5 bg-[#FF69B4] text-white rounded-[1.8rem] font-black text-lg shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Save size={20} /> Agendar Agora ✨
                </button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}

      {/* MODAL DETALHES */}
      {isDetailsModalOpen && selectedAppointment && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black">Detalhes do Agendamento</h3>
              <button onClick={() => setIsDetailsModalOpen(false)} className="p-2 bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-[2rem]">
                <p className="text-[10px] font-black text-[#FF69B4] uppercase tracking-widest mb-1">{selectedAppointment.service}</p>
                <h4 className="text-2xl font-black text-gray-900">{selectedAppointment.clientName}</h4>
                <div className="flex items-center gap-4 mt-4 text-sm font-bold text-gray-500">
                  <div className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(selectedAppointment.date + 'T12:00:00').toLocaleDateString()}</div>
                  <div className="flex items-center gap-1"><Clock size={14} /> {selectedAppointment.time}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setRescheduleData({ date: selectedAppointment.date, time: selectedAppointment.time });
                    setIsRescheduleOpen(true);
                  }}
                  className="py-4 bg-[#40E0D0]/10 text-[#40E0D0] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#40E0D0]/20 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> {t.appointments.reschedule}
                </button>
                <button
                  onClick={() => setIsConfirmCancelOpen(true)}
                  className="py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      {/* MODAL REAGENDAMENTO (WhatsApp Notifier) */}
      {isRescheduleOpen && selectedAppointment && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -translate-y-1/2 translate-x-1/2 -z-10"></div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#40E0D0] rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <RefreshCw size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">{t.appointments.rescheduleTitle}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.appointments.rescheduleSubtitle}</p>
                </div>
              </div>
              <button onClick={() => setIsRescheduleOpen(false)} className="p-2 bg-gray-50 rounded-full hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Nova Data</label>
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl px-5 py-4 outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 block mb-1">Novo Horário</label>
                  <button
                    type="button"
                    onClick={() => {
                      const [h, m] = rescheduleData.time.split(':').map(Number);
                      setTimePickerConfig({
                        isOpen: true,
                        label: "Novo Horário",
                        initialH: h || 12,
                        initialM: m || 0,
                        onConfirm: (nh, nm) => setRescheduleData(prev => ({ ...prev, time: `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}` }))
                      });
                    }}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl pl-12 pr-4 py-4 outline-none font-bold text-left relative hover:bg-gray-100 transition-all"
                  >
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <span>{rescheduleData.time || '--:--'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100/50">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <MessageCircle size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Aviso ao Cliente</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  A BellaAI enviará automaticamente uma sugestão de horário para o cliente via WhatsApp após a confirmação.
                </p>
              </div>

              <button
                onClick={handleReschedule}
                className="w-full py-5 bg-emerald-500 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send size={18} /> {t.appointments.sendNotification}
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {/* MODAL CONFIRMAÇÃO DE CANCELAMENTO */}
      {isConfirmCancelOpen && selectedAppointment && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Confirmar Cancelamento?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Você está prestes a cancelar o horário de <span className="font-bold text-gray-800">{selectedAppointment.clientName}</span>. Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button onClick={handleConfirmCancel} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all">Sim, Cancelar Atendimento</button>
              <button onClick={() => setIsConfirmCancelOpen(false)} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all">Não, Manter Horário</button>
            </div>
          </div>
        </div>, document.body
      )}
      {/* Time Picker Global Instance */}
      <TimePicker
        isOpen={timePickerConfig.isOpen}
        onClose={() => setTimePickerConfig({ ...timePickerConfig, isOpen: false })}
        label={timePickerConfig.label}
        initialHours={timePickerConfig.initialH}
        initialMinutes={timePickerConfig.initialM}
        onConfirm={timePickerConfig.onConfirm}
      />
    </div>
  );
};

export default AppointmentsView;
