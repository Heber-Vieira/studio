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
import HelpSystem from './components/HelpSystem';
import ReleaseNotesPopup from './components/ReleaseNotesPopup';
import { View, Client, Appointment, Professional, SalonSettings, Service, Category, BlockedPeriod, BackupData, InventoryItem, Transaction, Supplier } from './types';
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
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: '', show: false });
  const [prefilledClient, setPrefilledClient] = useState<{ name: string; phone: string } | null>(null);

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('bella_lang');
    return (saved as Language) || 'pt';
  });

  const t = translations[lang];

  // FIX: Auto-scroll to top on View or User change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentView, user?.id]);

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
    await logout();
  };

  const fetchData = useCallback(async (isInitial = false) => {
    if (!user) return;
    if (isInitial) setIsDataLoading(true);

    const safetyTimeout = setTimeout(() => {
      if (isDataLoading) {
        console.warn("fetchData safety timeout triggered");
        setIsDataLoading(false);
      }
    }, 15000);

    try {
      const [
        settingsRes,
        clientsRes,
        staffRes,
        servicesRes,
        categoriesRes,
        inventoryRes,
        invCatsRes,
        appointmentsRes,
        transactionsRes,
        suppliersRes
      ] = await Promise.allSettled([
        db.getSettings(),
        db.getClients(),
        db.getProfessionals(),
        db.getServices(),
        db.getServiceCategories(),
        db.getInventoryItems(),
        db.getInventoryCategories(),
        db.getAppointments(),
        db.getTransactions(),
        db.getSuppliers()
      ]);

      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value);
      if (staffRes.status === 'fulfilled') setStaff(staffRes.value);
      if (inventoryRes.status === 'fulfilled') setInventory(inventoryRes.value);
      if (invCatsRes.status === 'fulfilled') setInventoryCategories(invCatsRes.value);
      if (appointmentsRes.status === 'fulfilled') setAppointments(appointmentsRes.value);
      if (transactionsRes.status === 'fulfilled') setTransactions(transactionsRes.value);
      if (suppliersRes.status === 'fulfilled') setSuppliers(suppliersRes.value);

      if (categoriesRes.status === 'fulfilled') {
        setCategories(categoriesRes.value);
      }

      if (servicesRes.status === 'fulfilled') {
        setServices(servicesRes.value);
      }

      // Proactive Sync: If DB is empty, sync mock data
      if (
        (categoriesRes.status === 'fulfilled' && categoriesRes.value.length === 0) ||
        (servicesRes.status === 'fulfilled' && servicesRes.value.length === 0)
      ) {
        console.log("Database empty, syncing initial data...");
        await db.syncMockData(MOCK_CATEGORIES, MOCK_SERVICES, MOCK_PROFESSIONALS);
        // Re-fetch after sync to update local state with DB IDs
        if (isInitial) {
          const [freshCats, freshSvcs, freshStaff] = await Promise.all([
            db.getServiceCategories(),
            db.getServices(),
            db.getProfessionals()
          ]);
          setCategories(freshCats);
          setServices(freshSvcs);
          setStaff(freshStaff);
        }
      }
    } catch (error) {
      console.error("Critical error in fetchData:", error);
    } finally {
      clearTimeout(safetyTimeout);
      setIsDataLoading(false);
    }
  }, [user]);

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

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 size={40} className="text-[#FF69B4] animate-spin" /></div>;
  if (!user && currentView !== View.CLIENT_BOOKING) return <LoginView />;

  const AccessRestricted = () => (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 fade-in">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-400"><Lock size={40} /></div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Acesso Restrito</h2>
      <p className="text-gray-500 max-w-sm">Você não possui permissão para este módulo. Solicite ao administrador.</p>
    </div>
  );

  const renderView = () => {
    // SECURITY GUARD: Clients are strictly limited to Dashboard or Booking Portal
    if (user?.role === 'client' && currentView !== View.DASHBOARD && currentView !== View.CLIENT_BOOKING) {
      return <Dashboard t={t} onAction={(v) => setCurrentView(v)} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user.role} user={user} settings={settings} clients={clients} staff={staff} onLogout={logout} />;
    }

    const permissions = settings.permissions || {
      viewFinancial: false, viewInventory: false, viewMarketing: false, viewStaff: false, viewServices: false, viewCRM: false
    };

    switch (currentView) {
      case View.DASHBOARD:
        return <Dashboard t={t} onAction={(v) => setCurrentView(v)} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user?.role || 'client'} user={user || undefined} settings={settings} clients={clients} staff={staff} onLogout={handleLogout} />;
      case View.APPOINTMENTS:
        return <AppointmentsView appointments={appointments} clients={clients} staff={staff} services={services} onAdd={addAppointment} onDelete={deleteAppointment} onBlock={() => { }} lang={lang} initialDate={selectedDate} blockedPeriods={blockedPeriods} />;
      case View.CRM:
        if (user?.role === 'attendant' && !permissions.viewCRM) return <AccessRestricted />;
        return <CRMView clients={clients} onAdd={addClient} onUpdate={updateClient} onDelete={deleteClient} onRedeem={() => { }} onPrefilledBooking={handlePrefilledBooking} appointments={appointments} settings={settings} t={t} onShowToast={showToast} />;
      case View.STAFF: if (user?.role === 'attendant' && !permissions.viewStaff) return <AccessRestricted />; return <StaffView staff={staff} services={services} onAdd={addStaff} onUpdate={updateStaff} onDelete={deleteStaff} blockedPeriods={blockedPeriods} onBlock={() => { }} onUnblock={() => { }} onViewSchedule={() => setCurrentView(View.APPOINTMENTS)} categories={categories} onShowToast={showToast} />;
      case View.SERVICES: if (user?.role === 'attendant' && !permissions.viewServices) return <AccessRestricted />; return <ServicesView services={services} categories={categories} onAdd={addService} onUpdate={updateService} onDelete={deleteService} onAddCategory={addServiceCategory} onDeleteCategory={deleteServiceCategory} />;
      case View.INVENTORY:
        if (user?.role === 'attendant' && !permissions.viewInventory) return <AccessRestricted />;
        return <InventoryView inventory={inventory} categories={inventoryCategories} onAddItem={addInventoryItem} onUpdateItem={updateInventoryItem} onDeleteItem={deleteInventoryItem} onStockMovement={handleStockMovement} onAddTransaction={addTransaction} onAddCategory={addInventoryCategory} onDeleteCategory={deleteInventoryCategory} onShowToast={showToast} />;
      case View.FINANCIAL: if (user?.role === 'attendant' && !permissions.viewFinancial) return <AccessRestricted />; return <FinancialView transactions={transactions} appointments={appointments} onProcessPayment={processPayment} onAddTransaction={addTransaction} onDeleteTransaction={deleteTransaction} clients={clients} services={services} inventory={inventory} suppliers={suppliers} onAddSupplier={addSupplier} onUpdateSupplier={updateSupplier} onDeleteSupplier={deleteSupplier} user={user!} onShowToast={showToast} />;
      case View.MARKETING: if (user?.role === 'attendant' && !permissions.viewMarketing) return <AccessRestricted />; return <MarketingView clients={clients} appointments={appointments} settings={settings} onUpdateSettings={setSettingsAndPersist} onShowToast={showToast} />;
      case View.SETTINGS: if (user?.role === 'attendant' || user?.role === 'client') return <AccessRestricted />; return <SettingsView t={t} lang={lang} setLang={setLang} settings={settings} onUpdate={setSettingsAndPersist} onExportData={handleExportData} onImportData={handleImportData} onShowToast={showToast} />;
      case View.CLIENT_BOOKING:
        return <ClientBooking settings={settings} services={services} staff={staff} appointments={appointments} blockedPeriods={blockedPeriods} onBook={addAppointment} onClose={() => { setCurrentView(View.DASHBOARD); setPrefilledClient(null); }} initialClientData={prefilledClient || undefined} />;
      default: return <Dashboard t={t} onAction={(v) => setCurrentView(v)} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user?.role || 'client'} user={user || undefined} settings={settings} clients={clients} staff={staff} onLogout={logout} />;
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
          <Sidebar t={t} activeView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} toggleOpen={() => setSidebarOpen(!isSidebarOpen)} logo={settings.logo} userRole={user?.role || 'client'} settings={settings} />
        )}
        <main ref={mainContentRef} className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ${isPortalMode && currentView === View.CLIENT_BOOKING ? 'bg-white p-0' : 'p-4 md:p-8'} `}>
          {!isPortalMode && user && (
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-12 fade-in gap-6 border-b border-gray-100 pb-6 shrink-0 px-4 md:px-0">
              <div className="w-full md:w-auto flex justify-between items-center sm:pl-14 md:pl-0">
                <div className="flex items-center gap-5">
                  <div className="md:hidden w-12 h-12 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden">{settings.logo ? <img src={settings.logo} className="w-full h-full object-contain p-1.5" /> : <Sparkles className="text-[#FF69B4]" />}</div>
                  <div><h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-none tracking-tight">{settings.name}</h1><div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] font-black text-[#FF69B4] uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded-full">Pro Studio</span><span className="text-xs font-medium text-gray-400">{settings.address}</span></div></div>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                {user.role !== 'client' && <button onClick={() => { setPrefilledClient(null); setCurrentView(View.CLIENT_BOOKING); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-[#40E0D0] to-[#FF69B4] text-white px-5 py-3 rounded-2xl font-black text-xs shadow-xl hover:scale-105 transition-all whitespace-nowrap">Portal do Cliente 🔗</button>}
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-rose-50 hover:text-rose-500 text-gray-400 px-4 py-3 rounded-2xl font-bold text-xs transition-all whitespace-nowrap"><LogOut size={16} /> Sair</button>
              </div>
            </header>
          )}
          {renderView()}
        </main>
        <HelpSystem currentView={currentView} onShowToast={showToast} />
        <ChatBellaAI lang={lang} />
        {!isPortalMode && user && (
          <ReleaseNotesPopup config={settings.releaseNotes} />
        )}
        {toast.show && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#40E0D0] text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-[200] border-2 border-white pointer-events-none"><CheckCircle2 size={24} /><span className="font-bold text-sm tracking-tight">{toast.message}</span></div>}

      </div>
    </>
  );
};

const App: React.FC = () => <AuthProvider><MainLayout /></AuthProvider>;
export default App;
