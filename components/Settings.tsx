
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { SalonSettings, BackupData, ReleaseFeature, UserRole, ReleaseNote, ConfirmDialogOptions, Transaction } from '../types';
import { Language } from '../i18n';
import {
  Building2,
  Sparkles,
  CreditCard,
  Globe,
  Bell,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Instagram,
  Save,
  Languages,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
  Gift,
  Plus,
  Palette,
  Database,
  Download,
  UploadCloud,
  AlertTriangle,
  Crown,
  Check,
  Star,
  Lock,
  Rocket,
  Timer,
  User,
  Briefcase,
  ArrowRight,
  Users,
  UsersRound,
  Package,
  Megaphone,
  BookOpen,
  PartyPopper,
  Trophy,
  Settings,
  Info,
  BrainCircuit,
  Smile,
  Coffee,
  FileText,
  Landmark,
  Percent,
  QrCode,
  DollarSign,
  Target,
  Link,
  Unlink,
  MessageCircle,
  Calendar,
  Share2,
  RefreshCw,
  Lightbulb,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { CurrencyInput } from './ui';
import { maskPhone } from '../services/utils';
import { SYSTEM_UPDATES } from '../constants/systemUpdates';

interface SettingsProps {
  t: any;
  lang: Language;
  setLang: (l: Language) => void;
  settings: SalonSettings;
  onUpdate: (settings: SalonSettings) => void;
  onExportData: () => void;
  onImportData: (data: BackupData) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onShowConfirm: (options: ConfirmDialogOptions) => void;
  transactions: Transaction[];
}

type TabId = 'general' | 'ai' | 'financial' | 'integrations' | 'plan' | 'loyalty' | 'data' | 'team' | 'releases' | 'users' | 'privacy';

const DEFAULT_SETTINGS: SalonSettings = {
  name: 'Studio Lívia Nicolly',
  address: 'Contagem, MG',
  phone: '(31) 98888-7777',
  aiTone: 'friendly',
  autoReminders: true,
  pixKey: 'contato@studiolivianicolly.com',
  commissionDefault: 40,
  monthlyGoal: 20000,
  taxRate: 6,
  instagram: '@studiolivianicolly',
  logo: undefined,
  theme: { enabled: false, primaryColor: '#FF69B4', secondaryColor: '#40E0D0' },
  loyalty: { enabled: true, pointsPerReal: 1, redemptionCost: 500, rewardName: 'Hidratação Profunda' },
  permissions: { viewFinancial: false, viewInventory: false, viewMarketing: false, viewStaff: false, viewServices: false, viewCRM: false },
  releaseNotes: {
    enabled: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    activeNote: {
      version: '2.2.0',
      title: 'BellaAI Pulse: Visão 360º 💎',
      description: 'Novas ferramentas potentes desenhadas especialmente para sua rotina.',
      features: [
        { text: 'Novo Dashboard de Metas e Performance.', roles: ['master_admin', 'company_admin'] },
        { text: 'Interface de Agenda Otimizada para Celular.', roles: ['attendant', 'company_admin'] },
        { text: 'Histórico de Fidelidade em tempo real.', roles: ['client'] },
        { text: 'Chat Inteligente agora responde 2x mais rápido.', roles: 'all' },
        { text: 'Controle de Estoque com Alerta de Preço.', roles: ['company_admin'] }
      ]
    }
  },
  integrations: {
    googleCalendar: { enabled: false },
    whatsapp: { enabled: true },
    instagram: { enabled: false },
    payment: { enabled: false }
  }
};

/**
 * FIX: Helper component for team permissions
 */
const AccessToggle: React.FC<{ title: string; description: string; isActive: boolean; onToggle: () => void; icon: React.ReactNode; colorClass: string }> = ({ title, description, isActive, onToggle, icon, colorClass }) => (
  <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-indigo-100 transition-all group cursor-pointer shadow-sm" onClick={onToggle}>
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 shadow-lg' : 'bg-gray-100'}`}>
        {React.cloneElement(icon as any, { className: isActive ? 'text-white' : colorClass })}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{title}</h4>
        <p className="text-xs text-gray-400 font-medium">{description}</p>
      </div>
    </div>
    <div className={`w-14 h-8 rounded-full relative transition-all duration-300 p-1 ${isActive ? 'bg-indigo-500' : 'bg-gray-200'}`}>
      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  </div>
);

const SettingsView: React.FC<SettingsProps> = ({ t, lang, setLang, settings, onUpdate, onExportData, onImportData, onShowToast, onShowConfirm, transactions }) => {
  // Debug log to help diagnose issues
  console.log("SettingsView Rendering. T:", t);

  // Robust Translations Fallback
  const privacyT = t?.privacy || t?.settings?.privacy || {
    title: 'Central de Privacidade',
    description: 'Controle seus dados e consentimentos conforme a LGPD.',
    exportData: 'Exportar Meus Dados',
    exportDesc: 'Baixe uma cópia dos seus dados pessoais em formato JSON.',
    deleteAccount: 'Excluir Minha Conta',
    deleteDesc: 'Anonimizar seus dados e encerrar acesso ao sistema.',
    consents: 'Consentimentos',
    marketing: 'Marketing e Comunicações',
    marketingDesc: 'Receber novidades e promoções por e-mail.',
    terms: 'Termos de Uso e Política',
    termsDesc: 'Essencial para uso do sistema (Aceito no cadastro).',
  };

  const [activeTab, setActiveTab] = useState<TabId>('general');
  // --- USER MANAGEMENT STATE ---
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [localSettings, setLocalSettings] = useState<SalonSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...settings,
    permissions: { ...DEFAULT_SETTINGS.permissions, ...(settings.permissions || {}) },
    integrations: { ...DEFAULT_SETTINGS.integrations, ...(settings.integrations || {}) },
    releaseNotes: { ...DEFAULT_SETTINGS.releaseNotes!, ...(settings.releaseNotes || {}) }
  }));

  const integrations = localSettings.integrations || DEFAULT_SETTINGS.integrations!;
  const permissions = localSettings.permissions || DEFAULT_SETTINGS.permissions!;

  // --- PRIVACY STATE ---
  const [consents, setConsents] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isAnonymizing, setIsAnonymizing] = useState(false);

  useEffect(() => {
    if (activeTab === 'privacy') {
      loadConsents();
    }
  }, [activeTab]);

  const loadConsents = async () => {
    try {
      const { db } = await import('../services/database');
      const data = await db.getMyConsents();
      setConsents(data);
    } catch (e) {
      console.error("Error loading consents", e);
    }
  };

  const handleToggleConsent = async (type: 'marketing', value: boolean) => {
    try {
      const { db } = await import('../services/database');
      await db.recordConsent(type, value);
      onShowToast("Preferência atualizada!");
      loadConsents();
    } catch (e) {
      onShowToast("Erro ao atualizar.");
    }
  };

  const handleExportMyData = async () => {
    setIsExporting(true);
    try {
      const { db } = await import('../services/database');
      const data = {
        consents: consents,
        timestamp: new Date().toISOString(),
        settings: localSettings
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meus-dados-bellaai.json`;
      a.click();

      await db.logAction('export_data', 'all');
      onShowToast("Download iniciado!");
    } catch (e) {
      console.error(e);
      onShowToast("Erro ao exportar.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    onShowConfirm({
      title: privacyT.deleteAccount,
      message: privacyT.deleteDesc + " Esta ação é irreversível.",
      variant: 'danger',
      onConfirm: async () => {
        setIsAnonymizing(true);
        try {
          const { db } = await import('../services/database');
          await db.anonymizeUser();
          onShowToast("Conta anonimizada. Até logo.");
          window.location.reload();
        } catch (e) {
          onShowToast("Erro ao excluir conta.");
        } finally {
          setIsAnonymizing(false);
        }
      }
    });
  };

  // Fetch profiles when entering "Users" tab
  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async (force = false) => {
    try {
      const { db } = await import('../services/database');
      const profiles = await db.getProfiles();
      setUserProfiles(profiles);
      if (force) onShowToast("Lista de usuários atualizada!");
    } catch (e) {
      console.error("Error fetching profiles:", e);
      onShowToast("Erro ao carregar usuários.");
    }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      const { db } = await import('../services/database');
      await db.updateProfile(editingUser);
      onShowToast("Usuário atualizado com sucesso!");
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchData(); // Refresh list
    } catch (e) {
      console.error("Error updating user:", e);
      onShowToast("Erro ao salvar usuário.");
    }
  };

  const handleDeleteUser = async (id: string) => {
    onShowConfirm({
      title: "Excluir Usuário?",
      message: "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
      variant: 'danger',
      onConfirm: async () => {
        try {
          const { db } = await import('../services/database');
          await db.deleteProfile(id);
          onShowToast("Usuário excluído.");
          fetchData();
        } catch (e) {
          console.error("Error deleting user:", e);
          onShowToast("Erro ao excluir usuário.");
        }
      }
    });
  };
  // -----------------------------


  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [integratingId, setIntegratingId] = useState<string | null>(null);
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [mockupView, setMockupView] = useState<'default' | 'booked' | 'menu'>('default');
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newFeatureRole, setNewFeatureRole] = useState<UserRole | 'all'>('all');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlanId, setCurrentPlanId] = useState('pro');
  const [isPreviewExploring, setIsPreviewExploring] = useState(false);

  const [checkoutState, setCheckoutState] = useState<{
    isOpen: boolean;
    planId: string | null;
    step: 'review' | 'processing' | 'success';
    paymentMethod: 'card' | 'pix';
  }>({
    isOpen: false,
    planId: null,
    step: 'review',
    paymentMethod: 'card'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const featureInputRef = useRef<HTMLInputElement>(null);

  // --- RELEASE NOTES LOGIC (Moved to Top Level to follow Rules of Hooks) ---
  const releaseConfig = useMemo(() => localSettings.releaseNotes || {
    enabled: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    activeNote: { version: '1.0', title: '', description: '', features: [] }
  }, [localSettings.releaseNotes]);

  const activeNote = useMemo(() => releaseConfig.activeNote || {
    version: '1.0', title: '', description: '', features: []
  }, [releaseConfig]);

  const displayNote = useMemo(() => {
    const rawNotes = [...(SYSTEM_UPDATES || [])];
    if (activeNote && activeNote.version) {
      rawNotes.push(activeNote);
    }
    if (rawNotes.length === 0) return null;

    // Pegar a nota mais recente
    const sorted = rawNotes.sort((a, b) => (b.version || '').localeCompare(a.version || '', undefined, { numeric: true, sensitivity: 'base' }));
    const latest = sorted[0];

    // Filtrar recursos ocultos para o preview
    const filteredFeatures = (latest.features || []).filter(f => {
      const fText = typeof f === 'string' ? f : f.text;
      const isSystem = (SYSTEM_UPDATES || []).some(sn => (sn.features || []).some(sf => (typeof sf === 'string' ? sf : sf.text) === fText));

      if (isSystem) {
        return !(releaseConfig.hiddenSystemFeatures || []).includes(fText);
      }
      return typeof f === 'object' && !f.hidden;
    });

    return { ...latest, features: filteredFeatures };
  }, [activeNote, releaseConfig.hiddenSystemFeatures]);
  // ------------------------------------------------------------------------


  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(localSettings);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    } catch (e) {
      console.error("Save error in SettingsView:", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFactoryReset = () => {
    setIsResetting(true);
    setTimeout(() => {
      setLocalSettings(DEFAULT_SETTINGS);
      onUpdate(DEFAULT_SETTINGS);
      setIsResetting(false);
      setIsResetModalOpen(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 1500);
  };

  const toggleIntegration = (key: keyof NonNullable<SalonSettings['integrations']>) => {
    const currentStatus = localSettings.integrations?.[key]?.enabled;
    if (!currentStatus) {
      setIntegratingId(key);
      setTimeout(() => {
        setLocalSettings(prev => ({
          ...prev,
          integrations: {
            ...prev.integrations,
            [key]: { enabled: true, accountId: `mock_${key}_123`, lastSync: new Date().toISOString() }
          }
        }));
        setIntegratingId(null);
      }, 2000);
    } else {
      setLocalSettings(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          [key]: { enabled: false }
        }
      }));
    }
  };

  const extractColorsFromImage = (imageSrc: string) => {
    setIsExtractingColors(true);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height; ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts: Record<string, number> = {};
      for (let i = 0; i < imageData.length; i += 40) {
        const r = imageData[i]; const g = imageData[i + 1]; const b = imageData[i + 2]; const a = imageData[i + 3];
        if (a < 128) continue;
        if (r > 240 && g > 240 && b > 240) continue;
        if (r < 20 && g < 20 && b < 20) continue;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
      const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
      const palette = sortedColors.slice(0, 6).map(c => c[0]);
      setExtractedPalette(palette);
      if (palette.length > 0) {
        const primary = palette[0];
        let secondary = palette[1] || primary;
        if (primary === secondary) secondary = '#40E0D0';
        setLocalSettings(prev => ({
          ...prev,
          theme: { enabled: true, primaryColor: primary, secondaryColor: secondary }
        }));
      }
      setTimeout(() => setIsExtractingColors(false), 800);
    };
    img.onerror = () => setIsExtractingColors(false);
  };

  const handleResetColors = () => {
    setLocalSettings(prev => ({
      ...prev,
      theme: { enabled: prev.theme?.enabled ?? true, primaryColor: '#FF69B4', secondaryColor: '#40E0D0' }
    }));
    setExtractedPalette([]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLocalSettings(prev => ({ ...prev, logo: result }));
        extractColorsFromImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          onImportData(json as BackupData);
          onShowToast("Backup restaurado com sucesso! ✨");
        } catch (err) {
          onShowToast("Erro ao ler arquivo de backup.");
        }
      };
      reader.readAsText(file);
      if (backupInputRef.current) backupInputRef.current.value = '';
    }
  };

  const togglePermission = (key: keyof NonNullable<SalonSettings['permissions']>) => {
    setLocalSettings(prev => ({
      ...prev,
      permissions: {
        ...DEFAULT_SETTINGS.permissions,
        ...(prev.permissions || {}),
        [key]: !((prev.permissions || DEFAULT_SETTINGS.permissions!)[key])
      }
    }));
  };

  const applyReleaseTemplate = (type: 'launch' | 'update' | 'maintenance') => {
    const now = new Date();
    const future = new Date(now.getTime() + 15 * 86400000);

    const templates: Record<string, Partial<ReleaseNote>> = {
      launch: {
        version: '1.0',
        title: 'O Futuro Chegou! 🚀',
        description: 'Bem-vindo à revolução na gestão da sua beleza. O sistema está no ar.',
        features: [
          { text: 'Agenda Digital Inteligente', roles: 'all' },
          { text: 'Gestão Financeira Completa', roles: ['master_admin', 'company_admin'] },
          { text: 'Portal de Clientes Automatizado', roles: 'all' }
        ]
      },
      update: {
        version: '2.5.0',
        title: 'BellaAI Pulse: Visão 360º 💎',
        description: 'Potencialize sua rotina com novas ferramentas de inteligência.',
        features: [
          { text: 'Novos Relatórios de Metas Mensais', roles: ['company_admin'] },
          { text: 'Links Magnéticos de Agendamento', roles: 'all' },
          { text: 'ChatBellaAI com Respostas Rápidas', roles: 'all' }
        ]
      },
      maintenance: {
        version: '2.5.1',
        title: 'Polimento & Brilho ✨',
        description: 'Ajustamos os detalhes para que sua experiênca seja sempre vibrante.',
        features: [
          { text: 'Melhoria de Performance no Mobile', roles: 'all' },
          { text: 'Ajustes no Layout Financeiro', roles: ['company_admin'] },
          { text: 'Novos Ícones no Catálogo', roles: 'all' }
        ]
      }
    };

    const tpl = templates[type];
    if (tpl && localSettings.releaseNotes) {
      setLocalSettings({
        ...localSettings,
        releaseNotes: {
          ...localSettings.releaseNotes,
          enabled: true,
          startDate: now.toISOString().split('T')[0],
          endDate: future.toISOString().split('T')[0],
          activeNote: {
            ...localSettings.releaseNotes.activeNote,
            ...tpl as ReleaseNote
          }
        }
      });
    }
  };

  const handleAddReleaseFeature = () => {
    if (!newFeatureText.trim()) return;
    const currentReleaseNotes = localSettings.releaseNotes || { enabled: false, startDate: '', endDate: '', activeNote: { version: '1.0', title: '', description: '', features: [] } };
    const currentActiveNote = currentReleaseNotes.activeNote || { version: '1.0', title: '', description: '', features: [] };

    const rolesPayload = newFeatureRole === 'all' ? 'all' : [newFeatureRole];
    const newFeatures = [
      ...(currentActiveNote.features || []),
      { text: newFeatureText, roles: rolesPayload as any, hidden: false }
    ];
    setLocalSettings(prev => ({
      ...prev,
      releaseNotes: {
        ...currentReleaseNotes,
        activeNote: { ...currentActiveNote, features: newFeatures }
      }
    }));
    setNewFeatureText('');
    featureInputRef.current?.focus();
  };

  const handleRemoveReleaseFeature = (idx: number) => {
    const currentReleaseNotes = localSettings.releaseNotes || { enabled: false, startDate: '', endDate: '', activeNote: { version: '1.0', title: '', description: '', features: [] } };
    const currentActiveNote = currentReleaseNotes.activeNote || { version: '1.0', title: '', description: '', features: [] };

    const newFeatures = (currentActiveNote.features || []).filter((_, i) => i !== idx);
    setLocalSettings(prev => ({
      ...prev,
      releaseNotes: {
        ...currentReleaseNotes,
        activeNote: { ...currentActiveNote, features: newFeatures }
      }
    }));
  };

  const handleToggleSystemFeatureVisibility = (featureText: string) => {
    const currentHidden = releaseConfig.hiddenSystemFeatures || [];
    const isHidden = currentHidden.includes(featureText);
    const newHidden = isHidden
      ? currentHidden.filter(t => t !== featureText)
      : [...currentHidden, featureText];

    setLocalSettings(prev => ({
      ...prev,
      releaseNotes: {
        ...releaseConfig,
        hiddenSystemFeatures: newHidden
      }
    }));
  };

  const handleToggleCustomFeatureVisibility = (idx: number) => {
    const currentFeatures = [...(activeNote.features || [])];
    if (currentFeatures[idx]) {
      const feat = currentFeatures[idx];
      currentFeatures[idx] = typeof feat === 'string'
        ? { text: feat, roles: 'all', hidden: true }
        : { ...feat, hidden: !feat.hidden };
    }

    setLocalSettings(prev => ({
      ...prev,
      releaseNotes: {
        ...releaseConfig,
        activeNote: { ...activeNote, features: currentFeatures }
      }
    }));
  };

  const confirmChangePlan = () => {
    setCheckoutState(prev => ({ ...prev, step: 'processing' }));
    setTimeout(() => {
      setCheckoutState(prev => ({ ...prev, step: 'success' }));
      setCurrentPlanId(checkoutState.planId!);
    }, 2000);
  };

  const plans = useMemo(() => [
    { id: 'trial', name: 'Bella Trial', priceMonthly: 0, priceYearly: 0, description: 'Experimente a revolução por 14 dias.', features: ['Acesso Completo', 'Sem Cartão de Crédito', 'Suporte Básico', 'Válido por 14 dias'], color: 'bg-indigo-500', lightColor: 'bg-indigo-50', textColor: 'text-indigo-600', gradient: 'from-indigo-400 to-blue-600', icon: <Timer size={20} /> },
    { id: 'start', name: 'Bella Start', priceMonthly: 49, priceYearly: 39, description: 'Essencial para profissionais independentes.', features: ['1 Profissional', 'Agenda Inteligente', 'Link de Agendamento', 'CRM Básico'], color: 'bg-teal-500', lightColor: 'bg-teal-50', textColor: 'text-teal-600', gradient: 'from-teal-400 to-teal-600', icon: <Star size={20} /> },
    { id: 'pro', name: 'Bella Glow', priceMonthly: 99, priceYearly: 79, description: 'O favorito para salões em crescimento.', features: ['Até 5 Profissionais', 'WhatsApp Automático', 'Gestão Financeira', 'Programa de Fidelidade', 'IA de Marketing'], isPopular: true, color: 'bg-[#FF69B4]', lightColor: 'bg-[#FF69B4]/10', textColor: 'text-[#FF69B4]', gradient: 'from-[#FF69B4] to-[#C71585]', icon: <Sparkles size={20} /> },
    { id: 'empire', name: 'Bella Empire', priceMonthly: 199, priceYearly: 159, description: 'Poder ilimitado para grandes negócios.', features: ['Profissionais Ilimitados', 'Múltiplas Unidades', 'API Aberta', 'Gerente de Conta', 'Whitelabel (Seu App)'], color: 'bg-purple-600', lightColor: 'bg-purple-50', textColor: 'text-purple-600', gradient: 'from-purple-500 to-indigo-600', icon: <Crown size={20} /> }
  ], []);

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'general', label: t?.settings?.tabs?.general || 'Geral', icon: Building2 },
    { id: 'team', label: 'Acesso & Equipe', icon: Users },
    { id: 'users', label: 'Usuários', icon: ShieldCheck }, // New Users Tab
    { id: 'financial', label: t?.settings?.tabs?.financial || 'Financeiro', icon: CreditCard },
    { id: 'loyalty', label: t?.settings?.tabs?.loyalty || 'Fidelidade', icon: Gift },
    { id: 'ai', label: t?.settings?.tabs?.ai || 'IA', icon: Sparkles },
    { id: 'integrations', label: t?.settings?.tabs?.integrations || 'Integrações', icon: Globe },
    { id: 'releases', label: 'Novidades', icon: PartyPopper },
    { id: 'plan', label: t?.settings?.tabs?.plan || 'Plano', icon: Crown },
    { id: 'data', label: 'Dados', icon: Database },
    { id: 'privacy', label: privacyT.title, icon: ShieldCheck },
  ];

  const currentMonthIncome = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return transactions
      .filter(t => t.date?.startsWith(monthKey) && t.type === 'income')
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  }, [transactions]);

  const goalProgress = useMemo(() => {
    // Default to the goal in settings, or the fallback which is 20000
    const goal = localSettings.monthlyGoal && localSettings.monthlyGoal > 0 ? localSettings.monthlyGoal : 20000;
    const progress = Math.round((currentMonthIncome / goal) * 100);
    const visualProgress = Math.min(progress, 100);
    return { actual: progress, visual: visualProgress };
  }, [currentMonthIncome, localSettings.monthlyGoal]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'privacy':
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md"><ShieldCheck size={24} className="text-emerald-400" /></div>
                  <h3 className="text-2xl font-black">{privacyT.title}</h3>
                </div>
                <p className="text-gray-400 max-w-lg leading-relaxed text-sm font-medium">{privacyT.description}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <h4 className="text-lg font-black text-gray-900">{privacyT.consents}</h4>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl text-gray-400"><FileText size={20} /></div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{privacyT.terms}</h5>
                    <p className="text-xs text-gray-500">{privacyT.termsDesc}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  Aceito
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-xl text-pink-500"><Megaphone size={20} /></div>
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{privacyT.marketing}</h5>
                    <p className="text-xs text-gray-500">{privacyT.marketingDesc}</p>
                  </div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={consents.find(c => c.type === 'marketing')?.agreed ?? false} onChange={e => handleToggleConsent('marketing', e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-cyan-200 transition-all">
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{privacyT.exportData}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{privacyT.exportDesc}</p>
                </div>
                <button onClick={handleExportMyData} disabled={isExporting} className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} {privacyT.exportData}
                </button>
              </div>

              <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 shadow-sm flex flex-col justify-between group hover:border-rose-300 transition-all">
                <div className="mb-6">
                  <h4 className="text-xl font-black text-rose-900 mb-2">{privacyT.deleteAccount}</h4>
                  <p className="text-rose-700 text-sm leading-relaxed">{privacyT.deleteDesc}</p>
                </div>
                <button onClick={handleDeleteAccount} disabled={isAnonymizing} className="w-full py-4 bg-white border-2 border-rose-200 text-rose-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                  {isAnonymizing ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />} {privacyT.deleteAccount}
                </button>
              </div>
            </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-cyan-200">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Database size={24} className="text-white" /></div>
                    <h3 className="text-2xl font-black">Central de Dados</h3>
                  </div>
                  <p className="text-cyan-100 max-w-lg leading-relaxed text-sm font-medium">Gerencie o coração do seu negócio. Faça backups regulares e mantenha seus registros seguros.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[140px]">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-cyan-200 mb-1">Status do Sistema</span>
                  <span className="flex items-center justify-center gap-2 font-bold text-white"><ShieldCheck size={16} fill="currentColor" className="text-emerald-400" /> Seguro</span>
                </div>
              </div>
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/50 rounded-full blur-3xl"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-cyan-200 transition-all">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-cyan-50 rounded-[1.5rem] flex items-center justify-center text-cyan-500 mb-4 group-hover:scale-110 transition-transform">
                    <Download size={28} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Backup Completo</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">Baixe uma cópia de segurança contendo todos os clientes, agendamentos, configurações e histórico financeiro.</p>
                </div>
                <button onClick={onExportData} className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-cyan-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                  <Download size={18} /> Exportar Dados
                </button>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-all">
                <div className="mb-6">
                  <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-500 mb-4 group-hover:scale-110 transition-transform">
                    <UploadCloud size={28} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Restaurar Backup</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">Recupere seus dados a partir de um arquivo de backup (.json) gerado anteriormente.</p>
                </div>
                <div className="relative">
                  <input type="file" ref={backupInputRef} onChange={handleBackupUpload} accept=".json" className="hidden" />
                  <button onClick={() => backupInputRef.current?.click()} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <UploadCloud size={18} /> Importar Arquivo
                  </button>
                </div>
              </div>
            </div>
            {/* Reset Modal Logic replaced by global onShowConfirm */}
            <div className="bg-rose-50/50 p-10 rounded-[3rem] border border-rose-100 relative overflow-hidden group hover:bg-rose-50 transition-colors">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-200/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-start gap-6">
                  <div className="p-4 bg-white rounded-3xl text-rose-500 shadow-xl shadow-rose-100 animate-pulse"><AlertTriangle size={32} /></div>
                  <div>
                    <h4 className="text-2xl font-black text-rose-900 tracking-tight">Zona de Perigo</h4>
                    <p className="text-sm text-rose-700 max-md font-medium mt-1 leading-relaxed">Ações aqui restauram o sistema. Ao resetar, suas configurações personalizadas voltarão aos valores de fábrica.</p>
                  </div>
                </div>
                <button
                  onClick={() => onShowConfirm({
                    title: 'Deseja resetar?',
                    message: 'Isto reverterá suas configurações para o padrão original da plataforma. Esta ação não pode ser desfeita.',
                    variant: 'danger',
                    onConfirm: handleFactoryReset
                  })}
                  className="px-10 py-5 bg-white border-2 border-rose-200 text-rose-600 rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all shadow-xl shadow-rose-50 active:scale-95"
                >
                  Resetar Fábrica
                </button>
              </div>
            </div>
          </div>
        );
      case 'plan':
        const selectedPlanForCheckout = plans.find(p => p.id === checkoutState.planId);
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2"><div className="bg-white/10 p-2 rounded-xl backdrop-blur-md"><Crown size={24} className="text-yellow-400" /></div><h3 className="text-2xl font-black">Meu Plano</h3></div>
                  <p className="text-gray-400 text-sm font-medium">Você está no plano <strong className="text-white">{plans.find(p => p.id === currentPlanId)?.name}</strong>.<br />Próxima renovação: <span className="text-white">15 de Março de 2025</span>.</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[140px]"><span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</span><span className="flex items-center justify-center gap-2 font-bold text-emerald-400"><CheckCircle2 size={16} fill="currentColor" className="text-white" /> Ativo</span></div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
            <div className="flex justify-center">
              <div className="bg-gray-100 p-1.5 rounded-2xl flex items-center relative">
                <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Mensal</button>
                <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative z-10 flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white text-[#FF69B4] shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>Anual <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md uppercase font-black">-20%</span></button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map(plan => {
                const isCurrent = plan.id === currentPlanId;
                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                return (
                  <div key={plan.id} className={`bg-white rounded-[2.5rem] border transition-all duration-300 flex flex-col relative overflow-hidden group ${isCurrent ? 'border-gray-300 shadow-lg scale-[1.02]' : 'border-gray-100 hover:border-gray-200 hover:shadow-xl'}`}>
                    {plan.isPopular && <div className="bg-[#FF69B4] text-white text-[10px] font-black uppercase tracking-widest text-center py-1.5">Mais Popular</div>}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${plan.lightColor} ${plan.textColor}`}>{plan.icon}</div>
                      <h4 className="text-lg font-black text-gray-900">{plan.name}</h4>
                      <p className="text-xs text-gray-500 font-medium mt-1 min-h-[40px]">{plan.description}</p>
                      <div className="my-6"><div className="flex items-end gap-1"><span className="text-3xl font-black text-gray-900">R$ {price}</span><span className="text-xs text-gray-400 font-bold mb-1">/mês</span></div>{billingCycle === 'yearly' && plan.priceMonthly > 0 && <span className="text-[10px] text-emerald-500 font-bold">Economize R$ {(plan.priceMonthly - plan.priceYearly) * 12}/ano</span>}</div>
                      <div className="space-y-3 mb-8 flex-1">{plan.features.map((feat, i) => <div key={i} className="flex items-center gap-2 text-xs font-bold text-gray-600"><Check size={14} className={`shrink-0 ${plan.textColor}`} /> {feat}</div>)}</div>
                      <button onClick={() => !isCurrent && setCheckoutState({ ...checkoutState, isOpen: true, planId: plan.id, step: 'review' })} disabled={isCurrent} className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : `bg-gray-900 text-white hover:scale-[1.02] shadow-lg ${plan.textColor === 'text-[#FF69B4]' ? 'bg-[#FF69B4] shadow-pink-100' : ''}`}`}>{isCurrent ? 'Seu Plano' : plan.priceMonthly === 0 ? 'Iniciar Trial' : 'Escolher Plano'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {checkoutState.isOpen && selectedPlanForCheckout && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
                <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
                  {checkoutState.step === 'review' && (
                    <div className="p-8">
                      <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-gray-900">Resumo do Pedido</h3><button onClick={() => setCheckoutState({ ...checkoutState, isOpen: false })} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X size={18} /></button></div>
                      <div className="bg-gray-50 p-6 rounded-[2rem] mb-6 border border-gray-100">
                        <div className="flex justify-between items-center mb-2"><span className="font-bold text-gray-900">{selectedPlanForCheckout.name} ({billingCycle === 'monthly' ? 'Mensal' : 'Anual'})</span><span className="font-black text-[#FF69B4]">R$ {billingCycle === 'monthly' ? selectedPlanForCheckout.priceMonthly : selectedPlanForCheckout.priceYearly}</span></div>
                        <div className="h-px bg-gray-200 my-4"></div>
                        <div className="flex justify-between items-center text-sm"><span className="font-black text-gray-900 uppercase">Total Hoje</span><span className="font-black text-2xl text-gray-900">R$ {billingCycle === 'monthly' ? selectedPlanForCheckout.priceMonthly : selectedPlanForCheckout.priceYearly}</span></div>
                      </div>
                      {selectedPlanForCheckout.priceMonthly > 0 ? (
                        <div className="space-y-3">
                          <div
                            onClick={() => setCheckoutState({ ...checkoutState, paymentMethod: 'card' })}
                            className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${checkoutState.paymentMethod === 'card' ? 'border-[#40E0D0] bg-teal-50/30' : 'border-gray-100 hover:bg-gray-50'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${checkoutState.paymentMethod === 'card' ? 'border-[#40E0D0]' : 'border-gray-300'}`}>
                              {checkoutState.paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-[#40E0D0]"></div>}
                            </div>
                            <span className="font-bold text-gray-700 flex items-center gap-2"><CreditCard size={16} /> Cartão de Crédito</span>
                          </div>
                          <div
                            onClick={() => setCheckoutState({ ...checkoutState, paymentMethod: 'pix' })}
                            className={`flex items-center gap-3 p-4 border-2 rounded-2xl cursor-pointer transition-all ${checkoutState.paymentMethod === 'pix' ? 'border-[#40E0D0] bg-teal-50/30' : 'border-gray-100 hover:bg-gray-50'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${checkoutState.paymentMethod === 'pix' ? 'border-[#40E0D0]' : 'border-gray-300'}`}>
                              {checkoutState.paymentMethod === 'pix' && <div className="w-2.5 h-2.5 rounded-full bg-[#40E0D0]"></div>}
                            </div>
                            <span className="font-bold text-gray-700 flex items-center gap-2"><QrCode size={16} /> PIX</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm"><CheckCircle2 size={24} /></div>
                          <p className="text-xs font-bold text-indigo-700 leading-tight">Plano gratuito selecionado. Nenhuma cobrança será realizada hoje!</p>
                        </div>
                      )}
                      <button onClick={confirmChangePlan} className="w-full py-4 bg-[#FF69B4] text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-100 mt-8 hover:scale-[1.02] active:scale-95 transition-all">Confirmar Assinatura ✨</button>
                    </div>
                  )}
                  {checkoutState.step === 'processing' && <div className="p-12 flex flex-col items-center justify-center text-center"><Loader2 size={48} className="text-[#FF69B4] animate-spin mb-6" /><h3 className="text-xl font-black text-gray-900 mb-2">Processando...</h3><p className="text-gray-500 text-sm">Estamos atualizando seu estúdio para a nova versão.</p></div>}
                  {checkoutState.step === 'success' && <div className="p-8 text-center bg-white relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FF69B4]/10 to-transparent pointer-events-none"></div><div className="w-24 h-24 bg-[#40E0D0] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-2xl animate-bounce"><Check size={48} strokeWidth={4} /></div><h3 className="text-2xl font-black text-gray-900 mb-2">Upgrade Realizado! 🚀</h3><p className="text-gray-500 font-medium mb-8">Bem-vindo ao plano <strong>{selectedPlanForCheckout.name}</strong>. Todas as funcionalidades já estão liberadas.</p><button onClick={() => setCheckoutState({ ...checkoutState, isOpen: false })} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all">Explorar Agora</button></div>}
                </div>
              </div>
            )}
          </div>
        );
      case 'releases': {
        const handlePreviewExplore = () => {
          setIsPreviewExploring(true);
          setTimeout(() => setIsPreviewExploring(false), 2000);
        };

        return (
          <div className="space-y-8 fade-in h-full">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 h-full">
              <div className="flex-1 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Lightbulb size={12} className="text-yellow-500" /> Templates Mágicos (Sugerir Exemplos)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => applyReleaseTemplate('launch')} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all active:scale-95">v1.0 Lançamento</button>
                    <button onClick={() => applyReleaseTemplate('update')} className="px-4 py-2 bg-pink-50 text-pink-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-100 transition-all active:scale-95">v2.5 Upgrade IA</button>
                    <button onClick={() => applyReleaseTemplate('maintenance')} className="px-4 py-2 bg-teal-50 text-teal-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-100 transition-all active:scale-95">Manutenção & Brilho</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${releaseConfig.enabled ? 'bg-emerald-50 text-emerald-500' : 'bg-gray-100 text-gray-400'}`}><Rocket size={24} /></div>
                    <div><h4 className="font-bold text-gray-900">Apresentação de Novidades</h4><p className="text-xs text-gray-400 font-medium">Exibir popups de atualizações para usuários.</p></div>
                  </div>
                  <button onClick={() => setLocalSettings({ ...localSettings, releaseNotes: { ...releaseConfig, enabled: !releaseConfig.enabled } })} className={`w-14 h-8 rounded-full relative transition-all duration-300 ${releaseConfig.enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${releaseConfig.enabled ? 'left-7' : 'left-1'}`} /></button>
                </div>
                <div className={`space-y-6 transition-all duration-500 ${!releaseConfig.enabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14} /> Ciclo de Exibição</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Data Inicial</label><input type="date" className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold text-gray-800 text-sm outline-none shadow-sm [color-scheme:light] hover:bg-gray-50 transition-colors cursor-pointer" value={releaseConfig.startDate} onChange={e => setLocalSettings({ ...localSettings, releaseNotes: { ...releaseConfig, startDate: e.target.value } })} /></div>
                      <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Data Final</label><input type="date" className="w-full bg-white border-none rounded-xl px-4 py-3 font-bold text-gray-800 text-sm outline-none shadow-sm [color-scheme:light] hover:bg-gray-50 transition-colors cursor-pointer" value={releaseConfig.endDate} onChange={e => setLocalSettings({ ...localSettings, releaseNotes: { ...releaseConfig, endDate: e.target.value } })} /></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Versão Custom</label><input type="text" placeholder="v2.0" className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-black text-[#FF69B4] outline-none" value={activeNote.version || ''} onChange={e => setLocalSettings({ ...localSettings, releaseNotes: { ...releaseConfig, activeNote: { ...activeNote, version: e.target.value } } })} /></div>
                      <div className="col-span-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Título Personalizado</label><input type="text" placeholder="Sua Mensagem Aqui" className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 font-bold text-gray-900 outline-none" value={activeNote.title || ''} onChange={e => setLocalSettings({ ...localSettings, releaseNotes: { ...releaseConfig, activeNote: { ...activeNote, title: e.target.value } } })} /></div>
                    </div>
                    <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Mensagem Principal</label><textarea className="w-full h-24 bg-gray-50 border-none rounded-2xl px-4 py-3 font-medium text-gray-700 outline-none resize-none text-sm leading-relaxed" placeholder="Descreva as melhorias de forma empolgante..." value={activeNote.description || ''} onChange={e => setLocalSettings({ ...localSettings, releaseNotes: { ...releaseConfig, activeNote: { ...activeNote, description: e.target.value } } })} /></div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Gerenciar Itens da Apresentação</label>
                    <div className="flex gap-2">
                      <input ref={featureInputRef} type="text" placeholder="Ex: Novo painel financeiro" className="flex-1 bg-white border-2 border-gray-100 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-[#FF69B4] transition-colors" value={newFeatureText} onChange={e => setNewFeatureText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddReleaseFeature()} />
                      <select className="bg-gray-50 border-none rounded-xl px-3 py-3 text-xs font-bold text-gray-600 outline-none cursor-pointer" value={newFeatureRole} onChange={e => setNewFeatureRole(e.target.value as any)}>
                        <option value="all">Todos</option><option value="master_admin">Só Admins</option><option value="attendant">Equipe</option><option value="client">Clientes</option>
                      </select>
                      <button onClick={handleAddReleaseFeature} className="bg-[#FF69B4] text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-100"><Plus size={20} /></button>
                    </div>

                    <div className="space-y-3 mt-4">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] ml-1">Implementações Automáticas do Sistema</p>
                      {SYSTEM_UPDATES && SYSTEM_UPDATES.filter((n: any) => n.version === displayNote?.version).map((n: any) => (n.features || []).map((f: any, idx: number) => {
                        const fText = typeof f === 'string' ? f : f.text;
                        const isHidden = (releaseConfig.hiddenSystemFeatures || []).includes(fText);
                        return (
                          <div key={`sys-${idx}`} className={`flex items-center justify-between p-3 border rounded-xl transition-all ${isHidden ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-indigo-50/50 border-indigo-100'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full ${isHidden ? 'bg-gray-300' : 'bg-indigo-400'}`}></div>
                              <span className={`text-sm font-medium ${isHidden ? 'text-gray-400 line-through' : 'text-indigo-900'}`}>{fText}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isHidden && <span className="px-2 py-1 bg-white text-[8px] font-black text-indigo-500 uppercase rounded-md shadow-sm">BellaAI Auto</span>}
                              <button
                                onClick={() => handleToggleSystemFeatureVisibility(fText)}
                                className={`p-1.5 rounded-lg transition-colors ${isHidden ? 'text-gray-400 hover:text-indigo-500' : 'text-indigo-400 hover:text-indigo-600'}`}
                                title={isHidden ? "Mostrar no Popup" : "Ocultar do Popup"}
                              >
                                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        );
                      }))}

                      {(activeNote.features || []).length > 0 && <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.2em] ml-1 mt-4">Suas Customizações</p>}
                      {(activeNote.features || []).map((feat, i) => {
                        const featureText = typeof feat === 'string' ? feat : feat.text;
                        const featureRole = typeof feat === 'string' ? 'all' : (Array.isArray(feat.roles) ? feat.roles[0] : feat.roles);
                        const isHidden = typeof feat === 'object' && feat.hidden;
                        const roleColors: Record<string, string> = { all: 'bg-gray-100 text-gray-500', master_admin: 'bg-purple-100 text-purple-600', company_admin: 'bg-purple-100 text-purple-600', attendant: 'bg-teal-100 text-teal-600', client: 'bg-yellow-100 text-yellow-600' };
                        return (
                          <div key={i} className={`flex items-center justify-between p-3 bg-white border rounded-xl group transition-all ${isHidden ? 'opacity-60 grayscale' : 'hover:border-pink-100'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full ${isHidden ? 'bg-gray-300' : 'bg-[#FF69B4]'}`}></div>
                              <span className={`text-sm font-medium ${isHidden ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{featureText}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isHidden && (
                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${roleColors[featureRole as string] || roleColors.all}`}>
                                  {featureRole === 'all' ? 'Global' : featureRole === 'master_admin' ? 'Admin' : featureRole === 'company_admin' ? 'Admin' : featureRole === 'client' ? 'Cliente' : 'Equipe'}
                                </span>
                              )}
                              <button
                                onClick={() => handleToggleCustomFeatureVisibility(i)}
                                className={`p-1 transition-colors ${isHidden ? 'text-gray-400 hover:text-pink-500' : 'text-gray-300 hover:text-pink-500'}`}
                                title={isHidden ? "Mostrar no Popup" : "Ocultar do Popup"}
                              >
                                {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button onClick={() => handleRemoveReleaseFeature(i)} className="text-gray-300 hover:text-rose-500 transition-colors p-1 active:scale-90">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block flex-1 relative">
                <div className="sticky top-0">
                  <div className="flex items-center justify-center gap-2 mb-6 text-gray-400"><Eye size={16} /><span className="text-xs font-bold uppercase tracking-widest">Live Preview (Visto pelo Usuário)</span></div>
                  <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 relative max-w-sm mx-auto transform hover:scale-[1.02] transition-transform duration-500">
                    <div className="bg-gradient-to-br from-[#FF69B4] to-[#C71585] p-8 text-white text-center relative overflow-hidden">
                      <div className="absolute top-4 left-4 opacity-30"><Lightbulb size={32} /></div><div className="absolute bottom-4 right-4 opacity-30 rotate-12"><Rocket size={32} /></div>
                      <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full mb-4 border border-white/20"><Sparkles size={12} className="text-yellow-300" /><span className="text-[9px] font-black uppercase tracking-[0.2em]">Novidades</span></div>
                      <h2 className="text-4xl font-black tracking-tighter mb-1">v{displayNote?.version || '1.0'}</h2>
                      <p className="text-pink-100 font-bold text-xl px-6 leading-tight">{displayNote?.title || 'Título da Atualização'}</p>
                    </div>
                    <div className="p-8 space-y-6 bg-white">
                      <p className="text-gray-500 text-sm font-medium leading-relaxed italic text-center">"{displayNote?.description || 'Breve descrição das melhorias incríveis.'}"</p>
                      <div className="space-y-3">
                        {(displayNote?.features || []).map((feat, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 animate-in slide-in-from-left-2" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm mt-0.5"><CheckCircle2 size={12} className="text-[#40E0D0]" /></div>
                            <span className="text-xs font-bold text-gray-700 leading-snug">{typeof feat === 'string' ? feat : feat.text}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={handlePreviewExplore} disabled={isPreviewExploring} className={`w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${isPreviewExploring ? 'bg-emerald-500 scale-95' : ''}`}>{isPreviewExploring ? <><Check size={16} /> Sucesso!</> : <>EXPLORAR <ArrowRight size={14} /></>}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'loyalty':
        const loyalty = localSettings.loyalty;
        const spendToReward = loyalty.redemptionCost / (loyalty.pointsPerReal || 1);
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-purple-200"><div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6"><div><div className="flex items-center gap-3 mb-2"><div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Crown size={24} className="text-yellow-300" /></div><h3 className="text-2xl font-black">Clube VIP</h3></div><p className="text-purple-100 max-w-lg leading-relaxed text-sm font-medium">Clientes fiéis gastam 67% mais. Configure seu programa de recompensas.</p></div><div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10"><button onClick={() => setLocalSettings(prev => ({ ...prev, loyalty: { ...prev.loyalty, enabled: !prev.loyalty.enabled } }))} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${loyalty.enabled ? 'bg-emerald-400 text-white' : 'bg-gray-800 text-gray-400'}`}>{loyalty.enabled ? <><CheckCircle2 size={14} /> ATIVO</> : 'INATIVO'}</button></div></div><div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div></div>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 transition-all duration-500 ${!loyalty.enabled ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              <div className="space-y-6"><div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -translate-y-1/2 translate-x-1/2"></div><h4 className="text-lg font-bold text-gray-900 flex items-center gap-2 relative z-10"><Settings size={18} className="text-purple-500" /> Regras do Jogo</h4><div className="space-y-6 relative z-10"><div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Acúmulo de Pontos</label><div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 font-black shadow-sm">R$1</div><ArrowRight size={16} className="text-gray-300" /><div className="flex-1 relative"><input type="number" className="w-full bg-white border-none rounded-xl py-3 pl-4 pr-12 font-black text-xl text-purple-600 outline-none focus:ring-2 focus:ring-purple-200 transition-all text-center shadow-sm" value={loyalty.pointsPerReal} onChange={e => setLocalSettings(prev => ({ ...prev, loyalty: { ...prev.loyalty, pointsPerReal: Math.max(0.1, Number(e.target.value)) } }))} /><span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-purple-300 uppercase">Pts</span></div></div></div><div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Meta para Resgate</label><div className="relative group"><div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-purple-100 text-purple-600 rounded-lg"><Trophy size={16} /></div><input type="number" className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-4 py-4 font-black text-lg text-gray-900 outline-none focus:ring-2 focus:ring-purple-200 transition-all" value={loyalty.redemptionCost} onChange={e => setLocalSettings(prev => ({ ...prev, loyalty: { ...prev.loyalty, redemptionCost: Number(e.target.value) } }))} /><span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">Pontos Necessários</span></div></div><div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Recompensa</label><div className="relative group"><div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-pink-100 text-pink-500 rounded-lg"><Gift size={16} /></div><input type="text" placeholder="Ex: Hidratação Profunda" className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-4 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-pink-200 transition-all" value={loyalty.rewardName} onChange={e => setLocalSettings(prev => ({ ...prev, loyalty: { ...prev.loyalty, rewardName: e.target.value } }))} /></div></div></div></div><div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4 items-start"><div className="p-3 bg-white rounded-2xl text-indigo-500 shadow-sm"><Info size={20} /></div><div><h5 className="font-bold text-indigo-900 text-sm mb-1">Matemática do Sucesso</h5><p className="text-xs text-indigo-700 leading-relaxed">Para ganhar <strong className="text-indigo-900">{loyalty.rewardName || 'o prêmio'}</strong>, o cliente precisa investir <strong className="text-indigo-900">R$ {spendToReward.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</p></div></div></div>
              <div className="bg-gray-900 p-8 rounded-[2.5rem] relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl"><div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500 rounded-full blur-[80px]"></div><div className="absolute -bottom-20 -left-20 w-64 h-64 bg-pink-500 rounded-full blur-[80px]"></div><span className="relative z-10 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-6 block bg-gray-800 px-4 py-2 rounded-full border border-gray-700">Visão do Cliente</span><div className="relative z-10 w-full max-w-xs bg-white rounded-[2rem] p-6 shadow-2xl transform hover:scale-105 transition-transform duration-500"><div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden border-2 border-purple-100"><img src="https://i.pravatar.cc/150?img=5" alt="User" className="w-full h-full object-cover" /></div><div className="text-left"><span className="block text-xs font-bold text-gray-900">Olá, Julia</span><span className="block text-[9px] text-purple-500 font-black uppercase">Cliente VIP</span></div></div><div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-500"><Star size={14} fill="currentColor" /></div></div><div className="text-center mb-6"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seu Saldo</span><div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 my-1">{Math.round(loyalty.redemptionCost * 0.7)}</div><span className="text-xs font-bold text-gray-500">pontos acumulados</span></div><div className="space-y-2 mb-6"><div className="flex justify-between text-[10px] font-bold text-gray-400"><span>Progresso</span><span>70%</span></div><div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden p-0.5"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-[70%] shadow-lg relative overflow-hidden"><div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div></div></div><p className="text-[10px] font-medium text-gray-400">Faltam <span className="text-purple-600 font-bold">{Math.round(loyalty.redemptionCost * 0.3)} pontos</span>.</p></div><div className="bg-purple-50 rounded-2xl p-4 border border-purple-100 flex items-center gap-3"><div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-pink-500 shadow-sm"><Gift size={20} /></div><div className="text-left min-w-0"><span className="block text-[9px] font-black text-purple-400 uppercase tracking-wider">Próximo Prêmio</span><span className="block text-xs font-bold text-purple-900 truncate">{loyalty.rewardName || 'Surpresa Especial'}</span></div></div></div></div>
            </div>
          </div>
        );
      case 'integrations':
        const integrations = localSettings.integrations || {};
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-cyan-200"><div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6"><div><div className="flex items-center gap-3 mb-2"><div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Globe size={24} className="text-white" /></div><h3 className="text-2xl font-black">Conectividade</h3></div><p className="text-cyan-100 max-lg leading-relaxed text-sm font-medium">Sincronize a BellaAI com suas ferramentas favoritas.</p></div><div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[140px]"><span className="block text-[10px] font-black uppercase tracking-widest text-cyan-200 mb-1">Status</span><span className="flex items-center justify-center gap-2 font-bold text-white"><Share2 size={16} fill="currentColor" className="text-cyan-300" /> Ativo</span></div></div><div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/50 rounded-full blur-3xl"></div><div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${integrations.googleCalendar?.enabled ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}><Calendar size={24} /></div><div><h4 className="font-bold text-lg text-gray-900">Google Calendar</h4><p className="text-xs text-gray-400 font-medium">Sincronize sua agenda.</p></div></div>{integrations.googleCalendar?.enabled && <CheckCircle2 size={20} className="text-emerald-500" />}</div><div className="mt-4">{integrations.googleCalendar?.enabled ? (<div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4"><span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block">Última Sincronização</span><span className="text-sm font-bold text-blue-700">{new Date(integrations.googleCalendar.lastSync!).toLocaleString()}</span></div>) : (<p className="text-sm text-gray-500 mb-6 leading-relaxed">Conecte sua conta Google para espelhar seus agendamentos.</p>)}<button onClick={() => toggleIntegration('googleCalendar')} disabled={integratingId === 'googleCalendar'} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${integrations.googleCalendar?.enabled ? 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-[1.02]'}`}>{integratingId === 'googleCalendar' ? <Loader2 size={18} className="animate-spin" /> : integrations.googleCalendar?.enabled ? <><Unlink size={18} /> Desconectar</> : <><Link size={18} /> Conectar</>}</button></div></div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-all"><div className="flex justify-between items-start mb-4"><div className="flex items-center gap-4"><div className={`p-3 rounded-2xl ${integrations.whatsapp?.enabled ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}><MessageCircle size={24} /></div><div><h4 className="font-bold text-lg text-gray-900">WhatsApp API</h4><p className="text-xs text-gray-400 font-medium">Automação de mensagens.</p></div></div>{integrations.whatsapp?.enabled && <CheckCircle2 size={20} className="text-emerald-500" />}</div><div className="mt-4"><div className={`p-4 rounded-xl border mb-4 ${integrations.whatsapp?.enabled ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}><span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-gray-400">Status da Sessão</span><span className={`text-sm font-bold ${integrations.whatsapp?.enabled ? 'text-emerald-600' : 'text-gray-500'}`}>{integrations.whatsapp?.enabled ? 'Conectado • Pronto para Disparos' : 'Aguardando QR Code'}</span></div><button onClick={() => toggleIntegration('whatsapp')} disabled={integratingId === 'whatsapp'} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${integrations.whatsapp?.enabled ? 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-500' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:scale-[1.02]'}`}>{integratingId === 'whatsapp' ? <Loader2 size={18} className="animate-spin" /> : integrations.whatsapp?.enabled ? <><Unlink size={18} /> Desativar</> : <><Link size={18} /> Ativar Integração</>}</button></div></div>
            </div>
          </div>
        );
      case 'financial':
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-teal-200"><div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6"><div><div className="flex items-center gap-3 mb-2"><div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Landmark size={24} className="text-white" /></div><h3 className="text-2xl font-black">Motor Financeiro</h3></div><p className="text-teal-100 max-lg leading-relaxed text-sm font-medium">Configure comissões, Pix e metas.</p></div><div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[140px]"><span className="block text-[10px] font-black uppercase tracking-widest text-emerald-200 mb-1">Moeda Base</span><span className="flex items-center justify-center gap-2 font-bold text-white"><DollarSign size={16} fill="currentColor" className="text-emerald-300" /> BRL (R$)</span></div></div><div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/50 rounded-full blur-3xl"></div><div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[300px] group"><div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div><div className="relative z-10"><div className="flex justify-between items-start mb-8"><QrCode size={40} className="text-[#40E0D0]" /><span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">BellaPay</span></div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Chave Pix Principal</label><input type="text" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 font-mono text-lg text-white outline-none focus:border-[#40E0D0] transition-all" value={localSettings.pixKey} onChange={e => setLocalSettings({ ...localSettings, pixKey: e.target.value })} placeholder="CPF, Email ou Aleatória" /><p className="text-[10px] text-gray-500 mt-2 font-medium">Usada para gerar QR Codes.</p></div><div className="relative z-10 flex justify-between items-end mt-8"><div><span className="block text-[10px] text-gray-400 uppercase">Titular</span><span className="font-bold text-sm tracking-wide">{localSettings.name || 'Studio'}</span></div><div className="flex gap-2"><div className="w-8 h-8 rounded-full bg-white/20"></div><div className="w-8 h-8 rounded-full bg-[#FF69B4]/80"></div></div></div></div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6"><div className="flex items-center gap-3"><div className="p-2 bg-pink-50 rounded-xl text-[#FF69B4]"><Percent size={20} /></div><h4 className="font-bold text-lg text-gray-900">Split de Comissão</h4></div><div className="space-y-4"><div><div className="flex justify-between mb-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Padrão</label><span className="font-black text-[#FF69B4]">{localSettings.commissionDefault} %</span></div><input type="range" min="0" max="100" step="5" className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#FF69B4]" value={localSettings.commissionDefault} onChange={e => setLocalSettings({ ...localSettings, commissionDefault: Number(e.target.value) })} /></div><div className="bg-gray-50 p-5 rounded-2xl border border-gray-100"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Simulação (Serviço R$ 100)</p><div className="flex gap-2"><div className="flex-1 bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm"><span className="block text-xs font-bold text-gray-500">Salão</span><span className="block text-lg font-black text-gray-800">R$ {100 - localSettings.commissionDefault}</span></div><div className="flex items-center text-gray-300 font-bold text-xs">VS</div><div className="flex-1 bg-pink-50 p-3 rounded-xl border border-pink-100 text-center shadow-sm"><span className="block text-xs font-bold text-pink-400">Pro</span><span className="block text-lg font-black text-[#FF69B4]">R$ {localSettings.commissionDefault}</span></div></div></div></div></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between gap-8">
                <div className="space-y-4 flex-1">
                  <CurrencyInput
                    label="Meta Mensal de Faturamento"
                    value={localSettings.monthlyGoal}
                    onChange={val => setLocalSettings({ ...localSettings, monthlyGoal: val })}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div className="w-24 h-24 rounded-full border-8 border-gray-50 flex items-center justify-center relative">
                  <div className="text-center">
                    <span className="block text-[10px] font-bold text-gray-400">Progresso</span>
                    <span className="block text-sm font-black text-purple-500">{goalProgress.actual}%</span>
                  </div>
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      stroke="#C084FC"
                      strokeWidth="8"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (289 * goalProgress.visual / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><FileText size={14} /> Impostos / Taxas</label>
                <div className="relative group">
                  <input type="number" className="w-full bg-gray-50 border-none rounded-2xl pl-4 pr-12 py-4 font-black text-xl text-gray-900 outline-none focus:ring-2 focus:ring-emerald-200 transition-all" value={localSettings.taxRate || 0} onChange={e => setLocalSettings({ ...localSettings, taxRate: Number(e.target.value) })} />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-8 fade-in">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl shadow-indigo-200"><div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6"><div><div className="flex items-center gap-3 mb-2"><div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><BrainCircuit size={24} className="text-cyan-300" /></div><h3 className="text-2xl font-black">BellaAI</h3></div><p className="text-indigo-100 max-lg leading-relaxed text-sm font-medium">Personalize sua assistente virtual.</p></div><div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10 text-center min-w-[140px]"><span className="block text-[10px] font-black uppercase tracking-widest text-cyan-300 mb-1">Status</span><span className="flex items-center justify-center gap-2 font-bold text-white"><Smile size={16} fill="currentColor" className="text-yellow-400" /> Online</span></div></div><div className="absolute -bottom-20 -left-20 w-64 h-64 bg-violet-500/50 rounded-full blur-3xl"></div><div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div></div>
            <div className="space-y-4"><label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Settings size={14} /> Tom de Voz</label><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{ id: 'friendly', label: 'Amigável', desc: 'Usa emojis e muita energia.', icon: Smile }, { id: 'professional', label: 'Elegante', desc: 'Linguagem culta e direta.', icon: Briefcase }, { id: 'zen', label: 'Acolhedor', desc: 'Calmo e empático.', icon: Coffee }].map((tone) => (<button key={tone.id} onClick={() => setLocalSettings({ ...localSettings, aiTone: tone.id as any })} className={`p-6 rounded-[2rem] border-2 text-left transition-all relative overflow-hidden group ${localSettings.aiTone === tone.id ? 'border-violet-500 bg-violet-50' : 'border-gray-100 bg-white hover:border-violet-200'}`}><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${localSettings.aiTone === tone.id ? 'bg-violet-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 group-hover:bg-violet-100'}`}><tone.icon size={24} /></div><h4 className="font-bold text-lg mb-1">{tone.label}</h4><p className="text-xs text-gray-500 font-medium">{tone.desc}</p></button>))}</div></div>
            <div className="space-y-4"><label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={14} /> Conhecimento Específico</label><div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-violet-100 transition-all"><textarea className="w-full h-32 border-none outline-none resize-none text-gray-600 font-medium text-sm bg-transparent" placeholder="Ex: 'Nós usamos apenas produtos veganos'..." value={localSettings.customAiInstructions || ''} onChange={(e) => setLocalSettings({ ...localSettings, customAiInstructions: e.target.value })} /><div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50"><span className="text-[10px] text-gray-400 font-bold uppercase">Dica: Quanto mais detalhes, mais inteligente ela fica.</span><div className="flex items-center gap-2 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase"><Sparkles size={12} /> Auto-Save</div></div></div></div>
          </div>
        );
      case 'general':
        return (
          <div className="space-y-10 fade-in pb-10">
            <div className="space-y-6"><div className="flex items-center justify-between"><label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2"><ImageIcon size={14} /> Identidade Visual</label></div><div className="grid grid-cols-1 lg:grid-cols-5 gap-8"><div className="lg:col-span-3 space-y-6">
              <div className="relative group bg-gradient-to-br from-white to-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200 transition-all hover:border-[#FF69B4]/40 hover:shadow-2xl hover:shadow-pink-50 flex flex-col md:flex-row items-center gap-8"><div className="relative shrink-0"><div className="w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white transition-transform group-hover:scale-105 relative">{isExtractingColors && (<div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center"><div className="w-full h-1 bg-[#FF69B4]/20 absolute top-0 overflow-hidden"><div className="w-1/3 h-full bg-[#FF69B4] animate-[shimmer_1s_infinite]"></div></div><Loader2 size={24} className="text-[#FF69B4] animate-spin mb-2" /><span className="text-[9px] font-black uppercase text-[#FF69B4]">Escaneando...</span></div>)}{localSettings.logo ? (<img src={localSettings.logo} alt="Logo" className="w-full h-full object-contain p-3" />) : (<div className="flex flex-col items-center gap-2"><ImageIcon className="text-gray-200" size={48} /><span className="text-[9px] font-black text-gray-300 uppercase">Logo Vazio</span></div>)}</div>{localSettings.logo && (<button onClick={() => { setLocalSettings({ ...localSettings, logo: undefined }); setExtractedPalette([]); }} className="absolute -top-3 -right-3 p-2.5 bg-white text-rose-500 rounded-full shadow-xl border border-gray-100 hover:bg-rose-500 hover:text-white transition-all transform hover:rotate-12"><Trash2 size={16} /></button>)}</div><div className="flex-1 text-center md:text-left space-y-4"><div><h4 className="text-xl font-black text-gray-900 mb-1 tracking-tight">Marca 💎</h4><p className="text-sm text-gray-400 font-medium leading-relaxed">Faça o upload do seu logo.</p></div><div className="flex flex-wrap gap-3 justify-center md:justify-start"><input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" /><button onClick={() => fileInputRef.current?.click()} className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gray-200 flex items-center gap-2"><Upload size={16} /> Escolher Arquivo</button></div></div></div>{extractedPalette.length > 0 && (<div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500"><div className="flex items-center justify-between mb-4"><h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Paleta Extraída</h5><button onClick={handleResetColors} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1.5 hover:underline"><RefreshCw size={12} /> Resetar</button></div><div className="flex flex-wrap gap-3">{extractedPalette.map((color, i) => (<button key={i} onClick={() => setLocalSettings({ ...localSettings, theme: { ...localSettings.theme!, primaryColor: color } })} className={`w-12 h-12 rounded-2xl shadow-sm border-4 transition-all hover:scale-110 active:scale-95 ${localSettings.theme?.primaryColor === color ? 'border-gray-900' : 'border-white'}`} style={{ backgroundColor: color }} />))}</div></div>)}</div><div className="lg:col-span-2">
                <div className="bg-gray-900 p-8 rounded-[3.5rem] relative overflow-hidden h-full flex flex-col shadow-2xl border border-white/10 group"><div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div><div className="relative z-10 space-y-8 flex-1"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-colors duration-500" style={{ backgroundColor: localSettings.theme?.primaryColor || '#FF69B4' }}><Sparkles size={16} /></div><span className="text-[10px] font-black text-white uppercase tracking-[0.2em] block">Live Preview</span></div><div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden min-h-[160px] flex flex-col justify-center">{mockupView === 'default' && (<div className="animate-in fade-in zoom-in-95 duration-500 space-y-4"><div className="h-4 w-2/3 bg-white/10 rounded-full"></div><div className="flex gap-2"><div className="w-10 h-10 rounded-xl transition-colors duration-500" style={{ backgroundColor: localSettings.theme?.primaryColor || '#FF69B4' }}></div><div className="flex-1 space-y-2"><div className="h-3 w-full bg-white/10 rounded-full"></div><div className="h-3 w-4/5 bg-white/10 rounded-full opacity-50"></div></div></div></div>)}{mockupView === 'booked' && (<div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center justify-center space-y-2 py-2"><div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg animate-bounce"><Check size={24} strokeWidth={4} /></div><span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sucesso!</span><button onClick={() => setMockupView('default')} className="text-[8px] text-gray-500 hover:text-white uppercase font-bold">Voltar</button></div>)}<div className="pt-4 flex gap-2"><button onClick={() => setMockupView('booked')} className="flex-1 py-3 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg transition-all active:scale-90" style={{ backgroundColor: localSettings.theme?.primaryColor || '#FF69B4' }}>Agendar</button></div></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[9px] font-black text-gray-500 uppercase">Cor Primária</label><div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/5"><input type="text" className="w-full bg-transparent text-[10px] font-mono text-white outline-none" value={localSettings.theme?.primaryColor || '#FF69B4'} onChange={(e) => setLocalSettings({ ...localSettings, theme: { ...localSettings.theme!, primaryColor: e.target.value } })} /><div className="w-4 h-4 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: localSettings.theme?.primaryColor || '#FF69B4' }}></div></div></div></div></div><div className="mt-8 pt-8 border-t border-white/10 relative z-10 flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setLocalSettings(prev => ({ ...prev, theme: { ...prev.theme, enabled: !prev.theme?.enabled } as any }))} className={`w-12 h-7 rounded-full relative transition-all duration-300 ${localSettings.theme?.enabled ? 'bg-indigo-500' : 'bg-white/10'}`}><div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm ${localSettings.theme?.enabled ? 'left-6' : 'left-1'}`} /></button><span className="text-[10px] font-black text-white uppercase tracking-widest">Ativar Tema</span></div></div></div></div></div></div><div className="h-px bg-gray-100 w-full" /><div className="space-y-6"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Languages size={14} /> {t.settings.labels.language}</label><div className="flex flex-wrap gap-3">{[{ id: 'pt', label: 'Português', code: 'BR' }, { id: 'en', label: 'English', code: 'US' }, { id: 'es', label: 'Español', code: 'ES' }].map(l => (<button key={l.id} onClick={() => setLang(l.id as Language)} className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all text-sm font-bold group ${lang === l.id ? 'border-[#FF69B4] bg-[#FF69B4]/5 text-[#FF69B4]' : 'border-gray-100 text-gray-400 bg-white'}`}><span className="text-[10px] opacity-40 font-black tracking-tighter">{l.code}</span>{l.label}</button>))}</div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4"><div className="space-y-2 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.settings.labels.salonName}</label><input type="text" className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 outline-none focus:bg-white focus:border-pink-200 transition-all font-bold text-gray-800" value={localSettings.name} onChange={e => setLocalSettings({ ...localSettings, name: e.target.value })} /></div><div className="space-y-2 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.settings.labels.address}</label><input type="text" className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 outline-none focus:bg-white focus:border-pink-200 transition-all font-bold text-gray-800" value={localSettings.address} onChange={e => setLocalSettings({ ...localSettings, address: e.target.value })} /></div><div className="space-y-2 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.settings.labels.whatsapp}</label><input type="tel" className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] px-6 py-4 outline-none focus:bg-white focus:border-pink-200 transition-all font-bold text-gray-800" value={localSettings.phone} onChange={e => setLocalSettings({ ...localSettings, phone: maskPhone(e.target.value) })} /></div><div className="space-y-2 group"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.settings.labels.instagram}</label><div className="relative"><Instagram className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 transition-colors" size={20} /><input type="text" className="w-full bg-gray-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-14 pr-6 outline-none focus:bg-white focus:border-pink-200 transition-all font-bold text-gray-800" value={localSettings.instagram} onChange={e => setLocalSettings({ ...localSettings, instagram: e.target.value })} /></div></div></div>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-8 fade-in"><div className="bg-[#F5F5F5] p-6 rounded-[2.5rem] border border-gray-100 flex items-start gap-4"><div className="p-3 bg-white rounded-2xl shadow-sm text-gray-600"><Lock size={24} /></div><div><h3 className="font-bold text-lg text-gray-900">Permissões de Acesso</h3><p className="text-sm text-gray-500 leading-relaxed max-w-lg mt-1">Configure o perfil Atendente.</p></div></div><div className="grid grid-cols-1 gap-4"><AccessToggle title="Base de Clientes (CRM)" description="Visualizar dados, histórico e pontos." icon={<UsersRound size={20} />} colorClass="text-indigo-500" isActive={localSettings.permissions?.viewCRM || false} onToggle={() => togglePermission('viewCRM')} /><AccessToggle title="Financeiro" description="Acesso a faturamento e relatórios." icon={<CreditCard size={20} />} colorClass="text-emerald-500" isActive={localSettings.permissions?.viewFinancial || false} onToggle={() => togglePermission('viewFinancial')} /><AccessToggle title="Estoque" description="Gerenciar entradas/saídas." icon={<Package size={20} />} colorClass="text-blue-500" isActive={localSettings.permissions?.viewInventory || false} onToggle={() => togglePermission('viewInventory')} /><AccessToggle title="Marketing" description="Acesso ao gerador de copy." icon={<Megaphone size={20} />} colorClass="text-purple-500" isActive={localSettings.permissions?.viewMarketing || false} onToggle={() => togglePermission('viewMarketing')} /><AccessToggle title="Equipe" description="Ver lista de outros profissionais." icon={<Users size={20} />} colorClass="text-orange-500" isActive={localSettings.permissions?.viewStaff || false} onToggle={() => togglePermission('viewStaff')} /><AccessToggle title="Serviços" description="Catálogo de serviços." icon={<BookOpen size={20} />} colorClass="text-[#FF69B4]" isActive={localSettings.permissions?.viewServices || false} onToggle={() => togglePermission('viewServices')} /></div></div>
        );
      case 'users':
        return (
          <div className="space-y-8 fade-in h-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#F5F5F5] p-6 rounded-[2.5rem] border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-900"><User size={24} /></div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Gerenciamento de Usuários</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-lg mt-1">Administre o acesso e funções de todos os usuários do sistema.</p>
                </div>
              </div>
              <button onClick={() => fetchData(true)} className="p-3 bg-white text-gray-400 hover:text-gray-900 rounded-xl transition-all shadow-sm active:scale-95"><RefreshCw size={20} /></button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              {userProfiles.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <User size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-sm">Nenhum usuário encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-50 text-left">
                        <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest w-20">Avatar</th>
                        <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nome / Email</th>
                        <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nível de Acesso</th>
                        <th className="py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userProfiles.map((profile) => (
                        <tr key={profile.id} className="group hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none">
                          <td className="py-4 px-8">
                            {profile.avatar_url ? (
                              <img src={profile.avatar_url} alt={profile.name} className="w-12 h-12 rounded-2xl object-cover shadow-sm border-2 border-white" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 font-black text-lg border-2 border-white">
                                {profile.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-8">
                            <h4 className="font-bold text-gray-900 text-sm">{profile.name}</h4>
                            <p className="text-xs text-gray-400 font-medium">{profile.email || 'Email não informado'}</p>
                          </td>
                          <td className="py-4 px-8">
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5
                              ${profile.role === 'master_admin' ? 'bg-purple-100 text-purple-600' :
                                profile.role === 'company_admin' ? 'bg-indigo-100 text-indigo-600' :
                                  profile.role === 'attendant' ? 'bg-teal-100 text-teal-600' :
                                    'bg-gray-100 text-gray-500'}`}>
                              {profile.role === 'master_admin' && <Crown size={12} />}
                              {profile.role === 'company_admin' && <ShieldCheck size={12} />}
                              {profile.role === 'attendant' && <Briefcase size={12} />}
                              {profile.role === 'client' && <User size={12} />}
                              {profile.role === 'master_admin' ? 'Master Admin' :
                                profile.role === 'company_admin' ? 'Administrador' :
                                  profile.role === 'attendant' ? 'Equipe' : 'Cliente'}
                            </span>
                          </td>
                          <td className="py-4 px-8 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingUser(profile); setIsUserModalOpen(true); }} className="p-2.5 rounded-xl bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all shadow-sm border border-gray-100">
                                <Settings size={16} />
                              </button>
                              <button onClick={() => handleDeleteUser(profile.id)} className="p-2.5 rounded-xl bg-white text-gray-400 hover:text-rose-500 hover:bg-rose-50 active:scale-95 transition-all shadow-sm border border-gray-100">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 lg:space-y-10 pb-10 lg:pb-20">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">{t.settings.title}</h2>
          <p className="text-gray-500 font-medium text-xs lg:text-base">{t.settings.subtitle}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto px-6 lg:px-10 py-3 lg:py-4 bg-gray-900 text-white rounded-[1.8rem] font-black text-xs lg:text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Salvando...' : t.settings.saveBtn}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
        <aside className="lg:w-64 shrink-0 w-full overflow-hidden">
          <div className="bg-white/80 backdrop-blur-md p-2 lg:p-3 rounded-[2rem] lg:rounded-[2.5rem] border border-gray-100 shadow-sm flex lg:flex-col overflow-x-auto no-scrollbar gap-1 sticky top-4 lg:top-8 z-40">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-6 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all font-bold text-xs lg:text-sm whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl scale-[1.02]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
              >
                <tab.icon size={16} /> {tab.label.split(' ')[0]} <span className="hidden lg:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="bg-white/40 backdrop-blur-sm p-5 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-white shadow-sm overflow-hidden">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {showSavedToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 z-[200] border-4 border-white/10">
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <Check size={28} className="text-emerald-400" strokeWidth={4} />
          </div>
          <div>
            <span className="font-black text-lg block leading-none">Salvo com Brilho! ✨</span>
            <span className="text-xs font-medium opacity-60">Suas configurações foram atualizadas.</span>
          </div>
        </div>
      )}

      {/* --- MOVED MODAL OUTSIDE OF BACKDROP CONTAINER --- */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Editar Usuário</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 outline-none focus:bg-white focus:border-indigo-200 transition-all font-bold text-gray-800"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nível de Acesso</label>
                <div className="grid grid-cols-1 gap-3">
                  {[{ id: 'client', label: 'Cliente', icon: User }, { id: 'attendant', label: 'Equipe (Atendente)', icon: Briefcase }, { id: 'company_admin', label: 'Administrador', icon: ShieldCheck }].map(role => (
                    <button
                      key={role.id}
                      onClick={() => setEditingUser({ ...editingUser, role: role.id as any })}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${editingUser.role === role.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
                    >
                      <div className={`p-2 rounded-xl ${editingUser.role === role.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-500'}`}><role.icon size={20} /></div>
                      <div>
                        <span className={`block text-sm font-bold ${editingUser.role === role.id ? 'text-indigo-900' : 'text-gray-700'}`}>{role.label}</span>
                      </div>
                      {editingUser.role === role.id && <CheckCircle2 size={20} className="ml-auto text-indigo-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveUser} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">
                <Save size={18} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
