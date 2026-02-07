
import React, { useState, useMemo } from 'react';
import { COLORS } from '../constants';
import {
   ArrowUpRight,
   ArrowDownRight,
   FileText,
   CheckCircle,
   Plus,
   Search,
   CreditCard,
   Smartphone,
   Banknote,
   X,
   ChevronRight,
   Clock,
   Printer,
   Share2,
   QrCode,
   Loader2,
   Sparkles,
   Filter,
   Calendar,
   History,
   Download,
   Receipt,
   Wallet,
   PieChart,
   BarChart2,
   TrendingUp,
   Target,
   Activity,
   DollarSign,
   ChevronDown,
   User,
   Hash,
   Building2,
   Award,
   Truck,
   Mail,
   Phone,
   ExternalLink,
   Trash2,
   Edit3
} from 'lucide-react';
import {
   ResponsiveContainer,
   PieChart as RePieChart,
   Pie,
   Cell,
   Tooltip,
   AreaChart,
   Area,
   XAxis,
   YAxis,
   CartesianGrid,
   BarChart,
   Bar
} from 'recharts';
import { Appointment, UserProfile, Transaction, Client, Service, InventoryItem, Supplier, Category, ConfirmDialogOptions } from '../types';
import { Modal, Button, StatCard, CurrencyInput } from './ui';

interface FinancialProps {
   transactions: Transaction[];
   appointments: Appointment[];
   onProcessPayment: (data: { appointmentId?: string, clientName: string, serviceName: string, amount: number, method: string }) => void;
   onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
   onDeleteTransaction: (id: string) => void;
   clients: Client[];
   services: Service[];
   inventory: InventoryItem[];
   suppliers: Supplier[];
   onAddSupplier: (s: Omit<Supplier, 'id'>) => void;
   onUpdateSupplier: (s: Supplier) => void;
   onDeleteSupplier: (id: string) => void;
   user: UserProfile;
   onShowToast: (msg: string) => void;
   categories: Category[];
   onShowConfirm: (options: ConfirmDialogOptions) => void;
}

const COLORS_CHART = [COLORS.pink, COLORS.turquoise, COLORS.purple, COLORS.yellow, '#FF9F43'];


const FinancialView: React.FC<FinancialProps> = ({
   transactions,
   appointments,
   onProcessPayment,
   onAddTransaction,
   onDeleteTransaction,
   clients,
   services,
   inventory,
   suppliers,
   onAddSupplier,
   onUpdateSupplier,
   onDeleteSupplier,
   user,
   onShowToast,
   categories,
   onShowConfirm
}) => {
   const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'transactions' | 'suppliers'>('overview');

   const [isGenerating, setIsGenerating] = useState(false);
   const [isReportModalOpen, setIsReportModalOpen] = useState(false);
   const [isPOSOpen, setIsPOSOpen] = useState(false);
   const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<Transaction | null>(null);

   const [searchTerm, setSearchTerm] = useState('');
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   const [filters, setFilters] = useState({
      type: 'all' as 'all' | 'income' | 'expense',
      method: 'all',
      startDate: '',
      endDate: ''
   });

   const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
   const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'Card' | 'Cash' | null>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [checkoutStep, setCheckoutStep] = useState<'select' | 'payment' | 'success'>('select');
   const [saleType, setSaleType] = useState<'appointment' | 'direct'>('appointment');
   const [directSaleData, setDirectSaleData] = useState({ clientName: '', serviceName: '', amount: 0 });
   const [clientSearch, setClientSearch] = useState('');
   const [itemSearch, setItemSearch] = useState('');
   const [showClientResults, setShowClientResults] = useState(false);
   const [showItemResults, setShowItemResults] = useState(false);

   const filteredClients = useMemo(() => {
      if (!clientSearch) return [];
      return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5);
   }, [clients, clientSearch]);

   const filteredItems = useMemo(() => {
      if (!itemSearch) return [];
      const search = itemSearch.toLowerCase();
      const svcs = services.filter(s => s.name.toLowerCase().includes(search)).map(s => ({ name: s.name, price: s.price, type: 'Serviço' }));
      const prods = inventory.filter(i => i.type === 'resale' && i.name.toLowerCase().includes(search)).map(i => ({ name: i.name, price: i.salePrice || 0, type: 'Produto' }));
      return [...svcs, ...prods].slice(0, 5);
   }, [services, inventory, itemSearch]);

   const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
   const [expenseData, setExpenseData] = useState({
      title: '',
      client: '', // Used as Category or Supplier
      amount: 0,
      method: 'Dinheiro',
      date: new Date().toISOString().split('T')[0]
   });
   const [supplierSearch, setSupplierSearch] = useState('');
   const [showSupplierResults, setShowSupplierResults] = useState(false);

   const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
   const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
   const [supplierForm, setSupplierForm] = useState<Omit<Supplier, 'id'>>({
      name: '',
      contactName: '',
      phone: '',
      email: '',
      category: 'Geral',
      notes: ''
   });

   const filteredSuppliers = useMemo(() => {
      if (!supplierSearch) return [];
      return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).slice(0, 5);
   }, [suppliers, supplierSearch]);

   const baseTransactions = useMemo(() => {
      if (user.role === 'attendant') {
         return transactions.filter(t => t.professionalId === user.id);
      }
      return transactions;
   }, [transactions, user]);

   const processedTransactions = useMemo(() => {
      return baseTransactions.filter(t => {
         const searchLower = searchTerm.toLowerCase();
         const matchesSearch =
            t.title.toLowerCase().includes(searchLower) ||
            t.client.toLowerCase().includes(searchLower) ||
            t.id.toLowerCase().includes(searchLower);

         const matchesType = filters.type === 'all' || t.type === filters.type;
         const matchesMethod = filters.method === 'all' || t.method === filters.method;

         let matchesDate = true;
         if (filters.startDate) matchesDate = matchesDate && new Date(t.date) >= new Date(filters.startDate);
         if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            matchesDate = matchesDate && new Date(t.date) <= end;
         }

         return matchesSearch && matchesType && matchesMethod && matchesDate;
      });
   }, [baseTransactions, searchTerm, filters]);

   const totalIncome = useMemo(() => baseTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0), [baseTransactions]);
   const totalExpense = useMemo(() => baseTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0), [baseTransactions]);
   const netResult = totalIncome - totalExpense;
   const profitMarginNum = totalIncome > 0 ? (netResult / totalIncome) * 100 : 0;
   const profitMargin = profitMarginNum.toFixed(1);
   const averageTicket = baseTransactions.filter(t => t.type === 'income').length > 0 ? totalIncome / baseTransactions.filter(t => t.type === 'income').length : 0;

   const paymentMethodData = useMemo(() => {
      const data: Record<string, number> = {};
      baseTransactions.filter(t => t.type === 'income').forEach(t => {
         data[t.method] = (data[t.method] || 0) + t.amount;
      });
      return Object.keys(data)
         .map(key => ({ name: key, value: data[key] }))
         .sort((a, b) => b.value - a.value);
   }, [baseTransactions]);

   const categoryData = useMemo(() => {
      const data: Record<string, number> = {};

      const incomeTransactions = baseTransactions.filter(t => t.type === 'income');

      incomeTransactions.forEach(t => {
         let catLabel = 'Outros';

         // 1. Try to find the service by name (exact or partial)
         const service = services.find(s =>
            s.name.toLowerCase() === t.title.toLowerCase() ||
            t.title.toLowerCase().includes(s.name.toLowerCase())
         );

         if (service && service.category) {
            const category = categories.find(c => c.id === service.category);
            if (category) {
               catLabel = category.label;
            }
         } else {
            // 2. Fallback to basic string matching if service not found
            if (t.title.toLowerCase().includes('mechas') || t.title.toLowerCase().includes('corte') || t.title.toLowerCase().includes('escova')) catLabel = 'Cabelo';
            else if (t.title.toLowerCase().includes('manicure') || t.title.toLowerCase().includes('unhas') || t.title.toLowerCase().includes('pé') || t.title.toLowerCase().includes('mão')) catLabel = 'Unhas';
            else if (t.title.toLowerCase().includes('pele') || t.title.toLowerCase().includes('estética') || t.title.toLowerCase().includes('limpeza')) catLabel = 'Estética';
         }

         data[catLabel] = (data[catLabel] || 0) + t.amount;
      });

      // Ensure we have at least some variety if categories exist
      if (Object.keys(data).length === 0 && categories.length > 0) {
         categories.slice(0, 3).forEach(c => { data[c.label] = 0; });
      }

      return Object.keys(data)
         .map(key => ({ name: key, value: data[key] }))
         .sort((a, b) => b.value - a.value);
   }, [baseTransactions, services, categories]);

   const cashFlowData = useMemo(() => {
      const today = new Date();
      const data: { name: string; income: number; expense: number }[] = [];

      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
         const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
         const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
         const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });

         const monthlyTransactions = baseTransactions.filter(t => t.date.startsWith(monthKey));
         const income = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
         const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

         data.push({ name: monthName, income, expense });
      }
      return data;
   }, [baseTransactions]);

   const handleOpenReport = () => {
      setIsGenerating(true);
      setTimeout(() => {
         setIsGenerating(false);
         setIsReportModalOpen(true);
      }, 1500);
   };

   const handleExportCSV = () => {
      const headers = ['ID,Descrição,Cliente,Data,Método,Tipo,Valor'];
      const rows = processedTransactions.map(t => {
         const date = new Date(t.date).toLocaleDateString('pt-BR');
         const amount = t.amount.toFixed(2).replace('.', ',');
         const type = t.type === 'income' ? 'Receita' : 'Despesa';
         return `${t.id},"${t.title}","${t.client}",${date},${t.method},${type},"${amount}"`;
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `extrato_bellaai_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleProcessCheckout = () => {
      if (saleType === 'appointment' && (!selectedApt || !paymentMethod)) return;
      if (saleType === 'direct' && (!directSaleData.clientName || !directSaleData.serviceName || directSaleData.amount <= 0 || !paymentMethod)) return;

      setIsProcessing(true);
      setTimeout(() => {
         onProcessPayment({
            appointmentId: saleType === 'appointment' ? selectedApt?.id : undefined,
            clientName: saleType === 'appointment' ? selectedApt!.clientName : directSaleData.clientName,
            serviceName: saleType === 'appointment' ? selectedApt!.service : directSaleData.serviceName,
            amount: saleType === 'appointment' ? selectedApt!.price : directSaleData.amount,
            method: paymentMethod!
         });
         setIsProcessing(false);
         setCheckoutStep('success');
      }, 1500);
   };

   const clearFilters = () => {
      setFilters({ type: 'all', method: 'all', startDate: '', endDate: '' });
      setSearchTerm('');
      setIsFilterOpen(false);
   };

   const handleSaveExpense = () => {
      if (!expenseData.title || expenseData.amount <= 0) return;
      onAddTransaction({
         type: 'expense',
         title: expenseData.title,
         client: expenseData.client || 'Geral',
         amount: expenseData.amount,
         method: expenseData.method,
         date: new Date(expenseData.date).toISOString()
      });
      setIsExpenseModalOpen(false);
      setExpenseData({
         title: '',
         client: '',
         amount: 0,
         method: 'Dinheiro',
         date: new Date().toISOString().split('T')[0]
      });
   };

   const handleSaveSupplier = () => {
      if (!supplierForm.name) return;
      if (editingSupplier) {
         onUpdateSupplier({ ...supplierForm, id: editingSupplier.id });
      } else {
         onAddSupplier(supplierForm);
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', contactName: '', phone: '', email: '', category: 'Geral', notes: '' });
   };

   const openEditSupplier = (s: Supplier) => {
      setEditingSupplier(s);
      setSupplierForm({ ...s });
      setIsSupplierModalOpen(true);
   };

   return (
      <div className="space-y-8 fade-in pb-10">
         <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
               <h2 className="text-2xl font-bold">Inteligência Financeira 💰</h2>
               <p className="text-gray-500 text-sm">Análise de performance e gestão de fluxo de caixa em tempo real.</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full xl:w-auto">
               <button
                  onClick={handleOpenReport}
                  disabled={isGenerating}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
               >
                  {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
                  {isGenerating ? 'Consolidando...' : 'Relatório'}
               </button>
               <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 px-6 py-3 rounded-2xl font-bold hover:bg-rose-100 transition-all shadow-sm active:scale-95"
               >
                  <ArrowDownRight size={20} /> Nova Despesa
               </button>
               <button
                  onClick={() => setIsPOSOpen(true)}
                  className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-[#FF69B4] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all"
               >
                  <Plus size={20} /> Novo Recebimento
               </button>
            </div>
         </div>

         <div className="flex p-1.5 bg-gray-100 rounded-2xl w-full md:w-fit overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'bg-white text-[#FF69B4] shadow-md' : 'text-gray-500 hover:text-gray-800'}`}><Activity size={16} /> Visão Geral</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'analytics' ? 'bg-white text-[#40E0D0] shadow-md' : 'text-gray-500 hover:text-gray-800'}`}><BarChart2 size={16} /> Analytics</button>
            <button onClick={() => setActiveTab('transactions')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'transactions' ? 'bg-white text-purple-500 shadow-md' : 'text-gray-500 hover:text-gray-800'}`}><History size={16} /> Extrato</button>
            <button onClick={() => setActiveTab('suppliers')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'suppliers' ? 'bg-white text-orange-500 shadow-md' : 'text-gray-500 hover:text-gray-800'}`}><Truck size={16} /> Fornecedores</button>
         </div>

         <div className="min-h-[500px]">
            {activeTab === 'overview' && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                     <KPICard title="Faturamento Mensal" value={totalIncome} trend={12} icon={<Wallet size={20} className="text-emerald-500" />} color="emerald" prefix="R$" />
                     <KPICard title="Despesas" value={totalExpense} trend={-5} icon={<ArrowDownRight size={20} className="text-rose-500" />} color="rose" prefix="R$" inverseTrend />
                     <KPICard title="Lucro Líquido" value={netResult} trend={8} icon={<Target size={20} className="text-[#FF69B4]" />} color="pink" prefix="R$" />
                     <KPICard title="Ticket Médio" value={averageTicket} trend={2.5} icon={<Receipt size={20} className="text-[#40E0D0]" />} color="teal" prefix="R$" />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                     <div className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-xl font-bold text-gray-900">Fluxo de Caixa</h3>
                           <div className="flex items-center gap-2 text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-lg">
                              <div className="w-2 h-2 rounded-full bg-[#FF69B4]"></div> Entradas
                              <div className="w-2 h-2 rounded-full bg-rose-400 ml-2"></div> Saídas
                           </div>
                        </div>
                        <div className="h-[300px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={cashFlowData}>
                                 <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.pink} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS.pink} stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} /><stop offset="95%" stopColor="#FB7185" stopOpacity={0} /></linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
                                 <YAxis axisLine={false} tickLine={false} hide />
                                 <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: any, name: string) => {
                                       const label = name === 'income' ? 'Entradas' : 'Saídas';
                                       return [`R$ ${value.toLocaleString('pt-BR')}`, label];
                                    }}
                                 />
                                 <Area type="monotone" dataKey="income" stroke={COLORS.pink} strokeWidth={3} fill="url(#colorIncome)" />
                                 <Area type="monotone" dataKey="expense" stroke="#FB7185" strokeWidth={3} fill="url(#colorExpense)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Meios de Pagamento</h3>
                        <div className="h-[250px] relative">
                           <ResponsiveContainer width="100%" height="100%">
                              <RePieChart><Pie data={paymentMethodData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{paymentMethodData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />)}</Pie><Tooltip formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`} /></RePieChart>
                           </ResponsiveContainer>
                           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                              <span className="text-[10px] text-gray-400 font-bold uppercase">Total</span>
                              <span className="block text-lg font-black text-gray-800">R$ {totalIncome.toLocaleString('pt-BR', { notation: 'compact' })}</span>
                           </div>
                        </div>
                        <div className="space-y-2 mt-4">
                           {paymentMethodData.map((item, idx) => (
                              <div key={item.name} className="flex justify-between items-center text-xs">
                                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS_CHART[idx % COLORS_CHART.length] }}></div><span className="font-medium text-gray-600">{item.name}</span></div>
                                 <span className="font-bold text-gray-900">{totalIncome > 0 ? ((item.value / totalIncome) * 100).toFixed(0) : 0}%</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'analytics' && (
               <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl ${profitMarginNum >= 0 ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-200' : 'bg-gradient-to-r from-rose-500 to-orange-600 shadow-rose-200'}`}>
                     <div className="relative z-10 space-y-2">
                        <div className="flex items-center gap-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md"><Sparkles size={14} className="text-yellow-300" /><span className="text-[10px] font-black uppercase tracking-widest">BellaAI Insights</span></div>
                        <h3 className="text-2xl font-black">Performance: {profitMarginNum >= 0 ? 'Lucratividade em Alta 🚀' : 'Alerta de Margem ⚠️'}</h3>
                        <p className="text-indigo-50 max-w-xl">
                           {profitMarginNum >= 0
                              ? `Sua margem atual de ${profitMargin}% reflete uma gestão eficiente de insumos. Projeção de +15% no próximo ciclo.`
                              : `Sua margem está em ${profitMargin}%. É necessário revisar custos fixos e aumentar o faturamento médio para reverter o déficit.`}
                        </p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Receita por Categoria</h3>
                        <div className="h-[300px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                                 <XAxis type="number" hide />
                                 <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 700 }}
                                 />
                                 <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                                 />
                                 <Bar
                                    dataKey="value"
                                    radius={[0, 12, 12, 0]}
                                    barSize={32}
                                 >
                                    {categoryData.map((_, index) => (
                                       <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                                    ))}
                                 </Bar>
                              </BarChart>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Mix de Despesas</h3>
                        <div className="space-y-5">
                           {[{ name: 'Insumos', value: 40, color: 'bg-rose-400' }, { name: 'Comissões', value: 35, color: 'bg-orange-400' }, { name: 'Marketing', value: 15, color: 'bg-blue-400' }, { name: 'Geral', value: 10, color: 'bg-gray-400' }].map(item => (
                              <div key={item.name}>
                                 <div className="flex justify-between text-xs font-bold mb-1"><span>{item.name}</span><span>{item.value}%</span></div>
                                 <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }}></div></div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'transactions' && (
               <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                     <h3 className="font-bold text-xl flex items-center gap-2"><History size={20} className="text-gray-400" /> Histórico de Transações</h3>
                     <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                           <input type="text" placeholder="Buscar cliente ou serviço..." className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#FF69B4] outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <button onClick={() => setIsFilterOpen(true)} className={`p-2.5 rounded-xl transition-all ${isFilterOpen || filters.type !== 'all' ? 'bg-[#FF69B4] text-white shadow-lg shadow-pink-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}><Filter size={20} /></button>
                        <button onClick={handleExportCSV} className="p-2.5 bg-gray-50 text-gray-500 hover:bg-gray-100 rounded-xl transition-all"><Download size={20} /></button>
                     </div>
                  </div>

                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="border-b border-gray-100">
                              <th className="py-4 px-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">ID</th>
                              <th className="py-4 px-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">Descrição</th>
                              <th className="py-4 px-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">Data</th>
                              <th className="py-4 px-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">Método</th>
                              <th className="py-4 px-2 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Valor</th>
                              <th className="py-4 px-2 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Status</th>
                           </tr>
                        </thead>
                        <tbody>
                           {processedTransactions.length > 0 ? processedTransactions.map(t => (
                              <tr key={t.id} onClick={() => setSelectedDetailTransaction(t)} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group cursor-pointer">
                                 <td className="py-5 px-2 text-xs font-bold text-gray-400">#{t.id}</td>
                                 <td className="py-5 px-2">
                                    <span className="block font-bold text-sm text-gray-900 group-hover:text-[#FF69B4] transition-colors">{t.title}</span>
                                    <span className="text-xs text-gray-400">{t.client}</span>
                                 </td>
                                 <td className="py-5 px-2 text-xs font-medium text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                 <td className="py-5 px-2"><span className="px-2 py-1 bg-gray-100 rounded-lg text-[9px] font-black uppercase tracking-wider text-gray-500">{t.method}</span></td>
                                 <td className={`py-5 px-2 text-sm font-black text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                 <td className="py-5 px-2 text-center"><div className="w-5 h-5 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto"><CheckCircle size={12} /></div></td>
                              </tr>
                           )) : (
                              <tr><td colSpan={6} className="py-20 text-center text-gray-300 italic">Nenhuma transação encontrada para estes critérios.</td></tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}

            {activeTab === 'suppliers' && (
               <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                     <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <div>
                           <h3 className="font-bold text-xl flex items-center gap-2"><Truck size={20} className="text-orange-500" /> Gestão de Fornecedores</h3>
                           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Total de {suppliers.length} fornecedores parceiros</p>
                        </div>
                        <button
                           onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', contactName: '', phone: '', email: '', category: 'Geral', notes: '' }); setIsSupplierModalOpen(true); }}
                           className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-orange-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                           <Plus size={18} /> Novo Fornecedor
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {suppliers.length > 0 ? suppliers.map(s => (
                           <div key={s.id} className="p-6 rounded-[2rem] bg-gray-50 border border-gray-100 hover:border-orange-200 transition-all group relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                 <button onClick={() => openEditSupplier(s)} className="p-2 bg-white rounded-xl shadow-sm hover:text-orange-500"><Edit3 size={16} /></button>
                                 <button
                                    onClick={() => {
                                       onShowConfirm({
                                          title: 'Remover Fornecedor?',
                                          message: `Tem certeza que deseja remover ${s.name}?`,
                                          variant: 'danger',
                                          onConfirm: () => {
                                             onDeleteSupplier(s.id);
                                             onShowToast("Fornecedor removido.");
                                          }
                                       });
                                    }}
                                    className="p-2 bg-white rounded-xl shadow-sm hover:text-rose-500"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>

                              <div className="space-y-4">
                                 <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm font-black text-xl">
                                       {s.name.charAt(0)}
                                    </div>
                                    <div>
                                       <h4 className="font-black text-gray-900 leading-tight">{s.name}</h4>
                                       <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{s.category}</span>
                                    </div>
                                 </div>

                                 <div className="space-y-2 pt-2 border-t border-gray-100">
                                    {s.contactName && <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><User size={12} /> {s.contactName}</div>}
                                    {s.phone && <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Phone size={12} /> {s.phone}</div>}
                                    {s.email && <div className="flex items-center gap-2 text-xs text-gray-500 font-bold"><Mail size={12} /> {s.email}</div>}
                                 </div>

                                 {s.notes && (
                                    <p className="text-[10px] text-gray-400 italic line-clamp-2 bg-white/50 p-2 rounded-xl border border-gray-50">"{s.notes}"</p>
                                 )}
                              </div>
                           </div>
                        )) : (
                           <div className="col-span-full py-20 text-center space-y-4 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                              <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-sm text-gray-300"><Truck size={40} /></div>
                              <p className="text-gray-400 font-bold">Nenhum fornecedor cadastrado ainda.</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Modal: Relatório Financeiro Detalhado */}
         {isReportModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
               <div className="bg-white w-full max-w-4xl rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in duration-300 printable-area">

                  <div className="p-4 sm:p-8 border-b border-gray-100 flex justify-between items-center shrink-0 print:hidden gap-4">
                     <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-900 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                           <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="min-w-0">
                           <h3 className="text-base sm:text-2xl font-black text-gray-900 tracking-tight truncate">Fechamento Financeiro ✨</h3>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">Snapshot do Studio</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => window.print()} className="p-2.5 sm:p-3 bg-gray-900 hover:bg-black text-white rounded-xl sm:rounded-2xl transition-all shadow-xl flex items-center gap-2 font-bold text-xs">
                           <Printer size={18} /> <span className="hidden sm:inline">Relatório</span>
                        </button>
                        <button onClick={() => setIsReportModalOpen(false)} className="p-2.5 sm:p-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl sm:rounded-2xl transition-all shrink-0 flex items-center justify-center">
                           <X size={20} />
                        </button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 sm:p-10 space-y-8 sm:space-y-12 scrollbar-hide">
                     {/* Branding p/ Impressão */}
                     <div className="hidden print:flex flex-col gap-2 mb-10 border-b-2 border-gray-900 pb-8">
                        <div className="flex justify-between items-end">
                           <div>
                              <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{user?.role === 'master_admin' ? 'Studio Lívia Nicolly' : 'Relatório de Performance'}</h1>
                              <p className="text-sm font-bold text-gray-500 tracking-[0.3em] uppercase mt-1">Snapshot Consolidado • {new Date().toLocaleDateString('pt-BR')}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-gray-400">BellaAI Systems</p>
                              <p className="text-[10px] font-medium text-gray-300">bella-ai-beauty-salon-management</p>
                           </div>
                        </div>
                     </div>

                     {/* Top Cards Resumo */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                        <div className="bg-emerald-50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-emerald-100 text-center">
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Entradas Totais</span>
                           <h4 className="text-4xl font-black text-emerald-700">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        </div>
                        <div className="bg-rose-50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-rose-100 text-center">
                           <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-1">Saídas Totais</span>
                           <h4 className="text-4xl font-black text-rose-700">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        </div>
                        <div className="bg-gray-900 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] text-center shadow-xl shadow-gray-200">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Saldo Líquido</span>
                           <h4 className="text-4xl font-black text-white">R$ {netResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                        {/* Performance por Categoria */}
                        <div className="space-y-6">
                           <h5 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <BarChart2 size={14} className="text-[#FF69B4]" /> Receita por Categoria
                           </h5>
                           <div className="space-y-4">
                              {categoryData.length > 0 ? categoryData.map((cat, idx) => {
                                 const percentage = totalIncome > 0 ? ((cat.value / totalIncome) * 100).toFixed(0) : 0;
                                 return (
                                    <div key={cat.name} className="space-y-2">
                                       <div className="flex justify-between items-end">
                                          <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                                          <span className="text-xs font-black text-gray-900">R$ {cat.value.toLocaleString('pt-BR')} ({percentage}%)</span>
                                       </div>
                                       <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                          <div
                                             className="h-full transition-all duration-1000"
                                             style={{ width: `${percentage}%`, backgroundColor: COLORS_CHART[idx % COLORS_CHART.length] }}
                                          ></div>
                                       </div>
                                    </div>
                                 );
                              }) : <p className="text-gray-300 italic text-sm">Sem dados registrados.</p>}
                           </div>
                        </div>

                        {/* Meios de Pagamento */}
                        <div className="space-y-6">
                           <h5 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Award size={14} className="text-[#40E0D0]" /> Meios de Pagamento
                           </h5>
                           <div className="space-y-3">
                              {paymentMethodData.length > 0 ? paymentMethodData.map((method, idx) => (
                                 <div key={method.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: COLORS_CHART[idx % COLORS_CHART.length] }}>
                                          {method.name === 'PIX' ? <QrCode size={14} /> : method.name === 'Cartão' ? <CreditCard size={14} /> : <Banknote size={14} />}
                                       </div>
                                       <span className="font-bold text-gray-700">{method.name}</span>
                                    </div>
                                    <span className="font-black text-gray-900">R$ {method.value.toLocaleString('pt-BR')}</span>
                                 </div>
                              )) : <p className="text-gray-300 italic text-sm">Sem dados registrados.</p>}
                           </div>
                        </div>
                     </div>

                     {/* Insights da BellaAI */}
                     <div className="bg-gradient-to-br from-[#FF69B4]/5 to-[#40E0D0]/5 p-8 rounded-[3rem] border border-pink-100/50 relative overflow-hidden group">
                        <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                           <Award size={120} />
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                           <Sparkles size={20} className="text-[#FF69B4]" />
                           <span className="text-[10px] font-black text-[#FF69B4] uppercase tracking-widest">BellaAI Strategic Insight</span>
                        </div>
                        <p className="text-gray-700 font-medium leading-relaxed italic">
                           {profitMarginNum >= 0
                              ? `"Seu Studio está operando com uma margem saudável de ${profitMargin}%. O ticket médio de R$ ${averageTicket.toFixed(0)} sugere boa aceitação de serviços premium. Continue focando em fidelização para o próximo ciclo."`
                              : `"Atenção: A margem de ${profitMargin}% indica que os custos superaram as receitas. Recomendo uma análise imediata nos insumos e uma campanha de marketing para aumentar o ticket médio e reequilibrar o caixa."`}
                        </p>
                     </div>
                  </div>

                  <div className="hidden print:block p-10 border-t border-gray-100 text-center">
                     <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Documento eletrônico gerado pela plataforma BellaAI.</p>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Detalhes da Transação */}
         {selectedDetailTransaction && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl space-y-8 animate-in zoom-in duration-300 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-gray-50 to-white -z-10"></div>
                  <button onClick={() => setSelectedDetailTransaction(null)} className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-gray-100 rounded-full hover:rotate-90 transition-transform shrink-0 flex items-center justify-center z-10">
                     <X size={20} />
                  </button>

                  <div className="space-y-4">
                     <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ${selectedDetailTransaction.type === 'income' ? 'bg-[#40E0D0] text-white shadow-teal-100' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                        {selectedDetailTransaction.type === 'income' ? <ArrowUpRight size={40} /> : <ArrowDownRight size={40} />}
                     </div>
                     <div>
                        <h3 className="text-3xl font-black text-gray-900">R$ {selectedDetailTransaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 ${selectedDetailTransaction.type === 'income' ? 'text-[#40E0D0]' : 'text-rose-500'}`}>
                           {selectedDetailTransaction.type === 'income' ? 'Receita Confirmada' : 'Despesa Registrada'}
                        </p>
                     </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-[2.5rem] space-y-4 text-left">
                     <DetailItem icon={<FileText size={14} />} label="Descrição" value={selectedDetailTransaction.title} />
                     <DetailItem icon={<User size={14} />} label={selectedDetailTransaction.type === 'income' ? 'Cliente' : 'Fornecedor'} value={selectedDetailTransaction.client} />
                     <DetailItem icon={<Calendar size={14} />} label="Data" value={new Date(selectedDetailTransaction.date).toLocaleString('pt-BR')} />
                     <DetailItem icon={<CreditCard size={14} />} label="Método" value={selectedDetailTransaction.method} />
                     <DetailItem icon={<Hash size={14} />} label="ID Transação" value={`#${selectedDetailTransaction.id}`} />
                  </div>

                  <div className="flex gap-3">
                     <button onClick={() => window.print()} className="flex-1 py-5 bg-gray-900 text-white rounded-[1.8rem] font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Printer size={20} /> Imprimir
                     </button>
                     <button
                        onClick={() => {
                           onShowConfirm({
                              title: 'Excluir Transação?',
                              message: `Isto removerá a transação de R$ ${selectedDetailTransaction.amount.toLocaleString('pt-BR')} permanentemente.`,
                              variant: 'danger',
                              onConfirm: () => {
                                 onDeleteTransaction(selectedDetailTransaction.id);
                                 setSelectedDetailTransaction(null);
                                 onShowToast("Transação excluída com sucesso.");
                              }
                           });
                        }}
                        className="p-5 bg-rose-50 text-rose-500 rounded-[1.8rem] hover:bg-rose-100 transition-all active:scale-95"
                        title="Excluir Transação"
                     >
                        <Trash2 size={24} />
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Filtros */}
         {isFilterOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="bg-white w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl sm:text-2xl font-black">Filtrar Histórico 🔍</h3>
                     <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Tipo</label>
                        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                           {['all', 'income', 'expense'].map(t => (
                              <button key={t} onClick={() => setFilters({ ...filters, type: t as any })} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${filters.type === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
                                 {t === 'all' ? 'Tudo' : t === 'income' ? 'Entradas' : 'Saídas'}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">De</label><input type="date" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} /></div>
                        <div><label className="text-[10px] font-black text-gray-400 uppercase mb-1 block">Até</label><input type="date" className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} /></div>
                     </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                     <button onClick={clearFilters} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold">Limpar</button>
                     <button onClick={() => setIsFilterOpen(false)} className="flex-[2] py-4 bg-[#FF69B4] text-white rounded-2xl font-bold shadow-xl shadow-pink-100">Aplicar ({processedTransactions.length})</button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal: POS */}
         {isPOSOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                  <div className="bg-gradient-to-r from-[#FF69B4] to-[#C71585] p-6 text-white flex justify-between items-center">
                     <div className="flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><Smartphone size={24} /></div><div><h3 className="font-black text-xl">BellaPay POS 💎</h3><p className="text-[10px] font-bold opacity-70">Checkout de Vendas</p></div></div>
                     <button onClick={() => { setIsPOSOpen(false); setCheckoutStep('select'); }} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8">
                     {checkoutStep === 'select' && (
                        <div className="space-y-6">
                           <div className="flex p-1 bg-gray-100 rounded-2xl w-full">
                              <button
                                 onClick={() => { setSaleType('appointment'); setSelectedApt(null); }}
                                 className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${saleType === 'appointment' ? 'bg-white text-[#FF69B4] shadow-sm' : 'text-gray-500'}`}
                              >
                                 Agendamentos
                              </button>
                              <button
                                 onClick={() => { setSaleType('direct'); setDirectSaleData({ clientName: '', serviceName: '', amount: 0 }); }}
                                 className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${saleType === 'direct' ? 'bg-white text-[#FF69B4] shadow-sm' : 'text-gray-500'}`}
                              >
                                 Venda Direta
                              </button>
                           </div>

                           {saleType === 'appointment' ? (
                              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 scrollbar-hide">
                                 {appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').length > 0 ? (
                                    appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed').map(apt => (
                                       <div key={apt.id} onClick={() => setSelectedApt(apt)} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${selectedApt?.id === apt.id ? 'border-[#FF69B4] bg-pink-50/30' : 'border-gray-50 hover:border-gray-100'}`}>
                                          <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selectedApt?.id === apt.id ? 'bg-[#FF69B4] text-white' : 'bg-white text-gray-400 shadow-sm'}`}>{apt.clientName.charAt(0)}</div><div><p className="font-bold text-gray-900">{apt.clientName}</p><p className="text-xs text-gray-400">{apt.service}</p></div></div>
                                          <span className="font-black text-[#FF69B4]">R$ {apt.price}</span>
                                       </div>
                                    ))
                                 ) : (
                                    <div className="py-10 text-center text-gray-400 italic">Nenhum agendamento pendente.</div>
                                 )}
                              </div>
                           ) : (
                              <div className="space-y-4">
                                 <div className="relative">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cliente</label>
                                    <input
                                       type="text"
                                       placeholder="Buscar cliente..."
                                       className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-[#FF69B4]"
                                       value={clientSearch}
                                       onChange={e => {
                                          setClientSearch(e.target.value);
                                          setDirectSaleData({ ...directSaleData, clientName: e.target.value });
                                          setShowClientResults(true);
                                       }}
                                       onFocus={() => setShowClientResults(true)}
                                    />
                                    {showClientResults && filteredClients.length > 0 && (
                                       <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                                          {filteredClients.map(c => (
                                             <button
                                                key={c.id}
                                                className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors flex items-center justify-between group"
                                                onClick={() => {
                                                   setDirectSaleData({ ...directSaleData, clientName: c.name });
                                                   setClientSearch(c.name);
                                                   setShowClientResults(false);
                                                }}
                                             >
                                                <span className="font-bold text-gray-700 group-hover:text-[#FF69B4]">{c.name}</span>
                                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-400 uppercase font-black">Registrado</span>
                                             </button>
                                          ))}
                                       </div>
                                    )}
                                 </div>

                                 <div className="relative">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Serviço/Produto</label>
                                    <input
                                       type="text"
                                       placeholder="Corte, Escova, Shampoo..."
                                       className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none focus:ring-2 focus:ring-[#FF69B4]"
                                       value={itemSearch}
                                       onChange={e => {
                                          setItemSearch(e.target.value);
                                          setDirectSaleData({ ...directSaleData, serviceName: e.target.value });
                                          setShowItemResults(true);
                                       }}
                                       onFocus={() => setShowItemResults(true)}
                                    />
                                    {showItemResults && filteredItems.length > 0 && (
                                       <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                                          {filteredItems.map((item, idx) => (
                                             <button
                                                key={idx}
                                                className="w-full text-left px-4 py-3 hover:bg-pink-50 transition-colors flex items-center justify-between group"
                                                onClick={() => {
                                                   setDirectSaleData({
                                                      ...directSaleData,
                                                      serviceName: item.name,
                                                      amount: item.price
                                                   });
                                                   setItemSearch(item.name);
                                                   setShowItemResults(false);
                                                }}
                                             >
                                                <div>
                                                   <span className="font-bold text-gray-700 group-hover:text-[#FF69B4]">{item.name}</span>
                                                   <span className="block text-[10px] text-gray-400 font-bold">{item.type}</span>
                                                </div>
                                                <span className="font-black text-emerald-600">R$ {item.price}</span>
                                             </button>
                                          ))}
                                       </div>
                                    )}
                                 </div>

                                 <div className="md:col-span-2">
                                    <CurrencyInput
                                       label="Valor da Venda"
                                       value={directSaleData.amount}
                                       onChange={val => setDirectSaleData({ ...directSaleData, amount: val })}
                                       placeholder="R$ 0,00"
                                    />
                                 </div>
                              </div>
                           )}

                           {(saleType === 'appointment' ? selectedApt : (directSaleData.clientName && directSaleData.serviceName && directSaleData.amount > 0)) && (
                              <button onClick={() => setCheckoutStep('payment')} className="w-full py-4 bg-[#FF69B4] text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all">
                                 Prosseguir <ChevronRight className="inline ml-1" />
                              </button>
                           )}
                        </div>
                     )}
                     {checkoutStep === 'payment' && (saleType === 'appointment' ? selectedApt : true) && (
                        <div className="space-y-8 animate-in fade-in">
                           <div className="bg-[#F5F5F5] p-8 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100">
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-2">Total a Receber</span>
                              <h2 className="text-5xl font-black text-gray-900">
                                 R$ {(saleType === 'appointment' ? selectedApt!.price : directSaleData.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </h2>
                              <p className="text-sm text-[#FF69B4] font-bold mt-2">
                                 {saleType === 'appointment' ? selectedApt!.clientName : directSaleData.clientName} • {saleType === 'appointment' ? selectedApt!.service : directSaleData.serviceName}
                              </p>
                           </div>
                           <div className="grid grid-cols-3 gap-4">
                              <PaymentMethodBtn id="PIX" icon={<QrCode size={24} />} label="PIX" active={paymentMethod === 'PIX'} onClick={() => setPaymentMethod('PIX')} />
                              <PaymentMethodBtn id="Card" icon={<CreditCard size={24} />} label="Cartão" active={paymentMethod === 'Card'} onClick={() => setPaymentMethod('Card')} />
                              <PaymentMethodBtn id="Cash" icon={<Banknote size={24} />} label="Dinheiro" active={paymentMethod === 'Cash'} onClick={() => setPaymentMethod('Cash')} />
                           </div>
                           <div className="flex gap-4">
                              <button onClick={() => setCheckoutStep('select')} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold">Voltar</button>
                              <button onClick={handleProcessCheckout} disabled={!paymentMethod || isProcessing} className="flex-[2] py-4 bg-[#40E0D0] text-white rounded-2xl font-black text-lg shadow-xl shadow-teal-50 disabled:opacity-30 flex items-center justify-center gap-2">{isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={24} /> Confirmar</>}</button>
                           </div>
                        </div>
                     )}
                     {checkoutStep === 'success' && (
                        <div className="flex flex-col items-center justify-center py-10 space-y-8 text-center">
                           <div className="w-32 h-32 bg-[#40E0D0] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl animate-bounce"><CheckCircle size={64} /></div>
                           <h3 className="text-3xl font-black text-gray-900">Venda Concluída! 🚀</h3>
                           <button onClick={() => { setIsPOSOpen(false); setCheckoutStep('select'); setDirectSaleData({ clientName: '', serviceName: '', amount: 0 }); setSelectedApt(null); setPaymentMethod(null); }} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl">Fechar PDV</button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         )}

         {/* Modal: Nova Despesa */}
         {isExpenseModalOpen && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-bounce-in">
                  <div className="bg-rose-500 p-6 text-white flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                           <ArrowDownRight size={24} />
                        </div>
                        <div>
                           <h3 className="font-black text-xl">Registrar Despesa 💸</h3>
                           <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Saída de Caixa</p>
                        </div>
                     </div>
                     <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-8 space-y-5">
                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Descrição / Título</label>
                        <input
                           type="text"
                           placeholder="Ex: Aluguel, Luz, Insumos..."
                           className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                           value={expenseData.title}
                           onChange={e => setExpenseData({ ...expenseData, title: e.target.value })}
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <CurrencyInput
                              label="Valor da Despesa"
                              value={expenseData.amount}
                              onChange={val => setExpenseData({ ...expenseData, amount: val })}
                              placeholder="R$ 0,00"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Data</label>
                           <input
                              type="date"
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                              value={expenseData.date}
                              onChange={e => setExpenseData({ ...expenseData, date: e.target.value })}
                           />
                        </div>
                     </div>

                     <div className="relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Fornecedor / Categoria</label>
                        <input
                           type="text"
                           placeholder="Quem recebeu?"
                           className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                           value={supplierSearch}
                           onChange={e => {
                              setSupplierSearch(e.target.value);
                              setExpenseData({ ...expenseData, client: e.target.value });
                              setShowSupplierResults(true);
                           }}
                           onFocus={() => setShowSupplierResults(true)}
                        />
                        {showSupplierResults && filteredSuppliers.length > 0 && (
                           <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                              {filteredSuppliers.map(s => (
                                 <button
                                    key={s.id}
                                    className="w-full text-left px-4 py-3 hover:bg-rose-50 transition-colors flex items-center justify-between group"
                                    onClick={() => {
                                       setExpenseData({ ...expenseData, client: s.name });
                                       setSupplierSearch(s.name);
                                       setShowSupplierResults(false);
                                    }}
                                 >
                                    <div>
                                       <span className="font-bold text-gray-700 group-hover:text-rose-500">{s.name}</span>
                                       <span className="block text-[10px] text-gray-400 font-bold">{s.category}</span>
                                    </div>
                                    <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-black uppercase">Fornecedor</span>
                                 </button>
                              ))}
                           </div>
                        )}
                     </div>

                     <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Forma de Pagamento</label>
                        <div className="grid grid-cols-3 gap-2">
                           {['Dinheiro', 'PIX', 'Cartão'].map(m => (
                              <button
                                 key={m}
                                 onClick={() => setExpenseData({ ...expenseData, method: m })}
                                 className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${expenseData.method === m ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-gray-50 text-gray-400 hover:border-gray-100'}`}
                              >
                                 {m}
                              </button>
                           ))}
                        </div>
                     </div>

                     <button
                        onClick={handleSaveExpense}
                        disabled={!expenseData.title || expenseData.amount <= 0}
                        className="w-full py-5 bg-rose-500 text-white rounded-[1.8rem] font-black text-lg shadow-xl shadow-rose-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
                     >
                        Confirmar Pagamento
                     </button>
                  </div>
               </div>
            </div>
         )}
         {/* Modal: Gerenciamento de Fornecedor */}
         {isSupplierModalOpen && (
            <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-bounce-in">
                  <div className="bg-orange-500 p-8 text-white flex justify-between items-center relative overflow-hidden">
                     <div className="absolute right-[-10%] top-[-20%] opacity-20 rotate-12"><Truck size={140} /></div>
                     <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                           <Plus size={28} />
                        </div>
                        <div>
                           <h3 className="font-black text-2xl">{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
                           <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Gestão de Parceiros</p>
                        </div>
                     </div>
                     <button onClick={() => setIsSupplierModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full relative z-10">
                        <X size={24} />
                     </button>
                  </div>

                  <div className="p-10 space-y-6">
                     <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Nome da Empresa / Fantasia</label>
                           <input
                              type="text"
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900"
                              value={supplierForm.name}
                              onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                              placeholder="Ex: Belle Cosméticos LTDA"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Contato Principal</label>
                           <input
                              type="text"
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900"
                              value={supplierForm.contactName}
                              onChange={e => setSupplierForm({ ...supplierForm, contactName: e.target.value })}
                              placeholder="Ex: João Silva"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Categoria</label>
                           <select
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 appearance-none"
                              value={supplierForm.category}
                              onChange={e => setSupplierForm({ ...supplierForm, category: e.target.value })}
                           >
                              <option>Geral</option>
                              <option>Insumos</option>
                              <option>Serviços</option>
                              <option>Marketing</option>
                              <option>Aluguel/Taxas</option>
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Telefone</label>
                           <input
                              type="tel"
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900"
                              value={supplierForm.phone}
                              onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                              placeholder="(11) 99999-9999"
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">E-mail</label>
                           <input
                              type="email"
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900"
                              value={supplierForm.email}
                              onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                              placeholder="contato@empresa.com"
                           />
                        </div>
                        <div className="col-span-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Observações / Detalhes</label>
                           <textarea
                              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 min-h-[100px] resize-none"
                              value={supplierForm.notes}
                              onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                              placeholder="Dados bancários, prazos de entrega..."
                           />
                        </div>
                     </div>

                     <button
                        onClick={handleSaveSupplier}
                        disabled={!supplierForm.name}
                        className="w-full py-5 bg-orange-500 text-white rounded-[1.8rem] font-black text-lg shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
                     >
                        {editingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

const KPICard: React.FC<{ title: string; value: number; trend: number; icon: any; color: string; prefix: string; inverseTrend?: boolean; }> = ({ title, value, trend, icon, color, prefix, inverseTrend }) => {
   const isPositive = inverseTrend ? trend < 0 : trend > 0;
   return (
      <div className="p-6 rounded-[2.5rem] bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
         <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-500`}>{icon}</div>
            <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{isPositive ? <TrendingUp size={10} /> : <TrendingUp size={10} className="rotate-180" />}{Math.abs(trend)}%</div>
         </div>
         <div className="relative z-10">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{title}</span>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight"><span className="text-base text-gray-300 font-bold mr-1">{prefix}</span>{value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
         </div>
      </div>
   );
};

const DetailItem: React.FC<{ icon: any, label: string, value: string }> = ({ icon, label, value }) => (
   <div className="flex items-center gap-3">
      <div className="p-2 bg-white rounded-lg text-gray-400 shadow-sm">{icon}</div>
      <div>
         <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest block">{label}</span>
         <span className="text-sm font-bold text-gray-700 leading-tight">{value}</span>
      </div>
   </div>
);

const PaymentMethodBtn: React.FC<{ id: string; icon: any; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
   <button onClick={onClick} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${active ? 'border-[#40E0D0] bg-teal-50/30 text-[#40E0D0]' : 'border-gray-50 bg-gray-50/30 text-gray-400'}`}>
      <div className={`p-3 rounded-2xl ${active ? 'bg-[#40E0D0] text-white shadow-lg' : 'bg-white shadow-sm'}`}>{icon}</div>
      <span className="font-black text-[10px] uppercase tracking-widest">{label}</span>
   </button>
);

export default FinancialView;
