export type UserRole = 'master_admin' | 'company_admin' | 'attendant' | 'client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone?: string; // Identificação para clientes 'external'
  service: string; // O nome do serviço para exibição
  serviceId?: string; // O ID do serviço no banco
  date: string; // ISO string
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  professionalId?: string; // ID do profissional responsável
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  birthDate?: string; // ISO string (YYYY-MM-DD or MM-DD)
  lastVisit: string;
  totalSpent: number;
  loyaltyPoints: number;
  tags: string[];
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'consumable' | 'resale'; // Insumo (Uso Interno) ou Revenda
  category: string;
  quantity: number;
  unit: string; // un, ml, kg, cx
  minLevel: number; // Nível mínimo para alerta
  costPrice: number; // Preço de custo
  salePrice?: number; // Preço de venda (apenas para resale)
  supplier?: string;
  lastRestock?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category: string;
  notes?: string;
}

export interface BlockedPeriod {
  id: string;
  professionalId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export interface DailySchedule {
  isOff: boolean;
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
  breakStart?: string; // Pausa extra opcional
  breakEnd?: string;
}

export interface WorkSchedule {
  [key: number]: DailySchedule; // 0 (Dom) a 6 (Sáb)
}

export interface Professional {
  id: string;
  name: string;
  role: string;
  specialties: string[]; // Texto livre para exibição rápida
  services: string[]; // IDs dos serviços que o profissional realiza
  commissionRate: number;
  avatar: string;
  rating: number;
  revenueGenerated: number;
  appointmentsCount: number;
  appointmentsGoal?: number;
  blockedPeriods?: BlockedPeriod[];
  schedule?: WorkSchedule; // Nova propriedade de jornada
}

export interface Category {
  id: string;
  label: string;
  iconName: string; // Nome do ícone da Lucide
}

export interface Service {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  description: string;
  color: string;
  anamnesisTemplateId?: string;
}

export interface SalonTheme {
  enabled: boolean;
  primaryColor: string;
  secondaryColor: string;
}

export interface AttendantPermissions {
  viewFinancial: boolean;
  viewInventory: boolean;
  viewMarketing: boolean;
  viewStaff: boolean;
  viewServices: boolean;
  viewCRM: boolean;
}

export interface ReleaseFeature {
  text: string;
  roles: UserRole[] | 'all';
}

export interface ReleaseNote {
  version: string;
  title: string;
  description: string;
  features: ReleaseFeature[];
}

export interface ReleaseNotesConfig {
  enabled: boolean;
  startDate: string;
  endDate: string;
  activeNote: ReleaseNote;
}

export interface IntegrationConfig {
  enabled: boolean;
  accountId?: string;
  lastSync?: string;
}

export interface SalonSettings {
  name: string;
  address: string;
  phone: string;
  aiTone: 'friendly' | 'professional' | 'zen';
  customAiInstructions?: string;
  autoReminders: boolean;
  automations?: {
    reminder24h: boolean;
    confirmation2h: boolean;
    feedbackPostService: boolean;
    birthdayGreeting: boolean;
    reengagement45d: boolean;
  };
  pixKey: string;
  commissionDefault: number;
  taxRate?: number;
  monthlyGoal?: number;
  instagram: string;
  logo?: string;
  theme?: SalonTheme;
  permissions?: AttendantPermissions;
  releaseNotes?: ReleaseNotesConfig;
  integrations?: {
    googleCalendar?: IntegrationConfig;
    whatsapp?: IntegrationConfig;
    instagram?: IntegrationConfig;
    payment?: IntegrationConfig;
  };
  loyalty: {
    enabled: boolean;
    pointsPerReal: number;
    redemptionCost: number;
    rewardName: string;
  };
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  title: string;
  client: string;
  amount: number;
  method: string;
  date: string;
  professionalId?: string;
}

export interface BackupData {
  version: string;
  timestamp: string;
  settings: SalonSettings;
  clients: Client[];
  appointments: Appointment[];
  staff: Professional[];
  services: Service[];
  categories: Category[];
  blockedPeriods: BlockedPeriod[];
  transactions: Transaction[];
  inventory: InventoryItem[];
}

export enum View {
  DASHBOARD = 'dashboard',
  APPOINTMENTS = 'appointments',
  CRM = 'crm',
  STAFF = 'staff',
  SERVICES = 'services',
  FINANCIAL = 'financial',
  MARKETING = 'marketing',
  INVENTORY = 'inventory',
  SETTINGS = 'settings',
  CLIENT_BOOKING = 'client_booking',
  ANAMNESIS = 'anamnesis'
}

export type AnamnesisFieldType = 'text' | 'number' | 'boolean' | 'select' | 'textarea' | 'heading';

export interface AnamnesisField {
  id: string;
  label: string;
  type: AnamnesisFieldType;
  placeholder?: string;
  required: boolean;
  options?: string[]; // Para 'select'
  description?: string;
}

export interface AnamnesisTemplate {
  id: string;
  title: string;
  description: string;
  category: string; // Ex: Sobrancelha, Cílios, Estética
  fields: AnamnesisField[];
  updatedAt: string;
}

export interface AnamnesisRecord {
  id: string;
  templateId: string;
  clientId: string;
  clientName: string;
  answers: Record<string, any>;
  signatureUrl?: string; // Data URL do Canvas
  signedAt: string;
  createdAt: string;
}