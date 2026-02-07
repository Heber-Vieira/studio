import React, { useState, useMemo } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { TrendingUp, Users, Calendar, Sparkles, ChevronDown, Clock, ArrowRight, Star, Gift, Scissors, LogOut, X, CheckCircle2, User } from 'lucide-react';
import { COLORS } from '../constants';
import { View, Appointment, UserRole, UserProfile, SalonSettings, Client, Professional, Service, Transaction, ConfirmDialogOptions } from '../types';

interface DashboardProps {
   t: any;
   onAction: (view: View, filter?: string) => void;
   onNavigateDate: (date: string) => void;
   appointments: Appointment[];
   userRole: UserRole;
   user?: UserProfile;
   settings?: SalonSettings;
   clients?: Client[];
   staff?: Professional[];
   transactions?: Transaction[];
   onLogout: () => void;
   onShowConfirm: (options: ConfirmDialogOptions) => void;
   services?: Service[];
}

type RangeType = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

const Dashboard: React.FC<DashboardProps> = ({ t, onAction, onNavigateDate, appointments, userRole, user, settings, clients = [], staff = [], services = [], transactions = [], onLogout, onShowConfirm }) => {
   const [timeRange, setTimeRange] = useState<RangeType>('weekly');
   const [scheduleTab, setScheduleTab] = useState<'today' | 'tomorrow'>('today');
   const [isMyAppointmentsOpen, setIsMyAppointmentsOpen] = useState(false);

   const chartData = useMemo(() => {
      const today = new Date();
      let data: { name: string; sales: number; appointments: number }[] = [];

      if (timeRange === 'weekly') {
         // Last 7 days
         for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' });

            const daySales = transactions
               .filter(t => t.date.startsWith(dateStr) && t.type === 'income')
               .reduce((sum, t) => sum + t.amount, 0);
            const dayAppts = appointments.filter(a => a.date === dateStr).length;

            data.push({ name: dayName, sales: daySales, appointments: dayAppts });
         }
      } else if (timeRange === 'monthly') {
         // Last 30 days (per week approx or per 5 days to fit)
         // Let's do last 4 weeks
         for (let i = 3; i >= 0; i--) {
            const end = new Date(today);
            end.setDate(today.getDate() - (i * 7));
            const start = new Date(end);
            start.setDate(end.getDate() - 6);

            const weekLabel = `${start.getDate()}/${start.getMonth() + 1}`;

            let weekSales = 0;
            let weekAppts = 0;

            // Simple loop for the range
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
               const dStr = d.toISOString().split('T')[0];
               weekSales += transactions.filter(t => t.date.startsWith(dStr) && t.type === 'income').reduce((s, t) => s + t.amount, 0);
               weekAppts += appointments.filter(a => a.date === dStr).length;
            }
            data.push({ name: weekLabel, sales: weekSales, appointments: weekAppts });
         }
      } else if (timeRange === 'quarterly') {
         // Last 3 months
         for (let i = 2; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthName = d.toLocaleDateString('pt-BR', { month: 'long' });

            const monthSales = transactions
               .filter(t => t.date.startsWith(monthKey) && t.type === 'income')
               .reduce((s, t) => s + t.amount, 0);
            const monthAppts = appointments.filter(a => a.date.startsWith(monthKey)).length;

            data.push({ name: monthName, sales: monthSales, appointments: monthAppts });
         }
      } else if (timeRange === 'yearly') {
         // Last 12 months
         for (let i = 11; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
            const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });

            const monthSales = transactions
               .filter(t => t.date.startsWith(monthKey) && t.type === 'income')
               .reduce((s, t) => s + t.amount, 0);
            const monthAppts = appointments.filter(a => a.date.startsWith(monthKey)).length;

            data.push({ name: monthName, sales: monthSales, appointments: monthAppts });
         }
      }

      return data;
   }, [timeRange, transactions, appointments]);

   const formatDateISO = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
   };

   const formatDateDisplay = (date: Date) => {
      return date.toLocaleDateString('pt-BR');
   };

   const todayDate = new Date();
   const tomorrowDate = new Date(todayDate);
   tomorrowDate.setDate(todayDate.getDate() + 1);

   const TODAY = formatDateISO(todayDate);
   const TOMORROW = formatDateISO(tomorrowDate);

   const todayAppts = appointments
      .filter(a => a.date === TODAY && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));

   const tomorrowAppts = appointments
      .filter(a => a.date === TOMORROW && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time));

   const currentList = scheduleTab === 'today' ? todayAppts : tomorrowAppts;
   const currentDate = scheduleTab === 'today' ? TODAY : TOMORROW;
   const currentDateDisplay = scheduleTab === 'today' ? formatDateDisplay(todayDate) : formatDateDisplay(tomorrowDate);

   const handleGoToSchedule = (date?: string) => {
      if (date) onNavigateDate(date);
      onAction(View.APPOINTMENTS);
   };

   const isAttendant = userRole === 'attendant';
   const isClient = userRole === 'client';

   const kpiData = useMemo(() => {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const oneDayAgo = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const formatDateFilter = (date: Date) => date.toISOString().split('T')[0];
      const todayFilter = formatDateFilter(now);
      const yesterdayFilter = formatDateFilter(oneDayAgo);

      // 1. Weekly Revenue
      const currentWeekIncome = transactions
         .filter(t => t.type === 'income' && new Date(t.date) >= oneWeekAgo)
         .reduce((sum, t) => sum + t.amount, 0);

      const previousWeekIncome = transactions
         .filter(t => t.type === 'income' && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo)
         .reduce((sum, t) => sum + t.amount, 0);

      const revenueTrendVal = previousWeekIncome > 0
         ? Math.round(((currentWeekIncome - previousWeekIncome) / previousWeekIncome) * 100)
         : (currentWeekIncome > 0 ? 100 : 0);
      const revenueTrend = `${revenueTrendVal >= 0 ? '+' : ''}${revenueTrendVal}%`;

      // 2. New Clients (First appointment in last 30 days vs previous 30 days)
      const clientFirstVisit: Record<string, string> = {};
      appointments.forEach(a => {
         if (!clientFirstVisit[a.clientName] || a.date < clientFirstVisit[a.clientName]) {
            clientFirstVisit[a.clientName] = a.date;
         }
      });

      const currentNewClients = Object.values(clientFirstVisit).filter(date => new Date(date) >= thirtyDaysAgo).length;
      const previousNewClients = Object.values(clientFirstVisit).filter(date => {
         const d = new Date(date);
         return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      }).length;

      const newClientsTrendVal = previousNewClients > 0
         ? Math.round(((currentNewClients - previousNewClients) / previousNewClients) * 100)
         : (currentNewClients > 0 ? 100 : 0);
      const newClientsTrend = `${newClientsTrendVal >= 0 ? '+' : ''}${newClientsTrendVal}%`;

      // 3. Today's Appointments Trend (Today vs Yesterday)
      const currentTodayAppts = appointments.filter(a => a.date === todayFilter && a.status !== 'cancelled').length;
      const yesterdayApptsCount = appointments.filter(a => a.date === yesterdayFilter && a.status !== 'cancelled').length;

      const apptsTrendVal = yesterdayApptsCount > 0
         ? Math.round(((currentTodayAppts - yesterdayApptsCount) / yesterdayApptsCount) * 100)
         : (currentTodayAppts > 0 ? 100 : 0);
      const apptsTrend = `${apptsTrendVal >= 0 ? '+' : ''}${apptsTrendVal}%`;

      // 4. Retention Score (Clients with > 1 appointment / Total Clients)
      const clientApptCounts: Record<string, number> = {};
      appointments.forEach(a => {
         if (a.status === 'completed' || a.status === 'confirmed') {
            clientApptCounts[a.clientName] = (clientApptCounts[a.clientName] || 0) + 1;
         }
      });

      const returningClientsCount = Object.values(clientApptCounts).filter(count => count > 1).length;
      const totalActiveClients = Object.keys(clientApptCounts).length;
      const retentionRate = totalActiveClients > 0 ? Math.round((returningClientsCount / totalActiveClients) * 100) : 0;

      return {
         weeklyRevenue: currentWeekIncome,
         revenueTrend,
         newClients: currentNewClients,
         newClientsTrend,
         todayApptsTrend: apptsTrend,
         retentionRate: retentionRate
      };
   }, [transactions, appointments]);

   // --- CLIENT SPECIFIC LOGIC ---
   const clientData = useMemo(() => {
      if (!isClient || !user) return null;
      return clients.find(c => c.name === user.name) || {
         name: user.name,
         loyaltyPoints: 150,
         phone: '',
         totalSpent: 450,
         lastVisit: TODAY,
         tags: []
      };
   }, [isClient, user, clients]);

   const clientAppointments = useMemo(() => {
      if (!isClient || !user) return [];
      return appointments
         .filter(a => a.clientName === user.name && a.status !== 'cancelled')
         .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
   }, [isClient, user, appointments]);

   if (isClient) {
      const loyalty = settings?.loyalty || { enabled: true, redemptionCost: 500, rewardName: 'Serviço Grátis' };
      const points = clientData?.loyaltyPoints || 0;
      const progress = Math.min(100, (points / loyalty.redemptionCost) * 100);

      return (
         <div className="max-w-4xl mx-auto space-y-10 fade-in py-10 px-6">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="space-y-1">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Olá, {user?.name?.split(' ')[0] || 'Visitante'}! 🌸</h2>
                  <p className="text-gray-500 font-medium">Que bom ter você de volta no {settings?.name || 'Studio'}.</p>
               </div>
               <div className="w-16 h-16 rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white border border-gray-100">
                  <img src={user?.avatar} className="w-full h-full object-cover" />
               </div>
            </div>

            {/* Client Stats Grid */}
            <div className={`grid grid-cols-1 ${loyalty.enabled ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8`}>
               {/* Loyalty Card - Only visible if enabled */}
               {loyalty.enabled && (
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl shadow-purple-50 relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
                     <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                              <Star size={24} fill="currentColor" />
                           </div>
                           <div>
                              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block">Programa Fidelidade</span>
                              <h3 className="text-lg font-bold text-gray-900">Seus Pontos Bella</h3>
                           </div>
                        </div>

                        <div className="flex items-end gap-2 mb-4">
                           <span className="text-5xl font-black text-gray-900">{points}</span>
                           <span className="text-sm font-bold text-gray-400 mb-1">pts</span>
                        </div>

                        <div className="space-y-2">
                           <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <span>Progresso do Prêmio</span>
                              <span>{progress.toFixed(0)}%</span>
                           </div>
                           <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                           </div>
                           <p className="text-[11px] text-gray-400 font-medium">
                              {points >= loyalty.redemptionCost
                                 ? `🎉 Você já pode resgatar seu prêmio: ${loyalty.rewardName}!`
                                 : `Faltam ${loyalty.redemptionCost - points} pontos para ganhar ${loyalty.rewardName}.`}
                           </p>
                        </div>
                     </div>
                  </div>
               )}

               {/* Next Appointment Card */}
               <div className={`bg-[#F9FAFB] p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between ${!loyalty.enabled ? 'max-w-2xl mx-auto w-full' : ''}`}>
                  <div>
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-[#40E0D0]/10 text-[#40E0D0] rounded-2xl flex items-center justify-center">
                           <Calendar size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Próximos Horários</h3>
                     </div>

                     <div className="space-y-4">
                        {clientAppointments.length > 0 ? (
                           clientAppointments.slice(0, 3).map(apt => (
                              <div key={apt.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-50 rounded-xl text-[#40E0D0]"><Scissors size={18} /></div>
                                    <div>
                                       <p className="font-bold text-gray-900 text-sm">
                                          {(services.find(s => s.id === apt.serviceId)?.name || apt.service || 'Serviço').trim() || 'Serviço'}
                                       </p>
                                       <div className="flex items-center gap-2">
                                          <p className="text-[10px] text-gray-400 font-medium uppercase">{new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {apt.time}</p>
                                          {staff.find(p => p.id === apt.professionalId) && (
                                             <span className="text-[9px] font-black text-[#FF69B4] uppercase tracking-tighter bg-pink-50 px-1.5 py-0.5 rounded-md border border-pink-100/30 line-clamp-1">
                                                {staff.find(p => p.id === apt.professionalId)?.name.split(' ')[0]}
                                             </span>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                                 <div className="w-2 h-2 rounded-full bg-[#40E0D0] animate-pulse"></div>
                              </div>
                           ))
                        ) : (
                           <div className="py-4 text-center text-gray-400 italic text-sm">
                              Nenhum agendamento futuro encontrado.
                           </div>
                        )}
                     </div>
                  </div>

                  <button
                     onClick={() => setIsMyAppointmentsOpen(true)}
                     className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-100"
                  >
                     Ver Todos <ArrowRight size={14} />
                  </button>
               </div>
            </div>

            {/* Big CTA */}
            <button
               onClick={() => onAction(View.CLIENT_BOOKING)}
               className="w-full bg-[#FF69B4] text-white p-10 rounded-[3.5rem] shadow-2xl shadow-pink-100 flex flex-col md:flex-row items-center justify-between gap-8 group hover:scale-[1.02] transition-all relative overflow-hidden"
            >
               <div className="absolute top-0 left-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="text-center md:text-left relative z-10">
                  <h3 className="text-3xl font-black mb-2 tracking-tight">Que tal brilhar hoje? ✨</h3>
                  <p className="text-pink-100 font-medium text-lg">Agende seu próximo serviço em poucos segundos.</p>
               </div>
               <div className="bg-white text-[#FF69B4] px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl group-hover:shadow-pink-400 group-hover:translate-x-2 transition-all relative z-10">
                  Agendar Agora
               </div>
            </button>

            {/* Modal: Meus Agendamentos */}
            {isMyAppointmentsOpen && (
               <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                  <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in duration-300 border border-white/20">

                     <div className="p-6 sm:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                           <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                              <Calendar size={20} className="sm:size-6" />
                           </div>
                           <div className="min-w-0">
                              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">Meus Agendamentos 🌸</h3>
                              <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-widest truncate">Confira seus horários marcados</p>
                           </div>
                        </div>
                        <button
                           onClick={() => setIsMyAppointmentsOpen(false)}
                           className="p-2 sm:p-3 bg-white border border-gray-100 text-gray-400 hover:text-rose-500 rounded-2xl transition-all shadow-sm active:scale-90 shrink-0 flex items-center justify-center"
                        >
                           <X size={20} />
                        </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                        {clientAppointments.length > 0 ? (
                           clientAppointments.map(apt => {
                              const professional = staff.find(p => p.id === apt.professionalId);
                              return (
                                 <div key={apt.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-[#FF69B4]/30 transition-all group relative overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                       <div className="flex items-center gap-5">
                                          <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-[#FF69B4] shadow-inner group-hover:rotate-3 transition-transform">
                                             <Scissors size={28} />
                                          </div>
                                          <div className="space-y-1">
                                             <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${apt.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                   {apt.status === 'confirmed' ? 'Confirmado' : 'Aguardando'}
                                                </span>
                                             </div>
                                             <h4 className="font-black text-gray-900 text-xl tracking-tight">
                                                {services.find(s => s.id === apt.serviceId)?.name || apt.service || 'Serviço'}
                                             </h4>
                                             <p className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                                <Clock size={14} className="text-gray-300" />
                                                {new Date(apt.date + 'T12:00:00').toLocaleDateString('pt-BR')} às {apt.time}
                                             </p>
                                          </div>
                                       </div>

                                       <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                                             <img
                                                src={professional?.avatar || 'https://ui-avatars.com/api/?name=Staff&background=eee'}
                                                className="w-full h-full object-cover"
                                                alt={professional?.name}
                                             />
                                          </div>
                                          <div>
                                             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block">Profissional</span>
                                             <span className="text-sm font-bold text-gray-700 leading-none">{professional?.name.split(' ')[0] || 'Studio'}</span>
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })
                        ) : (
                           <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                                 <Calendar size={48} />
                              </div>
                              <div className="space-y-2">
                                 <h4 className="text-xl font-bold text-gray-900">Nenhum agendamento ativo</h4>
                                 <p className="text-gray-400 max-w-xs mx-auto">Você ainda não possui horários marcados conosco. Que tal agendar agora?</p>
                              </div>
                              <button
                                 onClick={() => { setIsMyAppointmentsOpen(false); onAction(View.CLIENT_BOOKING); }}
                                 className="px-8 py-3 bg-[#FF69B4] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-pink-100 hover:scale-105 transition-all"
                              >
                                 Agendar Primeiro Serviço
                              </button>
                           </div>
                        )}
                     </div>

                     <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex justify-center">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">
                           BellaAI Systems &copy; 2025
                        </p>
                     </div>
                  </div>
               </div>
            )}

            <div className="pt-10 flex justify-center pb-8">
               <button
                  onClick={onLogout}
                  className="text-gray-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:text-[#FF69B4] hover:bg-pink-50 transition-all bg-gray-50/50 px-6 py-2.5 rounded-full border border-gray-100 shadow-sm active:scale-95"
               >
                  Sair da minha conta <LogOut size={14} />
               </button>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-8 fade-in">
         {/* Stats Grid */}
         <div className={`grid grid-cols-1 md:grid-cols-2 ${isAttendant ? 'lg:grid-cols-2' : 'lg:grid-cols-4'} gap-6`}>
            {!isAttendant && (
               <StatCard
                  title={t.dashboard.stats.revenue}
                  value={`R$ ${kpiData.weeklyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  change={kpiData.revenueTrend}
                  bgColor="bg-emerald-50 dark:bg-emerald-500/10"
                  icon={<TrendingUp size={20} className="text-emerald-500" />}
                  onClick={() => onAction(View.FINANCIAL)}
               />
            )}

            <StatCard
               title={t.dashboard.stats.newClients}
               value={kpiData.newClients.toString()}
               change={kpiData.newClientsTrend}
               bgColor="bg-teal-50 dark:bg-teal-500/10"
               icon={<Users size={20} className="text-teal-500" />}
               onClick={() => onAction(View.CRM, 'Novo')}
            />

            <StatCard
               title={t.dashboard.stats.todayAppts}
               value={todayAppts.length.toString()}
               change={kpiData.todayApptsTrend}
               bgColor="bg-pink-50 dark:bg-pink-500/10"
               icon={<Calendar size={20} className="text-pink-500" />}
               onClick={() => handleGoToSchedule(TODAY)}
            />

            {!isAttendant && (
               <StatCard
                  title={t.dashboard.stats.retention}
                  value={`${kpiData.retentionRate}%`}
                  change={""}
                  bgColor="bg-purple-50 dark:bg-purple-500/10"
                  icon={<Sparkles size={20} className="text-purple-500" />}
                  onClick={() => onAction(View.MARKETING)}
               />
            )}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-[#F5F5F5] p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col transition-colors">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">{t.dashboard.chartTitle}</h3>
                  <div className="relative group">
                     <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as RangeType)}
                        className="appearance-none bg-white border border-pink-200 rounded-xl px-4 py-2 pr-10 text-sm font-semibold shadow-sm outline-none cursor-pointer focus:ring-2 focus:ring-[#FF69B4]/20 transition-all text-gray-700 hover:border-pink-300"
                     >
                        <option value="weekly">{t.dashboard.chartRange.weekly}</option>
                        <option value="monthly">{t.dashboard.chartRange.monthly}</option>
                        <option value="quarterly">{t.dashboard.chartRange.quarterly}</option>
                        <option value="yearly">{t.dashboard.chartRange.yearly}</option>
                     </select>
                     <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-[#FF69B4] transition-colors" size={16} />
                  </div>
               </div>
               <div className="h-[300px] w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.4} />
                              <stop offset="95%" stopColor={COLORS.pink} stopOpacity={0} />
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                        <XAxis
                           dataKey="name"
                           axisLine={false}
                           tickLine={false}
                           tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                           dy={10}
                           interval={timeRange === 'yearly' ? 0 : 'preserveStartEnd'}
                        />
                        <YAxis axisLine={false} tickLine={false} hide />
                        <Tooltip
                           contentStyle={{
                              borderRadius: '20px',
                              border: 'none',
                              backgroundColor: '#ffffff',
                              color: '#111827',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                              padding: '12px 16px'
                           }}
                           itemStyle={{ color: COLORS.pink, fontWeight: 'bold' }}
                           labelStyle={{ fontWeight: 'bold', marginBottom: '4px', color: '#111827' }}
                           formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']}
                        />
                        <Area
                           type="monotone"
                           dataKey="sales"
                           stroke={COLORS.pink}
                           strokeWidth={4}
                           fillOpacity={1}
                           fill="url(#colorSales)"
                           animationDuration={1000}
                        />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Schedule Panel with Tabs (Today/Tomorrow) */}
            <div className="bg-white border-2 border-dashed border-gray-100 p-6 rounded-3xl flex flex-col h-full transition-all duration-300">
               <div className="flex justify-between items-start mb-6">
                  <div>
                     <div className="flex gap-1 bg-gray-50 p-1 rounded-xl mb-3 w-fit">
                        <button
                           onClick={() => setScheduleTab('today')}
                           className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'today' ? 'bg-white text-[#FF69B4] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                           Hoje
                        </button>
                        <button
                           onClick={() => setScheduleTab('tomorrow')}
                           className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'tomorrow' ? 'bg-white text-[#40E0D0] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                           Amanhã
                        </button>
                     </div>
                     <h3 className="text-xl font-bold animate-in fade-in">{scheduleTab === 'today' ? 'Agenda de Hoje' : 'Agenda de Amanhã'}</h3>
                     <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 animate-in fade-in">{currentDateDisplay}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm transition-colors ${scheduleTab === 'today' ? 'bg-pink-50 text-[#FF69B4]' : 'bg-[#40E0D0]/10 text-[#40E0D0]'}`}>
                     {currentList.length} clientes
                  </span>
               </div>

               <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide mb-4 max-h-[300px]">
                  {currentList.length > 0 ? currentList.map(apt => {
                     const professional = staff.find(p => p.id === apt.professionalId);
                     return (
                        <div
                           key={apt.id}
                           onClick={() => handleGoToSchedule(currentDate)}
                           className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all group cursor-pointer hover:scale-[1.02] ${scheduleTab === 'today' ? 'bg-pink-50/40 border-pink-100 hover:bg-white hover:shadow-xl' : 'bg-[#F9FAFB] border-gray-100 hover:bg-white hover:shadow-xl'}`}
                        >
                           <div className={`p-3 rounded-2xl font-black text-sm shadow-sm border text-center min-w-[60px] transition-colors ${scheduleTab === 'today' ? 'bg-[#FF69B4] text-white border-[#FF69B4]' : 'bg-white text-[#FF69B4] border-gray-100 group-hover:bg-[#FF69B4] group-hover:text-white'}`}>
                              {apt.time}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-base text-gray-900 truncate group-hover:text-[#FF69B4] transition-colors">{apt.clientName}</h4>
                              <div className="flex items-center gap-2 flex-wrap mt-1">
                                 <p className="text-sm text-gray-400 font-medium truncate">
                                    {(services.find(s => s.id === apt.serviceId)?.name || apt.service || 'Serviço').trim() || 'Serviço'}
                                 </p>
                                 {professional && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-50 rounded-full border border-pink-100/50">
                                       <User size={12} className="text-[#FF69B4]" />
                                       <span className="text-[10px] font-black text-[#FF69B4] uppercase tracking-wider">
                                          {professional.name.split(' ')[0]}
                                       </span>
                                    </div>
                                 )}
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="font-black text-sm text-gray-900 block">R$ {apt.price}</span>
                           </div>
                        </div>
                     );
                  }) : (
                     <div className="h-full flex flex-col items-center justify-center text-center text-gray-300 italic p-4">
                        <Calendar size={40} className="mb-3 opacity-20" />
                        <p>Nenhum agendamento para {scheduleTab === 'today' ? 'hoje' : 'amanhã'}.</p>
                     </div>
                  )}
               </div>

               <button
                  onClick={() => handleGoToSchedule(currentDate)}
                  className={`w-full py-3 text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 mt-auto ${scheduleTab === 'today' ? 'bg-[#FF69B4] shadow-pink-100' : 'bg-[#40E0D0] shadow-teal-50'}`}
               >
                  Ver Agenda Completa <ArrowRight size={16} />
               </button>
            </div>
         </div>
      </div>
   );
};


const StatCard: React.FC<{ title: string; value: string; change: string; bgColor: string; icon: React.ReactNode; onClick: () => void }> = ({ title, value, change, bgColor, icon, onClick }) => (
   <div
      onClick={onClick}
      className="bg-white p-5 md:p-6 rounded-[2rem] md:rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
   >
      <div className="flex items-center gap-3 mb-3 md:mb-4">
         <div className={`p-2.5 md:p-3 rounded-xl shadow-sm transition-transform group-hover:scale-110 ${bgColor}`}>
            {icon}
         </div>
         <span className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest leading-none truncate">{title}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
         <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight truncate">{value}</h2>
         {change && (
            <span className={`text-xs md:text-sm font-black whitespace-nowrap ${change.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
               {change}
            </span>
         )}
      </div>
   </div>
);

export default Dashboard;