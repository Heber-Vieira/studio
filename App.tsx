import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AppointmentsView from './components/Appointments';
import CRMView from './components/CRM';
import StaffView from './components/Staff';
import ServicesView from './components/Services';
import FinancialView from './components/Financial';
import MarketingView from './components/Marketing';
import SettingsView from './components/Settings';
import ClientBooking from './components/ClientBooking';
import ChatBellaAI from './components/ChatBellaAI';
import LoginView from './components/Login';
import InventoryView from './components/Inventory';
import AnamnesisView from './components/Anamnesis';
import HelpSystem from './components/HelpSystem';
import ReleaseNotesPopup from './components/ReleaseNotesPopup';
import { View, Client, Appointment, Professional, SalonSettings, Service, Category, BlockedPeriod, BackupData, InventoryItem, Transaction, Supplier, AnamnesisTemplate, AnamnesisRecord } from './types';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS, MOCK_PROFESSIONALS, MOCK_SERVICES, MOCK_CATEGORIES, MOCK_INVENTORY, MOCK_INVENTORY_CATEGORIES } from './constants';
import { Language, translations } from './i18n';
import { CheckCircle2, LogOut, Loader2, Lock, Sparkles } from 'lucide-react';
import { supabase } from './services/supabase';
import { db } from './services/database';
import { Button } from './components/ui';

const MainLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const mainContentRef = useRef<HTMLElement>(null);

  /**
   * ULTRA-RESILIENT ROUTE PARSER
   */
  const getInitialRouteParams = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const hashIsBooking = hash.startsWith('#booking');
      const hashPart = hash.includes('?') ? hash.split('?')[1] : '';
      const hashParams = new URLSearchParams(hashPart);

      const pn = searchParams.get('pn') || hashParams.get('pn');
      const pp = searchParams.get('pp') || hashParams.get('pp');
      const ref = searchParams.get('ref') || hashParams.get('ref');

      if (pn || pp || ref || hashIsBooking) {
        return { isBooking: true, pn, pp, ref };
      }
    } catch (e) {
      console.warn("Route parsing error:", e);
    }
    return { isBooking: false };
  };

  const initialParams = useMemo(() => getInitialRouteParams(), []);

  const [currentView, setCurrentView] = useState<View>(() => {
    return initialParams.isBooking ? View.CLIENT_BOOKING : View.DASHBOARD;
  });

  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setSidebarOpen] = useState(() => {
    // START CLOSED ON TABLETS/PHONES (< 1024px)
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [prefilledClient, setPrefilledClient] = useState<{ name: string; phone: string } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [crmSearchTerm, setCrmSearchTerm] = useState('');

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('bella_lang');
    if (saved && ['pt', 'en', 'es'].includes(saved)) {
      return saved as Language;
    }
    return 'pt';
  });

  const t = translations[lang] || translations.pt;

  // FIX: Auto-scroll to top on View or User change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView, user?.id]);

  // System Recovery Timer - Show earlier (2s) if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRecovery(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSystemRecovery = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  useEffect(() => {
    if (initialParams.isBooking) {
      let clientData: { name: string; phone: string } | null = null;

      if (initialParams.ref) {
        try {
          const decoded = JSON.parse(atob(initialParams.ref));
          if (decoded.n && decoded.p) {
            clientData = { name: decoded.n, phone: decoded.p };
          }
        } catch (e) { console.error("Error decoding ref:", e); }
      } else if (initialParams.pn || initialParams.pp) {
        clientData = {
          name: initialParams.pn ? decodeURIComponent(initialParams.pn) : '',
          phone: initialParams.pp ? decodeURIComponent(initialParams.pp) : ''
        };
      }

      if (clientData) {
        setPrefilledClient(clientData);
        setCurrentView(View.CLIENT_BOOKING);

        try {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) { }
      }
    }
  }, [initialParams]);

  // Track previous user to detect explicit login transitions
  const prevUserRef = useRef<typeof user>(null);

  useEffect(() => {
    // Check if user transitioned from NULL (logged out) to OBJECT (logged in)
    // This strictly targets the "Login Event"
    const isLoginEvent = prevUserRef.current === null && user !== null;

    if (isLoginEvent && user?.role !== 'client' && !initialParams.isBooking) {
      setCurrentView(View.DASHBOARD);
    }

    // Update ref for next render
    prevUserRef.current = user;
  }, [user, initialParams.isBooking]);

  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [staff, setStaff] = useState<Professional[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [anamnesisTemplates, setAnamnesisTemplates] = useState<AnamnesisTemplate[]>(() => {
    const saved = localStorage.getItem('anamnesis_templates');
    return saved ? JSON.parse(saved) : [];
  });
  const [anamnesisRecords, setAnamnesisRecords] = useState<AnamnesisRecord[]>(() => {
    const saved = localStorage.getItem('anamnesis_records');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('anamnesis_templates', JSON.stringify(anamnesisTemplates));
  }, [anamnesisTemplates]);

  useEffect(() => {
    localStorage.setItem('anamnesis_records', JSON.stringify(anamnesisRecords));
  }, [anamnesisRecords]);

  const [settings, setSettings] = useState<SalonSettings>(() => {
    const saved = localStorage.getItem('salon_settings');
    const defaultLoyalty = { enabled: true, pointsPerReal: 1, redemptionCost: 500, rewardName: 'Hidratação Profunda' };
    const defaultPermissions = {
      viewFinancial: false, viewInventory: false, viewMarketing: false, viewStaff: false, viewServices: false, viewCRM: false
    };
    const defaultIntegrations = {
      googleCalendar: { enabled: false }, whatsapp: { enabled: true }, instagram: { enabled: false }, payment: { enabled: false }
    };
    const defaultAutomations = {
      reminder24h: true,
      confirmation2h: false,
      feedbackPostService: false,
      birthdayGreeting: true,
      reengagement45d: false,
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          loyalty: parsed.loyalty || defaultLoyalty,
          theme: parsed.theme || { enabled: false, primaryColor: '#FF69B4', secondaryColor: '#40E0D0' },
          permissions: parsed.permissions || defaultPermissions,
          integrations: parsed.integrations || defaultIntegrations,
          automations: parsed.automations || defaultAutomations,
        };
      } catch (e) {
        console.warn("Failed to parse saved settings, using defaults.");
        localStorage.removeItem('salon_settings');
      }
    }

    return {
      name: 'Studio Lívia Nicolly',
      address: 'Contagem, MG',
      phone: '(31) 98888-7777',
      aiTone: 'friendly',
      autoReminders: true,
      automations: defaultAutomations,
      pixKey: 'contato@studiolivianicolly.com',
      commissionDefault: 40,
      monthlyGoal: 20000,
      taxRate: 6,
      instagram: '@studiolivianicolly',
      logo: undefined,
      theme: { enabled: false, primaryColor: '#FF69B4', secondaryColor: '#40E0D0' },
      loyalty: defaultLoyalty,
      permissions: defaultPermissions,
      integrations: defaultIntegrations
    };
  });

  const showToast = useCallback((message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem('bella_startup_cache'); // Clear cache on logout
    await logout();
    // Explicitly reset view to Dashboard on logout so next login starts fresh
    setCurrentView(View.DASHBOARD);
  };

  const fetchData = useCallback(async (isInitial = false) => {
    if (!user && !initialParams.isBooking) return;

    // --- CACHE LAYER ---
    if (isInitial) {
      const cached = localStorage.getItem('bella_startup_cache');
      if (cached) {
        try {
          const { settings: s, cats, svcs, profs } = JSON.parse(cached);
          if (s) setSettings(s);
          if (cats) setCategories(cats);
          if (svcs) setServices(svcs);
          if (profs) setStaff(profs);
          // Don't set isDataLoading to false yet, we want a silent sync
        } catch (e) {
          console.warn("Cache parse error", e);
        }
      }
      setIsDataLoading(true);
    }

    const safetyTimeout = setTimeout(() => {
      console.warn("[FetchData] Safety timeout reached (15s). Forcing isDataLoading to false.");
      setIsDataLoading(false);
    }, 15000);

    try {
      console.log("[FetchData] Starting sync...");
      // PHASE 1: PRIORITY 0 (ESSENTIAL FOR RENDER)
      const [settingsRes, catsRes, svcsRes, staffRes] = await Promise.allSettled([
        db.getSettings(),
        db.getServiceCategories(),
        db.getServices(),
        db.getProfessionals()
      ]);

      if (settingsRes.status === 'fulfilled') {
        setSettings(settingsRes.value);
        console.log("[FetchData] Settings loaded:", settingsRes.value.name);
      }
      if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
      if (svcsRes.status === 'fulfilled') setServices(svcsRes.value);
      if (staffRes.status === 'fulfilled') setStaff(staffRes.value);

      // PROACTIVE SYNC: If core data is missing, sync mock data
      const isEmpty = (catsRes.status === 'fulfilled' && catsRes.value.length === 0) ||
        (svcsRes.status === 'fulfilled' && svcsRes.value.length === 0);

      if (isEmpty) {
        console.log("[FetchData] Database empty, syncing initial data...");
        await db.syncMockData(MOCK_CATEGORIES, MOCK_SERVICES, MOCK_PROFESSIONALS);
        const [fCats, fSvcs, fStaff] = await Promise.all([
          db.getServiceCategories(),
          db.getServices(),
          db.getProfessionals()
        ]);
        setCategories(fCats);
        setServices(fSvcs);
        setStaff(fStaff);
      }

      // UPDATE CACHE
      if (settingsRes.status === 'fulfilled' || !isEmpty) {
        const cacheData = {
          settings: settingsRes.status === 'fulfilled' ? settingsRes.value : undefined,
          cats: catsRes.status === 'fulfilled' ? catsRes.value : undefined,
          svcs: svcsRes.status === 'fulfilled' ? svcsRes.value : undefined,
          profs: staffRes.status === 'fulfilled' ? staffRes.value : undefined,
          timestamp: Date.now()
        };
        localStorage.setItem('bella_startup_cache', JSON.stringify(cacheData));
      }

      // Priority 0 is DONE, allow UI interactions
      console.log("[FetchData] Core data phase complete.");
      setIsDataLoading(false);

      // PHASE 2: PRIORITY 1 (BACKGROUND LOAD)
      // These are not needed for the initial screen render
      const backgroundTasks = async () => {
        console.log("[FetchData] Background load started...");
        const [clientsRes, appointmentsRes, invRes, invCatsRes, transRes, suppRes] = await Promise.allSettled([
          db.getClients(),
          db.getAppointments(),
          db.getInventoryItems(),
          db.getInventoryCategories(),
          db.getTransactions(),
          db.getSuppliers()
        ]);

        if (clientsRes.status === 'fulfilled') setClients(clientsRes.value);
        if (appointmentsRes.status === 'fulfilled') setAppointments(appointmentsRes.value);
        if (invRes.status === 'fulfilled') setInventory(invRes.value);
        if (invCatsRes.status === 'fulfilled') setInventoryCategories(invCatsRes.value);
        if (transRes.status === 'fulfilled') setTransactions(transRes.value);
        if (suppRes.status === 'fulfilled') setSuppliers(suppRes.value);
        console.log("[FetchData] Background load complete.");
      };

      backgroundTasks();

    } catch (error) {
      console.error("[FetchData] Critical error in fetchData:", error);
      setIsDataLoading(false);
    } finally {
      clearTimeout(safetyTimeout);
    }
  }, [user, initialParams.isBooking]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const refreshData = () => fetchData(false);

  const addClient = async (client: Omit<Client, 'id'>) => {
    try {
      await db.addClient(client);
      showToast("Cliente cadastrado!");
      fetchData();
    } catch (e) { showToast("Erro ao cadastrar cliente."); }
  };

  const importClients = async (clientsData: Omit<Client, 'id'>[]) => {
    try {
      await db.batchAddClients(clientsData);
      // No toast here as CRMView will handle it with the specific count
      fetchData();
    } catch (e) { showToast("Erro ao importar clientes."); }
  };

  const updateClient = async (updatedClient: Client) => {
    try {
      await db.updateClient(updatedClient);
      showToast("Cliente atualizado! ✨");
      fetchData();
    } catch (e) { showToast("Erro ao atualizar cliente."); }
  };

  const deleteClient = async (id: string) => {
    try {
      await db.deleteClient(id);
      showToast("Cliente excluído.");
      fetchData();
    } catch (e) { showToast("Erro ao excluir cliente."); }
  };

  const addAppointment = async (apt: Omit<Appointment, 'id'>) => {
    try {
      await db.addAppointment(apt);
      showToast("Agendado! ✨");
      fetchData();
    } catch (e) { showToast("Erro ao agendar."); }
  };

  const deleteAppointment = async (id: string) => {
    try {
      await db.deleteAppointment(id);
      showToast("Cancelado.");
      fetchData();
    } catch (e) { showToast("Erro ao cancelar."); }
  };

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    try {
      await db.addTransaction(t);
      showToast("Transação registrada.");
      fetchData();
    } catch (e) { showToast("Erro ao registrar transação."); }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await db.deleteTransaction(id);
      showToast("Transação removida.");
      fetchData();
    } catch (e) { showToast("Erro ao remover transação."); }
  };

  const addSupplier = async (s: Omit<Supplier, 'id'>) => {
    try {
      await db.addSupplier(s);
      showToast("Fornecedor cadastrado!");
      fetchData();
    } catch (e) { showToast("Erro ao cadastrar fornecedor."); }
  };

  const updateSupplier = async (s: Supplier) => {
    try {
      await db.updateSupplier(s);
      showToast("Fornecedor atualizado.");
      fetchData();
    } catch (e) { showToast("Erro ao atualizar fornecedor."); }
  };

  const deleteSupplier = async (id: string) => {
    try {
      await db.deleteSupplier(id);
      showToast("Fornecedor removido.");
      fetchData();
    } catch (e) { showToast("Erro ao remover fornecedor."); }
  };

  const processPayment = async (data: { appointmentId?: string, clientName: string, serviceName: string, amount: number, method: string }) => {
    try {
      // 1. Create Transaction
      await db.addTransaction({
        type: 'income',
        title: data.serviceName,
        client: data.clientName,
        amount: data.amount,
        method: data.method,
        date: new Date().toISOString()
      });

      // 2. Update Appointment if exists
      if (data.appointmentId) {
        const apt = appointments.find(a => a.id === data.appointmentId);
        if (apt) {
          await db.updateAppointment({ ...apt, status: 'completed' });
        }
      }

      // 3. Update Client Stats (optional but good)
      const client = clients.find(c => c.name === data.clientName);
      if (client) {
        await db.updateClient({
          ...client,
          totalSpent: client.totalSpent + data.amount,
          lastVisit: new Date().toISOString().split('T')[0]
        });
      }

      showToast("Pagamento processado com sucesso! ✨");
      fetchData();
    } catch (e) {
      console.error(e);
      showToast("Erro ao processar pagamento.");
    }
  };

  const addStaff = async (pro: Omit<Professional, 'id'>) => {
    try {
      await db.addProfessional(pro);
      showToast("Equipe atualizada! 💎");
      fetchData();
    } catch (e) { showToast("Erro ao adicionar profissional."); }
  };

  const updateStaff = async (updatedPro: Professional) => {
    try {
      await db.updateProfessional(updatedPro);
      showToast("Perfil atualizado!");
      fetchData();
    } catch (e) { showToast("Erro ao atualizar perfil."); }
  };

  const deleteStaff = async (id: string) => {
    try {
      await db.deleteProfessional(id);
      showToast("Removido da equipe.");
      fetchData();
    } catch (e) { showToast("Erro ao remover profissional."); }
  };

  const addService = async (newSvc: Omit<Service, 'id'>) => {
    try {
      await db.addService(newSvc);
      showToast("Serviço adicionado!");
      fetchData();
    } catch (e) {
      showToast("Erro ao adicionar serviço.");
      console.error(e);
    }
  };

  const updateService = async (updatedSvc: Service) => {
    try {
      await db.updateService(updatedSvc);
      showToast("Serviço atualizado! 🌸");
      fetchData();
    } catch (e) {
      showToast("Erro ao atualizar serviço.");
      console.error(e);
    }
  };

  const deleteService = async (id: string) => {
    try {
      await db.deleteService(id);
      showToast("Serviço removido.");
      fetchData();
    } catch (e) {
      showToast("Erro ao remover serviço.");
    }
  };

  const addServiceCategory = async (cat: Omit<Category, 'id'>) => {
    try {
      await db.addServiceCategory(cat);
      showToast("Categoria criada!");
      fetchData();
    } catch (e) {
      showToast("Erro ao criar categoria.");
    }
  };

  const deleteServiceCategory = async (id: string) => {
    try {
      await db.deleteServiceCategory(id);
      showToast("Categoria removida.");
      fetchData();
    } catch (e) {
      showToast("Erro ao remover categoria. Verifique se há serviços vinculados.");
    }
  };
  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      await db.addInventoryItem(item);
      showToast("Item adicionado ao estoque!");
      fetchData();
    } catch (e) { showToast("Erro ao adicionar item."); }
  };

  const updateInventoryItem = async (item: InventoryItem) => {
    try {
      await db.updateInventoryItem(item);
      showToast("Item atualizado! ✨");
      fetchData();
    } catch (e) { showToast("Erro ao atualizar item."); }
  };

  const deleteInventoryItem = async (id: string) => {
    try {
      await db.deleteInventoryItem(id);
      showToast("Item removido do estoque.");
      fetchData();
    } catch (e) { showToast("Erro ao remover item."); }
  };

  const handleStockMovement = async (id: string, newQuantity: number) => {
    try {
      const item = inventory.find(i => i.id === id);
      if (!item) return;
      await db.updateInventoryItem({ ...item, quantity: newQuantity });
      showToast("Movimentação de estoque registrada.");
      fetchData();
    } catch (e) { showToast("Erro na movimentação."); }
  };

  const addInventoryCategory = async (cat: Omit<Category, 'id'>) => {
    try {
      await db.addInventoryCategory(cat);
      showToast("Categoria de estoque criada!");
      fetchData();
    } catch (e) { showToast("Erro ao criar categoria."); }
  };

  const deleteInventoryCategory = async (id: string) => {
    try {
      await db.deleteInventoryCategory(id);
      showToast("Categoria removida.");
      fetchData();
    } catch (e) { showToast("Erro ao remover categoria."); }
  };

  const setSettingsAndPersist = async (newSettings: SalonSettings) => {
    try {
      await db.updateSettings(newSettings);
      setSettings(newSettings);
      showToast("Configurações salvas! ⚙️");
    } catch (e) {
      showToast("Erro ao salvar configurações.");
    }
  };

  const handleExportData = () => {
    const backup: BackupData = { version: '1.0', timestamp: new Date().toISOString(), settings, clients, appointments, staff, services, categories, blockedPeriods, transactions, inventory };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bellaai_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast("Backup gerado com sucesso! 📦");
  };

  const handleImportData = (data: BackupData) => {
    if (data.clients) setClients(data.clients);
    if (data.appointments) setAppointments(data.appointments);
    if (data.staff) setStaff(data.staff);
    if (data.services) setServices(data.services);
    if (data.settings) setSettings(data.settings);
    if (data.categories) setCategories(data.categories);
    if (data.inventory) setInventory(data.inventory);
    if (data.transactions) setTransactions(data.transactions);
    if (data.blockedPeriods) setBlockedPeriods(data.blockedPeriods);
    showToast("Dados restaurados com sucesso! ♻️");
  };

  const handlePrefilledBooking = (client: { name: string; phone: string }) => { setPrefilledClient(client); setCurrentView(View.CLIENT_BOOKING); };
  const handleViewAction = (view: View, filter?: string) => {
    setCurrentView(view);
    if (view === View.CRM) {
      setCrmSearchTerm(filter || '');
    } else {
      // Clear filter when leaving CRM to avoid confusion next time
      setCrmSearchTerm('');
    }
  };

  // Handle full-screen loading state
  // We only show the full splash if Auth is strictly loading OR if we have NO settings and NO cache
  if (isLoading || (!settings.name && isDataLoading)) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-pink-100/50 blur-3xl rounded-full scale-150 animate-pulse"></div>
        <Loader2 size={48} className="text-[#FF69B4] animate-spin relative z-10" />
      </div>

      <div className="space-y-4 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-700">
        <h2 className="text-xl font-black text-gray-900">Iniciando Studio...</h2>
        <p className="text-sm text-gray-400 font-medium leading-relaxed">Estamos preparando suas ferramentas de beleza e gestão. Só um instante! ✨</p>

        {showRecovery && (
          <div className="pt-8 animate-in zoom-in duration-500">
            <button
              onClick={handleSystemRecovery}
              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#FF69B4] transition-colors border-b border-transparent hover:border-[#FF69B4] pb-1"
            >
              Demorando demais? <span className="underline">Recuperar Sistema</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
  if (!user && currentView !== View.CLIENT_BOOKING) return <LoginView />;

  const AccessRestricted = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 fade-in">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400"><Lock size={40} /></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Acesso Restrito</h2>
      <p className="text-gray-500 max-w-sm">Você não possui permissão para este módulo. Solicite ao administrador.</p>
    </div>
  );

  const renderView = () => {
    try {
      // SECURITY GUARD: Clients are strictly limited to Dashboard or Booking Portal
      if (user?.role === 'client' && currentView !== View.DASHBOARD && currentView !== View.CLIENT_BOOKING) {
        return <Dashboard t={t} onAction={handleViewAction} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user.role} user={user} settings={settings} clients={clients} staff={staff} onLogout={logout} transactions={transactions} />;
      }

      const permissions = settings.permissions || {
        viewFinancial: false, viewInventory: false, viewMarketing: false, viewStaff: false, viewServices: false, viewCRM: false
      };

      switch (currentView) {
        case View.DASHBOARD:
          return <Dashboard t={t} onAction={handleViewAction} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user?.role || 'client'} user={user || undefined} settings={settings} clients={clients} staff={staff} onLogout={handleLogout} transactions={transactions} />;
        case View.APPOINTMENTS:
          return <AppointmentsView appointments={appointments} clients={clients} staff={staff} services={services} onAdd={addAppointment} onDelete={deleteAppointment} onBlock={() => { }} lang={lang} initialDate={selectedDate} blockedPeriods={blockedPeriods} />;
        case View.CRM:
          if (user?.role === 'attendant' && !permissions.viewCRM) return <AccessRestricted />;
          return <CRMView clients={clients} onAdd={addClient} onImport={importClients} onUpdate={updateClient} onDelete={deleteClient} onRedeem={() => { }} onPrefilledBooking={handlePrefilledBooking} appointments={appointments} settings={settings} t={t} onShowToast={showToast} initialSearchTerm={crmSearchTerm} />;
        case View.STAFF: if (user?.role === 'attendant' && !permissions.viewStaff) return <AccessRestricted />; return <StaffView staff={staff} services={services} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} blockedPeriods={blockedPeriods} onBlock={() => { }} onUnblock={() => { }} onViewSchedule={() => setCurrentView(View.APPOINTMENTS)} categories={categories} onShowToast={showToast} />;
        case View.SERVICES: if (user?.role === 'attendant' && !permissions.viewServices) return <AccessRestricted />; return <ServicesView services={services} categories={categories} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onAddCategory={addServiceCategory} onDeleteCategory={deleteServiceCategory} />;
        case View.INVENTORY:
          if (user?.role === 'attendant' && !permissions.viewInventory) return <AccessRestricted />;
          return <InventoryView inventory={inventory} categories={inventoryCategories} onAddItem={addInventoryItem} onUpdateItem={updateInventoryItem} onDeleteItem={deleteInventoryItem} onStockMovement={handleStockMovement} onAddTransaction={addTransaction} onAddCategory={addInventoryCategory} onDeleteCategory={deleteInventoryCategory} onShowToast={showToast} />;
        case View.FINANCIAL: if (user?.role === 'attendant' && !permissions.viewFinancial) return <AccessRestricted />; return <FinancialView transactions={transactions} appointments={appointments} categories={categories} onProcessPayment={processPayment} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} clients={clients} services={services} inventory={inventory} suppliers={suppliers} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} user={user!} onShowToast={showToast} />;
        case View.MARKETING: if (user?.role === 'attendant' && !permissions.viewMarketing) return <AccessRestricted />; return <MarketingView clients={clients} appointments={appointments} settings={settings} onUpdateSettings={setSettingsAndPersist} onShowToast={showToast} />;
        case View.ANAMNESIS: return <AnamnesisView clients={clients} templates={anamnesisTemplates} records={anamnesisRecords} onAddTemplate={(t) => setAnamnesisTemplates([...anamnesisTemplates, t])} onUpdateTemplate={(t) => setAnamnesisTemplates(anamnesisTemplates.map(item => item.id === t.id ? t : item))} onDeleteTemplate={(id) => setAnamnesisTemplates(anamnesisTemplates.filter(t => t.id !== id))} onAddRecord={(r) => setAnamnesisRecords([...anamnesisRecords, r])} onDeleteRecord={(id) => setAnamnesisRecords(anamnesisRecords.filter(r => r.id !== id))} onShowToast={showToast} />;
        case View.SETTINGS: if (user?.role === 'attendant' || user?.role === 'client') return <AccessRestricted />; return <SettingsView t={t} lang={lang} setLang={setLang} settings={settings} onUpdate={setSettingsAndPersist} onExportData={handleExportData} onImportData={handleImportData} onShowToast={showToast} />;
        case View.CLIENT_BOOKING:
          return <ClientBooking settings={settings} services={services} staff={staff} appointments={appointments} blockedPeriods={blockedPeriods} onBook={addAppointment} onClose={() => { setCurrentView(View.DASHBOARD); setPrefilledClient(null); }} initialClientData={prefilledClient || undefined} />;
        default: return <Dashboard t={t} onAction={handleViewAction} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user?.role || 'client'} user={user || undefined} settings={settings} clients={clients} staff={staff} onLogout={logout} />;
      }
    } catch (err) {
      console.error("Render error:", err);
      return <div className="p-20 text-center">Erro crítico ao carregar vista.</div>;
    }
  };

  const isPortalMode = currentView === View.CLIENT_BOOKING || user?.role === 'client';

  return (
    <>
      {isDataLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[9999] flex items-center justify-center fade-in">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[#FF69B4] animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 animate-pulse">Sincronizando Dados</span>
          </div>
        </div>
      )}
      <style>{`
        :root { --color-primary: ${settings.theme?.enabled ? settings.theme.primaryColor : '#FF69B4'}; --color-secondary: ${settings.theme?.enabled ? settings.theme.secondaryColor : '#40E0D0'}; }
        ${settings.theme?.enabled ? `.bg-\\[\\#FF69B4\\] { background-color: var(--color-primary) !important; } .text-\\[\\#FF69B4\\] { color: var(--color-primary) !important; } .border-\\[\\#FF69B4\\] { border-color: var(--color-primary) !important; } .bg-\\[\\#40E0D0\\] { background-color: var(--color-secondary) !important; } .text-\\[\\#40E0D0\\] { color: var(--color-secondary) !important; }` : ''}
        .elastic-bounce { animation: elastic-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards; }
@keyframes elastic-bounce { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* FIX: Forçar ícones de calendário a serem visíveis e com cursor correto */
input[type="date"] { color-scheme: light; cursor: pointer; }
input[type="date"]::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: grayscale(1);
  opacity: 0.6;
  transition: all 0.2s;
}
input[type="date"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  filter: none;
}
`}</style>
      <div className={`flex h-[100dvh] bg-white text-gray-800 overflow-hidden ${isPortalMode && currentView === View.CLIENT_BOOKING ? 'p-0' : ''} `}>
        {!isPortalMode && (
          <Sidebar
            t={t}
            activeView={currentView}
            onViewChange={setCurrentView}
            isOpen={isSidebarOpen}
            toggleOpen={() => setSidebarOpen(!isSidebarOpen)}
            logo={settings.logo}
            userRole={user?.role || 'client'}
            settings={settings}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        )}
        <main ref={mainContentRef} className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ${isPortalMode && currentView === View.CLIENT_BOOKING ? 'bg-white p-0' : 'p-4 md:p-6 lg:p-8'} `}>
          {!isPortalMode && user && (
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 lg:mb-12 fade-in gap-6 border-b border-gray-100 pb-6 shrink-0 px-4 lg:px-0">
              <div className="w-full lg:w-auto flex justify-between items-center sm:pl-14 lg:pl-0 min-w-0">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="lg:hidden w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain p-1.5" /> : <Sparkles className="text-[#FF69B4]" />}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 leading-none tracking-tight truncate shrink-0">
                      {settings.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                      <span className="text-[9px] sm:text-[10px] font-black text-[#FF69B4] uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded-full shrink-0">Pro Studio</span>
                      <span className="text-xs font-medium text-gray-400 truncate">{settings.address}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto overflow-x-auto scrollbar-hide pb-2 lg:pb-0">
                {user.role !== 'client' && (
                  <button
                    onClick={() => { setPrefilledClient(null); setCurrentView(View.CLIENT_BOOKING); }}
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#40E0D0] to-[#FF69B4] text-white px-4 sm:px-5 py-3 rounded-2xl font-black text-[10px] sm:text-xs shadow-xl hover:scale-105 transition-all whitespace-nowrap"
                  >
                    Portal do Cliente 🔗
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-rose-50 hover:text-rose-500 text-gray-400 px-3 sm:px-4 py-3 rounded-2xl font-bold text-[10px] sm:text-xs transition-all whitespace-nowrap"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </header>
          )}
          {renderView()}
        </main>
        <HelpSystem currentView={currentView} onShowToast={showToast} isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <ChatBellaAI lang={lang} />
        {!isPortalMode && user && (
          <ReleaseNotesPopup config={settings.releaseNotes} />
        )}
        {toast.show && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#40E0D0] text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-[200] border-2 border-white pointer-events-none"><Sparkles size={24} /><span className="font-bold text-sm tracking-tight">{toast.message}</span></div>}

      </div>
    </>
  );
};

const App: React.FC = () => <AuthProvider><MainLayout /></AuthProvider>;
export default App;
