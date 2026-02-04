
import React, { useState, useRef, useMemo } from 'react';
import { Professional, BlockedPeriod, WorkSchedule, Service, Category } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/database';
import {
  Plus, Star, Calendar, ChevronRight, Settings, X,
  Trash2, Check, Sparkles, AlertCircle, Camera,
  Upload, User, ShieldAlert, Clock, BarChart3, TrendingUp,
  AlertTriangle, Sun, Moon, Coffee, Utensils, Copy,
  CheckCircle2
} from 'lucide-react';
import { TimePicker } from './ui';

interface StaffProps {
  staff: Professional[];
  services: Service[];
  onAdd: (pro: Omit<Professional, 'id'>) => Promise<void>;
  onUpdate: (pro: Professional) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  blockedPeriods: BlockedPeriod[];
  onBlock: (block: BlockedPeriod) => void;
  onUnblock: (id: string) => void;
  onViewSchedule: () => void;
  categories: Category[];
  onShowToast: (msg: string) => void;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const StaffView: React.FC<StaffProps> = ({
  staff,
  services,
  onAdd,
  onUpdate,
  onDelete,
  blockedPeriods,
  onBlock,
  onUnblock,
  onViewSchedule,
  categories,
  onShowToast
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'master_admin' || user?.role === 'company_admin';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [selectedPro, setSelectedPro] = useState<Professional | null>(null);

  // State for Add New Pro
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [newPro, setNewPro] = useState<{
    name: string;
    role: string;
    specialty: string;
    commissionRate: number;
    avatar: string;
    services: string[];
    appointmentsGoal: number;
  }>({
    name: '',
    role: '',
    specialty: '',
    commissionRate: 40,
    avatar: '',
    services: [],
    appointmentsGoal: 200
  });

  const [blockData, setBlockData] = useState({
    date: new Date().toISOString().split('T')[0],
    start: '12:00',
    end: '13:00',
    reason: 'Almoço'
  });

  // State for Schedule Editor
  const [activeDay, setActiveDay] = useState(1); // Default to Monday
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule>({});

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

  const fileInputAddRef = useRef<HTMLInputElement>(null);
  const fileInputEditRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit && selectedPro) {
          setSelectedPro({ ...selectedPro, avatar: base64 });
        } else {
          setNewPro({ ...newPro, avatar: base64 });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = async () => {
    if (!newPro.name || !newPro.role) return;
    setIsUploading(true);

    try {
      let finalAvatar = newPro.avatar || `https://picsum.photos/seed/${newPro.name}/150/150`;

      if (selectedFile) {
        const fileName = `pro-${Date.now()}-${selectedFile.name}`;
        finalAvatar = await db.uploadFile('avatars', fileName, selectedFile);
      }

      const defaultSchedule: WorkSchedule = {};
      for (let i = 0; i < 7; i++) defaultSchedule[i] = { isOff: i === 0, workStart: '09:00', workEnd: '19:00', lunchStart: '12:00', lunchEnd: '13:00' };

      await onAdd({
        name: newPro.name,
        role: newPro.role,
        specialties: newPro.specialty ? [newPro.specialty] : [],
        services: newPro.services,
        commissionRate: newPro.commissionRate,
        avatar: finalAvatar,
        rating: 5.0,
        revenueGenerated: 0,
        appointmentsCount: 0,
        appointmentsGoal: newPro.appointmentsGoal,
        schedule: defaultSchedule
      });
      setIsModalOpen(false);
      setNewPro({ name: '', role: '', specialty: '', commissionRate: 40, avatar: '', services: [], appointmentsGoal: 200 });
      setSelectedFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      onShowToast("Erro ao enviar imagem. Verifique sua conexão.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPro || !selectedPro.name || !selectedPro.role) return;
    setIsUploading(true);

    try {
      let finalPro = { ...selectedPro };

      if (selectedFile) {
        const fileName = `pro-${selectedPro.id}-${Date.now()}-${selectedFile.name}`;
        const uploadedUrl = await db.uploadFile('avatars', fileName, selectedFile);
        finalPro.avatar = uploadedUrl;
      }

      await onUpdate(finalPro);
      setIsEditModalOpen(false);
      setSelectedPro(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Update error:", err);
      onShowToast("Erro ao atualizar perfil.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedPro) {
      await onDelete(selectedPro.id);
      setIsDeleteModalOpen(false);
      setSelectedPro(null);
    }
  };

  const handleBlock = () => {
    if (!selectedPro) return;
    onBlock({
      id: Math.random().toString(36).substr(2, 9),
      professionalId: selectedPro.id,
      date: blockData.date,
      startTime: blockData.start,
      endTime: blockData.end,
      reason: blockData.reason
    });
    setIsBlockModalOpen(false);
  };

  const openScheduleModal = (pro: Professional) => {
    setSelectedPro(pro);
    setEditingSchedule(pro.schedule ? JSON.parse(JSON.stringify(pro.schedule)) : {});
    setIsScheduleModalOpen(true);
  };

  const updateScheduleDay = (field: string, value: any) => {
    setEditingSchedule(prev => ({
      ...prev,
      [activeDay]: {
        ...prev[activeDay],
        [field]: value
      }
    }));
  };

  const replicateSchedule = () => {
    const currentDayConfig = editingSchedule[activeDay];
    const newSchedule = { ...editingSchedule };
    // Replicate to Mon(1) - Fri(5)
    for (let i = 1; i <= 5; i++) {
      if (i !== activeDay) {
        newSchedule[i] = JSON.parse(JSON.stringify(currentDayConfig));
      }
    }
    setEditingSchedule(newSchedule);
    onShowToast('Horários replicados de Segunda a Sexta! 🚀');
  };

  const saveSchedule = () => {
    if (selectedPro) {
      onUpdate({ ...selectedPro, schedule: editingSchedule });
      setIsScheduleModalOpen(false);
      setSelectedPro(null);
    }
  };

  const getProBlocks = (proId: string) => blockedPeriods.filter(b => b.professionalId === proId);

  // Helper para agrupar serviços por categoria
  const groupedServices = services.reduce((acc, service) => {
    const cat = categories.find(c => c.id === service.category || c.label === service.category);
    const catLabel = cat?.label || service.category || 'Outros';

    if (!acc[catLabel]) acc[catLabel] = [];
    acc[catLabel].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const toggleServiceNewPro = (serviceId: string) => {
    setNewPro(prev => {
      const exists = prev.services.includes(serviceId);
      return {
        ...prev,
        services: exists ? prev.services.filter(id => id !== serviceId) : [...prev.services, serviceId]
      };
    });
  };

  const toggleServiceEditPro = (serviceId: string) => {
    if (!selectedPro) return;
    const currentServices = selectedPro.services || [];
    const exists = currentServices.includes(serviceId);
    const newServices = exists
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];

    setSelectedPro({ ...selectedPro, services: newServices });
  };

  const sortedStaff = useMemo(() => {
    return [...staff].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
  }, [staff]);

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Minha Equipe 💎</h2>
          <p className="text-gray-500 text-sm">Gerencie talentos, disponibilidades e performance.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#FF69B4] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} /> Cadastrar Profissional
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sortedStaff.map((pro, index) => {
          const isLivia = pro.name === 'Lívia Nicolly';

          return (
            <div
              key={pro.id}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col"
            >
              {/* Header Card - Pink for Livia or First, Gray for others */}
              <div className={`h-28 w-full ${isLivia ? 'bg-[#FF69B4]' : 'bg-[#F5F5F5]'} relative mb-12`}>
                <div className="absolute -bottom-10 left-6">
                  <div className="relative">
                    <img
                      src={pro.avatar}
                      alt={pro.name}
                      className="w-24 h-24 rounded-[1.8rem] border-4 border-white object-cover shadow-lg"
                    />
                    <div className="absolute top-0 -right-2 transform translate-x-1/2 -translate-y-1/4">
                      <div className="bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 border border-gray-50">
                        <Star size={14} fill="#FFD700" className="text-[#FFD700]" />
                        <span className="text-sm font-black text-gray-800">{pro.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 pt-2 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-2xl font-black text-gray-900 mb-1">{pro.name}</h3>
                  <p className="text-[#40E0D0] font-bold text-sm tracking-tight">{pro.role}</p>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {pro.services && pro.services.length > 0 ? (
                    <>
                      <span className="px-3 py-1 bg-pink-50 text-pink-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-pink-100 flex items-center gap-1">
                        <Sparkles size={10} /> {pro.services.length} Serviços
                      </span>
                      {pro.specialties.map(spec => (
                        <span key={spec} className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-gray-100">
                          {spec}
                        </span>
                      ))}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sem serviços vinculados</span>
                  )}
                </div>

                <div className="mt-auto space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openScheduleModal(pro)}
                      className="flex-1 py-4 bg-[#FF69B4]/10 text-[#FF69B4] border border-[#FF69B4]/20 rounded-2xl font-black text-xs hover:bg-[#FF69B4]/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Clock size={18} /> Configurar Horários
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSelectedPro(pro); setIsBlockModalOpen(true); }}
                      className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl font-black text-xs text-gray-700 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShieldAlert size={18} /> Bloquear Data
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { setSelectedPro(pro); setIsEditModalOpen(true); }}
                        className="w-16 h-14 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-300 hover:text-gray-900 transition-all shadow-sm"
                      >
                        <Settings size={22} />
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                        Comissão: <span className="text-[#FF69B4]">{pro.commissionRate}%</span>
                      </span>
                      <button
                        onClick={() => { setSelectedPro(pro); setIsReportOpen(true); }}
                        className="text-[#40E0D0] text-xs font-black uppercase tracking-widest flex items-center gap-1 hover:scale-105 transition-transform"
                      >
                        Performance <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Configuração de Jornada (Schedule) - Ajustado para rolagem em celulares */}
      {isScheduleModalOpen && selectedPro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 overflow-y-auto max-h-[95vh] scrollbar-hide">
            <div className="flex justify-between items-center sticky top-0 bg-white pb-2 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FF69B4] rounded-[1.2rem] flex items-center justify-center text-white shadow-lg">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900">Jornada de Trabalho</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedPro.name}</p>
                </div>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-3 bg-gray-50 rounded-full hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            {/* Day Selector */}
            <div className="flex bg-gray-100 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide">
              {DAYS.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveDay(idx)}
                  className={`flex-1 min-w-[60px] md:min-w-[50px] py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeDay === idx ? 'bg-white text-[#FF69B4] shadow-md scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Schedule Content */}
            <div className="bg-[#F9FAFB] p-5 md:p-6 rounded-[2.5rem] border border-gray-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  {DAYS[activeDay]} <span className="text-gray-300 font-normal">Configuração</span>
                </h4>

                {/* Day Off Toggle */}
                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-colors ${editingSchedule[activeDay]?.isOff ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-gray-100 text-gray-400'}`}
                  onClick={() => updateScheduleDay('isOff', !editingSchedule[activeDay]?.isOff)}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">Dia de Folga</span>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${editingSchedule[activeDay]?.isOff ? 'bg-rose-400' : 'bg-gray-300'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${editingSchedule[activeDay]?.isOff ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className={`space-y-6 transition-opacity duration-300 ${editingSchedule[activeDay]?.isOff ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
                {/* Work Hours */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Sun size={12} className="text-orange-400" /> Início Expediente
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const [h, m] = (editingSchedule[activeDay]?.workStart || '09:00').split(':').map(Number);
                        setTimePickerConfig({
                          isOpen: true,
                          label: "Início Expediente",
                          initialH: h,
                          initialM: m,
                          onConfirm: (nh, nm) => updateScheduleDay('workStart', `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`)
                        });
                      }}
                      className="text-2xl font-black text-gray-800 text-left hover:text-[#FF69B4] transition-colors"
                    >
                      {editingSchedule[activeDay]?.workStart || '09:00'}
                    </button>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Moon size={12} className="text-indigo-400" /> Fim Expediente
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const [h, m] = (editingSchedule[activeDay]?.workEnd || '19:00').split(':').map(Number);
                        setTimePickerConfig({
                          isOpen: true,
                          label: "Fim Expediente",
                          initialH: h,
                          initialM: m,
                          onConfirm: (nh, nm) => updateScheduleDay('workEnd', `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`)
                        });
                      }}
                      className="text-2xl font-black text-gray-800 text-left hover:text-[#FF69B4] transition-colors"
                    >
                      {editingSchedule[activeDay]?.workEnd || '19:00'}
                    </button>
                  </div>
                </div>

                {/* Lunch Break */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Utensils size={60} className="text-gray-900" />
                  </div>
                  <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Utensils size={14} className="text-[#40E0D0]" /> Pausa Almoço
                  </h5>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Saída</label>
                      <button
                        type="button"
                        onClick={() => {
                          const [h, m] = (editingSchedule[activeDay]?.lunchStart || '12:00').split(':').map(Number);
                          setTimePickerConfig({
                            isOpen: true,
                            label: "Saída para Almoço",
                            initialH: h,
                            initialM: m,
                            onConfirm: (nh, nm) => updateScheduleDay('lunchStart', `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`)
                          });
                        }}
                        className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold text-gray-700 text-left hover:bg-gray-100 transition-all"
                      >
                        {editingSchedule[activeDay]?.lunchStart || '12:00'}
                      </button>
                    </div>
                    <span className="text-gray-300 font-black">-</span>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Retorno</label>
                      <button
                        type="button"
                        onClick={() => {
                          const [h, m] = (editingSchedule[activeDay]?.lunchEnd || '13:00').split(':').map(Number);
                          setTimePickerConfig({
                            isOpen: true,
                            label: "Retorno do Almoço",
                            initialH: h,
                            initialM: m,
                            onConfirm: (nh, nm) => updateScheduleDay('lunchEnd', `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`)
                          });
                        }}
                        className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold text-gray-700 text-left hover:bg-gray-100 transition-all"
                      >
                        {editingSchedule[activeDay]?.lunchEnd || '13:00'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extra Break */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Coffee size={60} className="text-gray-900" />
                  </div>
                  <h5 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Coffee size={14} className="text-amber-500" /> Pausa Café / Descanso
                  </h5>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Início (Opcional)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const val = editingSchedule[activeDay]?.breakStart || '00:00';
                          const [h, m] = val.split(':').map(Number);
                          setTimePickerConfig({
                            isOpen: true,
                            label: "Início do Café",
                            initialH: h,
                            initialM: m,
                            onConfirm: (nh, nm) => updateScheduleDay('breakStart', `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`)
                          });
                        }}
                        className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold text-gray-700 text-left hover:bg-gray-100 transition-all font-mono"
                      >
                        {editingSchedule[activeDay]?.breakStart || '--:--'}
                      </button>
                    </div>
                    <span className="text-gray-300 font-black">-</span>
                    <div className="flex-1">
                      <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Fim (Opcional)</label>
                      <button
                        type="button"
                        onClick={() => {
                          const val = editingSchedule[activeDay]?.breakEnd || '00:00';
                          const [h, m] = val.split(':').map(Number);
                          setTimePickerConfig({
                            isOpen: true,
                            label: "Fim do Café",
                            initialH: h,
                            initialM: m,
                            onConfirm: (nh, nm) => updateScheduleDay('breakEnd', `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`)
                          });
                        }}
                        className="w-full bg-gray-50 rounded-xl px-3 py-2 font-bold text-gray-700 text-left hover:bg-gray-100 transition-all font-mono"
                      >
                        {editingSchedule[activeDay]?.breakEnd || '--:--'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 pt-2">
              <button
                onClick={replicateSchedule}
                className="w-full md:flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                title="Copiar configuração de hoje para Segunda a Sexta"
              >
                <Copy size={16} /> Replicar (Seg-Sex)
              </button>
              <button
                onClick={saveSchedule}
                className="w-full md:flex-[2] py-4 bg-[#FF69B4] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Salvar Jornada ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Profissional */}
      {isEditModalOpen && selectedPro && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in duration-300 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">Editar Perfil ⚙️</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div
                onClick={() => fileInputEditRef.current?.click()}
                className="w-24 h-24 rounded-3xl bg-[#F5F5F5] border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer relative group"
              >
                {selectedPro.avatar ? (
                  <img src={selectedPro.avatar} className="w-full h-full object-cover" alt="Preview" />
                ) : <User size={30} className="text-gray-300" />}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={18} className="text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputEditRef} onChange={(e) => handleImageChange(e, true)} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-bold" value={selectedPro.name} onChange={e => setSelectedPro({ ...selectedPro, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo / Título</label>
                  <input type="text" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-bold text-[#40E0D0]" value={selectedPro.role} onChange={e => setSelectedPro({ ...selectedPro, role: e.target.value })} />
                </div>
              </div>

              {/* Seleção de Serviços com Grid e Categorias */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Habilidades & Serviços</label>
                <div className="bg-[#F9FAFB] p-4 rounded-3xl border border-gray-100 max-h-60 overflow-y-auto scrollbar-hide">
                  {Object.keys(groupedServices).map(category => (
                    <div key={category} className="mb-4 last:mb-0">
                      <h5 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide px-1">{category}</h5>
                      <div className="flex flex-wrap gap-2">
                        {groupedServices[category].map(svc => {
                          const isSelected = selectedPro.services?.includes(svc.id);
                          return (
                            <button
                              key={svc.id}
                              onClick={() => toggleServiceEditPro(svc.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${isSelected ? 'bg-[#FF69B4] text-white border-[#FF69B4]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                              {isSelected && <CheckCircle2 size={12} />}
                              {svc.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comissão (%)</label>
                  <input type="number" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-black" value={selectedPro.commissionRate} onChange={e => setSelectedPro({ ...selectedPro, commissionRate: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta de Atendimentos</label>
                  <input type="number" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-black text-[#FF69B4]" value={selectedPro.appointmentsGoal || 0} onChange={e => setSelectedPro({ ...selectedPro, appointmentsGoal: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Avaliação</label>
                  <div className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-black flex items-center gap-2 text-yellow-600">
                    <Star size={16} fill="currentColor" /> {selectedPro.rating.toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="flex-1 py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-100 transition-all"
                >
                  Excluir
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUploading}
                  className="flex-[2] py-4 bg-[#40E0D0] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Plus className="animate-spin" /> : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão (Admin Only) */}
      {isDeleteModalOpen && selectedPro && isAdmin && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 border border-white/20 text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[1.5rem] flex items-center justify-center text-rose-500 mx-auto shadow-sm mb-2">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Remover Profissional?</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Você está prestes a remover <span className="font-bold text-gray-800">{selectedPro.name}</span> da equipe. O histórico financeiro será preservado.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleConfirmDelete}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all"
              >
                Sim, Remover
              </button>
              <button
                onClick={() => { setIsDeleteModalOpen(false); setIsEditModalOpen(true); }}
                className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
              >
                Não, Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bloquear Agenda */}
      {isBlockModalOpen && selectedPro && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-xl font-black">Bloquear Horário 🔒</h3>
              </div>
              <button onClick={() => setIsBlockModalOpen(false)}><X /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profissional</label>
                <div className="p-4 bg-gray-50 rounded-2xl font-black text-gray-800">{selectedPro.name}</div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data</label>
                  <input
                    type="date"
                    className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-bold"
                    value={blockData.date}
                    onChange={e => setBlockData({ ...blockData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Início</label>
                  <button
                    type="button"
                    onClick={() => {
                      const [h, m] = blockData.start.split(':').map(Number);
                      setTimePickerConfig({
                        isOpen: true,
                        label: "Início do Bloqueio",
                        initialH: h,
                        initialM: m,
                        onConfirm: (nh, nm) => setBlockData({ ...blockData, start: `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}` })
                      });
                    }}
                    className="w-full bg-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-700 text-left hover:bg-gray-200 transition-all"
                  >
                    {blockData.start}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fim</label>
                  <button
                    type="button"
                    onClick={() => {
                      const [h, m] = blockData.end.split(':').map(Number);
                      setTimePickerConfig({
                        isOpen: true,
                        label: "Fim do Bloqueio",
                        initialH: h,
                        initialM: m,
                        onConfirm: (nh, nm) => setBlockData({ ...blockData, end: `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}` })
                      });
                    }}
                    className="w-full bg-gray-100 rounded-2xl px-5 py-4 font-bold text-gray-700 text-left hover:bg-gray-200 transition-all"
                  >
                    {blockData.end}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motivo</label>
                <input
                  type="text"
                  placeholder="Ex: Horário de Almoço"
                  className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-medium"
                  value={blockData.reason}
                  onChange={e => setBlockData({ ...blockData, reason: e.target.value })}
                />
              </div>

              <div className="pt-4 space-y-4">
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                  {getProBlocks(selectedPro.id).map(block => (
                    <div key={block.id} className="flex justify-between items-center p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs">
                      <span className="font-black text-amber-800">{new Date(block.date + 'T12:00:00').toLocaleDateString()} • {block.startTime}-{block.endTime}</span>
                      <button onClick={() => onUnblock(block.id)} className="text-amber-400 hover:text-amber-600 transition-colors p-1"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleBlock}
                  className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-transform"
                >
                  Confirmar Bloqueio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Performance (Admin Only) */}
      {isReportOpen && selectedPro && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#40E0D0]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#40E0D0] rounded-[1.2rem] flex items-center justify-center text-white shadow-xl">
                  <BarChart3 size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Performance: {selectedPro.name.split(' ')[0]}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Análise Mensal em Tempo Real</p>
                </div>
              </div>
              <button onClick={() => setIsReportOpen(false)} className="p-3 bg-gray-50 rounded-full hover:rotate-90 transition-transform"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="bg-[#F5F5F5] p-6 rounded-[2rem] border border-white">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Faturamento</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">R$ {selectedPro.revenueGenerated.toLocaleString()}</h2>
                <span className="text-emerald-500 font-black text-[10px] flex items-center gap-1 mt-1">
                  <TrendingUp size={12} /> +12% este mês
                </span>
              </div>
              <div className="bg-[#F5F5F5] p-6 rounded-[2rem] border border-white">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Atendimentos</span>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedPro.appointmentsCount}</h2>
                <span className="text-[#FF69B4] font-black text-[10px] uppercase mt-1 block">Meta: {selectedPro.appointmentsGoal || 200}</span>
              </div>
            </div>

            <button
              onClick={() => setIsReportOpen(false)}
              className="w-full py-5 bg-[#FF69B4] text-white rounded-[2rem] font-black text-lg shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Fechar Relatório 🌸
            </button>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Profissional (Admin Only) */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom-6 duration-300 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black">Novo Talento 💎</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div
                onClick={() => fileInputAddRef.current?.click()}
                className="w-24 h-24 rounded-[1.8rem] bg-[#F5F5F5] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden cursor-pointer hover:border-[#FF69B4]/50 transition-all relative group"
              >
                {newPro.avatar ? (
                  <img src={newPro.avatar} className="w-full h-full object-cover" alt="Preview" />
                ) : (
                  <>
                    <Camera size={24} className="text-gray-300 group-hover:text-[#FF69B4] transition-colors" />
                    <span className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-widest">Foto</span>
                  </>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload size={18} className="text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputAddRef} onChange={(e) => handleImageChange(e, false)} className="hidden" accept="image/*" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input type="text" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-bold" value={newPro.name} onChange={e => setNewPro({ ...newPro, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cargo</label>
                  <input type="text" placeholder="Ex: Master Stylist" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-bold" value={newPro.role} onChange={e => setNewPro({ ...newPro, role: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Especialidade</label>
                  <input type="text" placeholder="Ex: Mechas" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-bold text-[#FF69B4]" value={newPro.specialty} onChange={e => setNewPro({ ...newPro, specialty: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Comissão (%)</label>
                  <input type="number" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-black" value={newPro.commissionRate} onChange={e => setNewPro({ ...newPro, commissionRate: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Mensal</label>
                  <input type="number" placeholder="Ex: 200" className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 outline-none font-black text-[#40E0D0]" value={newPro.appointmentsGoal} onChange={e => setNewPro({ ...newPro, appointmentsGoal: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              {/* Seleção de Serviços com Grid e Categorias */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Habilidades & Serviços</label>
                <div className="bg-[#F9FAFB] p-4 rounded-3xl border border-gray-100 max-h-60 overflow-y-auto scrollbar-hide">
                  {Object.keys(groupedServices).map(category => (
                    <div key={category} className="mb-4 last:mb-0">
                      <h5 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide px-1">{category}</h5>
                      <div className="flex flex-wrap gap-2">
                        {groupedServices[category].map(svc => {
                          const isSelected = newPro.services.includes(svc.id);
                          return (
                            <button
                              key={svc.id}
                              onClick={() => toggleServiceNewPro(svc.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${isSelected ? 'bg-[#FF69B4] text-white border-[#FF69B4]' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                            >
                              {isSelected && <CheckCircle2 size={12} />}
                              {svc.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                className="w-full py-5 bg-[#FF69B4] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-pink-100 mt-4 active:scale-95 transition-all"
              >
                Cadastrar na Equipe ✨
              </button>
            </div>
          </div>
        </div>
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

export default StaffView;
