import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { createPortal } from 'react-dom';
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
import { CheckCircle2, LogOut, Loader2, Lock, Sparkles, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      const cid = searchParams.get('cid') || hashParams.get('cid');
      const ref = searchParams.get('ref') || hashParams.get('ref');

      if (pn || pp || ref || cid || hashIsBooking) {
        return { isBooking: true, pn, pp, ref, cid };
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
      let clientData: { name: string; phone: string; id?: string } | null = null;

      if (initialParams.ref) {
        try {
          const decoded = JSON.parse(atob(initialParams.ref));
          if (decoded.n && decoded.p) {
            clientData = { name: decoded.n, phone: decoded.p, id: decoded.id };
          }
        } catch (e) { console.error("Error decoding ref:", e); }
      } else if (initialParams.pn || initialParams.pp || initialParams.cid) {
        clientData = {
          name: initialParams.pn ? decodeURIComponent(initialParams.pn) : '',
          phone: initialParams.pp ? decodeURIComponent(initialParams.pp) : '',
          id: initialParams.cid ? decodeURIComponent(initialParams.cid) : undefined
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
  const [anamnesisTemplates, setAnamnesisTemplates] = useState<AnamnesisTemplate[]>([]);
  const [anamnesisRecords, setAnamnesisRecords] = useState<AnamnesisRecord[]>([]);

  // Anamnesis database persistence handled via db service now

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

  const [toast, setToast] = useState({ message: '', show: false, type: 'info' as 'success' | 'error' | 'info' });
  const [dialog, setDialog] = useState<{
    show: boolean;
    type: 'alert' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger' | 'success';
  }>({ show: false, type: 'alert', title: '', message: '' });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, show: true, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  }, []);

  const showConfirm = useCallback((options: {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'primary' | 'danger' | 'success';
  }) => {
    setDialog({
      show: true,
      type: 'confirm',
      ...options
    });
  }, []);

  const showAlert = useCallback((title: string, message: string) => {
    setDialog({ show: true, type: 'alert', title, message });
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

        // Fetch Anamnesis Data
        const [templatesRes, recordsRes] = await Promise.allSettled([
          db.getAnamnesisTemplates(),
          db.getAnamnesisRecords()
        ]);
        if (templatesRes.status === 'fulfilled') setAnamnesisTemplates(templatesRes.value);
        if (recordsRes.status === 'fulfilled') setAnamnesisRecords(recordsRes.value);

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
      let finalClientId = apt.clientId;

      // Handle external/anonymous bookings by finding or creating the client
      if (apt.clientId === 'external') {
        const phoneToMatch = apt.clientPhone || (prefilledClient?.phone);
        // Note: ClientBooking should ideally pass the phone in the apt object if it's external
        // Let's check if it does. Looking at ClientBooking, it doesn't currently add phone to the apt object.
        // We need to fix ClientBooking to pass the phone/name if it's external.

        // Finding client in memory first
        const existing = clients.find(c => c.phone.replace(/\D/g, '') === (phoneToMatch || '').replace(/\D/g, ''));

        if (existing) {
          finalClientId = existing.id;
        } else {
          // Create client if not found
          const newC = await db.addClient({
            name: apt.clientName || 'Cliente Web',
            phone: apt.clientPhone || '',
            lastVisit: new Date().toISOString().split('T')[0],
            totalSpent: 0,
            loyaltyPoints: 0,
            tags: ['Portal Web']
          });
          finalClientId = newC.id;
        }
      }

      await db.addAppointment({
        ...apt,
        clientId: finalClientId
      });
      showToast("Agendado! ✨");
      fetchData();
    } catch (e) {
      console.error("Booking error:", e);
      showToast("Erro ao agendar.");
    }
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

  // --- ANAMNESIS ACTIONS ---
  const addAnamnesisTemplate = async (template: AnamnesisTemplate) => {
    try {
      // Prevent duplicate templates with same title
      const isDuplicate = anamnesisTemplates.some(t => t.title.toLowerCase() === template.title.toLowerCase());
      if (isDuplicate) {
        showToast("Este modelo já foi adicionado! ⚠️");
        return;
      }

      const companyId = user?.companyId || '00000000-0000-0000-0000-000000000001';
      await db.addAnamnesisTemplate(template, companyId);
      showToast("Modelo de anamnese criado!");
      fetchData();
    } catch (e: any) {
      console.error("Error creating template:", e);
      showToast(`Erro ao criar modelo: ${e.message || 'Erro de conexão'}`);
    }
  };

  const updateAnamnesisTemplate = async (template: AnamnesisTemplate) => {
    try {
      await db.updateAnamnesisTemplate(template);
      showToast("Modelo atualizado!");
      fetchData();
    } catch (e: any) {
      console.error("Error updating template:", e);
      showToast("Erro ao excluir modelo.");
    }
  };

  const deleteAnamnesisTemplate = async (id: string) => {
    try {
      await db.deleteAnamnesisTemplate(id);
      showToast("Modelo excluído.");
      fetchData();
    } catch (e: any) {
      console.error("Error deleting template:", e);
      showToast("Erro ao excluir modelo.");
    }
  };

  const addAnamnesisRecord = async (record: AnamnesisRecord) => {
    try {
      // Prevent duplicate records for the same client/template today
      const today = new Date().toISOString().split('T')[0];
      const isDuplicate = anamnesisRecords.some(r =>
        r.clientId === record.clientId &&
        r.templateId === record.templateId &&
        r.createdAt.startsWith(today)
      );

      if (isDuplicate) {
        showToast("Este cliente já possui uma ficha igual preenchida hoje! ⚠️");
        // We still allow it if they really want, but let's block for safety as requested.
        // Actually, let's block but log it.
        return;
      }

      await db.addAnamnesisRecord(record);
      showToast("Ficha de anamnese salva no banco! ✨");
      fetchData();
    } catch (e) {
      console.error("Error saving anamnesis record:", e);
      showToast("Erro ao salvar anamnese no banco.");
    }
  };

  const deleteAnamnesisRecord = async (id: string) => {
    try {
      await db.deleteAnamnesisRecord(id);
      showToast("Ficha excluída.");
      fetchData();
    } catch (e) { showToast("Erro ao excluir ficha."); }
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
        return <Dashboard t={t} onAction={handleViewAction} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user.role} user={user} settings={settings} clients={clients} staff={staff} services={services} onLogout={handleLogout} transactions={transactions} onShowConfirm={showConfirm} />;
      }

      const permissions = settings.permissions || {
        viewFinancial: false, viewInventory: false, viewMarketing: false, viewStaff: false, viewServices: false, viewCRM: false
      };

      switch (currentView) {
        case View.DASHBOARD:
          return <Dashboard t={t} onAction={handleViewAction} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user?.role || 'client'} user={user || undefined} settings={settings} clients={clients} staff={staff} services={services} onLogout={handleLogout} transactions={transactions} onShowConfirm={showConfirm} />;
        case View.APPOINTMENTS:
          return <AppointmentsView appointments={appointments} clients={clients} staff={staff} services={services} onAdd={addAppointment} onDelete={deleteAppointment} onBlock={() => { }} lang={lang} initialDate={selectedDate} blockedPeriods={blockedPeriods} onShowToast={showToast} onShowConfirm={showConfirm} onShowAlert={showAlert} />;
        case View.CRM:
          if (user?.role === 'attendant' && !permissions.viewCRM) return <AccessRestricted />;
          return (
            <CRMView
              clients={clients}
              onAdd={addClient}
              onImport={importClients}
              onUpdate={updateClient}
              onDelete={deleteClient}
              onRedeem={() => { }}
              onPrefilledBooking={(c) => { setPrefilledClient(c); setCurrentView(View.CLIENT_BOOKING); }}
              appointments={appointments}
              staff={staff}
              settings={settings}
              t={t}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
              initialSearchTerm={crmSearchTerm}
              services={services}
            />
          );
        case View.STAFF:
          if (user?.role === 'attendant' && !permissions.viewStaff) return <AccessRestricted />;
          return (
            <StaffView
              staff={staff}
              services={services}
              onAdd={addStaff}
              onUpdate={updateStaff}
              onDelete={deleteStaff}
              blockedPeriods={blockedPeriods}
              onBlock={() => { }}
              onUnblock={() => { }}
              onViewSchedule={() => setCurrentView(View.APPOINTMENTS)}
              categories={categories}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          );
        case View.SERVICES:
          if (user?.role === 'attendant' && !permissions.viewServices) return <AccessRestricted />;
          return (
            <ServicesView
              services={services}
              categories={categories}
              onAdd={addService}
              onUpdate={updateService}
              onDelete={deleteService}
              onAddCategory={addServiceCategory}
              onDeleteCategory={deleteServiceCategory}
              anamnesisTemplates={anamnesisTemplates}
              onShowConfirm={showConfirm}
            />
          );
        case View.INVENTORY:
          if (user?.role === 'attendant' && !permissions.viewInventory) return <AccessRestricted />;
          return (
            <InventoryView
              inventory={inventory}
              categories={inventoryCategories}
              onAddItem={addInventoryItem}
              onUpdateItem={updateInventoryItem}
              onDeleteItem={deleteInventoryItem}
              onStockMovement={handleStockMovement}
              onAddTransaction={addTransaction}
              onAddCategory={addInventoryCategory}
              onDeleteCategory={deleteInventoryCategory}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          );
        case View.FINANCIAL:
          if (user?.role === 'attendant' && !permissions.viewFinancial) return <AccessRestricted />;
          return (
            <FinancialView
              transactions={transactions}
              appointments={appointments}
              categories={categories}
              onProcessPayment={processPayment}
              onAddTransaction={addTransaction}
              onDeleteTransaction={deleteTransaction}
              clients={clients}
              services={services}
              inventory={inventory}
              suppliers={suppliers}
              onAddSupplier={addSupplier}
              onUpdateSupplier={updateSupplier}
              onDeleteSupplier={deleteSupplier}
              user={user!}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          );
        case View.MARKETING:
          if (user?.role === 'attendant' && !permissions.viewMarketing) return <AccessRestricted />;
          return <MarketingView clients={clients} appointments={appointments} settings={settings} onUpdateSettings={setSettingsAndPersist} onShowToast={showToast} onShowConfirm={showConfirm} />;
        case View.ANAMNESIS:
          return (
            <AnamnesisView
              clients={clients}
              staff={staff}
              templates={anamnesisTemplates}
              records={anamnesisRecords}
              onAddTemplate={addAnamnesisTemplate}
              onUpdateTemplate={updateAnamnesisTemplate}
              onDeleteTemplate={deleteAnamnesisTemplate}
              onAddRecord={addAnamnesisRecord}
              onDeleteRecord={deleteAnamnesisRecord}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          );
        case View.SETTINGS:
          if (user?.role === 'attendant' || user?.role === 'client') return <AccessRestricted />;
          return (
            <SettingsView
              t={t}
              lang={lang}
              setLang={setLang}
              settings={settings}
              onUpdate={setSettingsAndPersist}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onShowToast={showToast}
              onShowConfirm={showConfirm}
            />
          );
        case View.CLIENT_BOOKING:
          return <ClientBooking settings={settings} services={services} staff={staff} appointments={appointments} blockedPeriods={blockedPeriods} onBook={addAppointment} onClose={() => { setCurrentView(View.DASHBOARD); setPrefilledClient(null); }} initialClientData={prefilledClient || undefined} templates={anamnesisTemplates} onAddAnamnesisRecord={addAnamnesisRecord} onShowToast={showToast} onShowConfirm={showConfirm} onShowAlert={showAlert} />;
        default: return <Dashboard t={t} onAction={handleViewAction} onNavigateDate={setSelectedDate} appointments={appointments} userRole={user?.role || 'client'} user={user || undefined} settings={settings} clients={clients} staff={staff} services={services} onLogout={logout} onShowConfirm={showConfirm} />;
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
              <div className="w-full lg:w-auto flex justify-between items-center pl-14 md:pl-0 min-w-0">
                <div className="flex items-center gap-4 md:gap-5 min-w-0">
                  <div className="lg:hidden w-11 h-11 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    {settings.logo ? <img src={settings.logo} className="w-full h-full object-contain p-1.5" /> : <Sparkles className="text-[#FF69B4]" size={18} />}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl lg:text-4xl font-black text-gray-900 leading-none tracking-tight truncate">
                      {settings.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 overflow-hidden">
                      <span className="text-[9px] font-black text-[#FF69B4] uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded-full shrink-0">Pro Studio</span>
                      <span className="hidden sm:inline text-xs font-medium text-gray-400 truncate">{settings.address}</span>
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
        {dialog.show && createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 border border-white/20 text-center relative overflow-hidden">
              <div className={`w-20 h-20 mx-auto rounded-[1.8rem] flex items-center justify-center mb-2 shadow-inner ${dialog.variant === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-[#40E0D0]/10 text-[#40E0D0]'}`}>
                {dialog.variant === 'danger' ? <AlertTriangle size={36} /> : <Sparkles size={36} />}
              </div>

              <div className="space-y-3 relative z-10">
                <h3 className="text-2xl font-black text-gray-900 leading-tight">{dialog.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{dialog.message}</p>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                {dialog.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => { dialog.onConfirm?.(); setDialog({ ...dialog, show: false }); }}
                      className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-95 text-white ${dialog.variant === 'danger' ? 'bg-rose-500 shadow-rose-100' : 'bg-[#1a1a1a] shadow-gray-200'}`}
                    >
                      {dialog.confirmText || 'Confirmar'}
                    </button>
                    <button
                      onClick={() => setDialog({ ...dialog, show: false })}
                      className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all"
                    >
                      {dialog.cancelText || 'Cancelar'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDialog({ ...dialog, show: false })}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Entendi
                  </button>
                )}
              </div>
            </div>
          </div>, document.body
        )}

        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 pointer-events-none z-[10002] flex items-center justify-center p-4"
            >
              <div className="pointer-events-auto bg-gray-900/90 backdrop-blur-xl text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-white/10 text-center max-w-xs animate-in zoom-in duration-300">
                <button
                  onClick={() => setToast(prev => ({ ...prev, show: false }))}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-90 shadow-lg ${toast.type === 'error' ? 'bg-rose-500 hover:bg-rose-600' : toast.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#40E0D0] hover:bg-[#3bc8ba]'}`}
                >
                  {toast.type === 'error' ? <X size={24} /> : toast.type === 'success' ? <CheckCircle2 size={24} /> : <Sparkles size={24} />}
                </button>
                <div>
                  <p className="font-black text-sm tracking-tight leading-tight">{toast.message}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
};

const App: React.FC = () => <AuthProvider><MainLayout /></AuthProvider>;
export default App;
